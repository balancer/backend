import { Address, Hex, parseEther, parseUnits } from 'viem';

import { BigintIsh, MAX_UINT256, PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { AddKind, RemoveKind, Stable, StableState, Vault } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { chainToIdMap } from '../../../../../network/network-config';
import { StableData } from '../../../../../pool/subgraph-mapper';
import { TokenPairData } from '../../../../../sources/contracts/fetch-tokenpair-data';

import { WAD } from '../../utils/math';
import { BasePoolV3 } from '../../poolsV2/basePool';

export class StablePoolToken extends TokenAmount {
    public readonly rate: bigint;
    public readonly index: number;

    public constructor(token: Token, amount: BigintIsh, rate: BigintIsh, index: number) {
        super(token, amount);
        this.rate = BigInt(rate);
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
        this.index = index;
    }

    public increase(amount: bigint): TokenAmount {
        this.amount = this.amount + amount;
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
        return this;
    }

    public decrease(amount: bigint): TokenAmount {
        this.amount = this.amount - amount;
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
        return this;
    }
}

export class StablePool implements BasePoolV3 {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.Stable;
    public readonly amp: bigint;
    public readonly swapFee: bigint;
    public readonly tokenPairs: TokenPairData[];

    public totalShares: bigint;
    public tokens: StablePoolToken[];

    private readonly tokenMap: Map<string, StablePoolToken>;

    static fromPrismaPool(pool: PrismaPoolWithDynamic): StablePool {
        const poolTokens: StablePoolToken[] = [];

        if (!pool.dynamicData) throw new Error('Stable pool has no dynamic data');

        for (const poolToken of pool.tokens) {
            if (!poolToken.dynamicData?.priceRate) throw new Error('Stable pool token does not have a price rate');
            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const tokenAmount = TokenAmount.fromHumanAmount(token, `${parseFloat(poolToken.dynamicData.balance)}`);

            poolTokens.push(
                new StablePoolToken(
                    token,
                    tokenAmount.amount,
                    parseEther(poolToken.dynamicData.priceRate),
                    poolToken.index,
                ),
            );
        }

        const totalShares = parseEther(pool.dynamicData.totalShares);
        const amp = parseUnits((pool.typeData as StableData).amp, 3);

        return new StablePool(
            pool.id as Hex,
            pool.address,
            pool.chain,
            amp,
            parseEther(pool.dynamicData.swapFee),
            poolTokens,
            totalShares,
            pool.dynamicData.tokenPairsData as TokenPairData[],
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        amp: bigint,
        swapFee: bigint,
        tokens: StablePoolToken[],
        totalShares: bigint,
        tokenPairs: TokenPairData[],
    ) {
        this.chain = chain;
        this.id = id;
        this.address = address;
        this.amp = amp;
        this.swapFee = swapFee;
        this.totalShares = totalShares;

        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
        this.tokenPairs = tokenPairs;

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new StablePoolToken(bpt, totalShares, WAD, -1));
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const poolState = this.getPoolState();
        const stableV3 = new Stable(poolState);

        // remove liquidity
        if (tIn.token.isSameAddress(this.id)) {
            return stableV3.getMaxSingleTokenRemoveAmount(
                swapKind === SwapKind.GivenIn,
                poolState.totalSupply,
                poolState.balancesLiveScaled18[tOut.index],
                poolState.scalingFactors[tOut.index],
                poolState.tokenRates[tOut.index],
            );
        }
        // add liquidity
        if (tOut.token.isSameAddress(this.id)) {
            return stableV3.getMaxSingleTokenAddAmount();
        }
        // swap
        return stableV3.getMaxSwapAmount({
            ...poolState,
            swapKind,
            indexIn: tIn.index,
            indexOut: tOut.index,
        });
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const poolState = this.getPoolState();
        const vault = new Vault();
        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // remove liquidity
            const { amountsOut } = vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOut: Array(poolState.tokens.length).fill(0n),
                    maxBptAmountIn: swapAmount.amount,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_IN,
                },
                poolState,
            );
            calculatedAmount = amountsOut[tOut.index];
        } else if (tOut.token.isSameAddress(this.id)) {
            // add liquidity
            const { bptAmountOut } = vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsIn: poolState.tokens.map((_, i) => (i === tIn.index ? swapAmount.amount : 0n)),
                    minBptAmountOut: 0n,
                    kind: AddKind.UNBALANCED,
                },
                poolState,
            );
            calculatedAmount = bptAmountOut;
        } else {
            // swap
            calculatedAmount = vault.swap(
                {
                    amountRaw: swapAmount.amount,
                    tokenIn: tIn.token.address,
                    tokenOut: tOut.token.address,
                    swapKind: SwapKind.GivenIn,
                },
                poolState,
            );
        }
        return TokenAmount.fromRawAmount(tOut.token, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const poolState = this.getPoolState();
        const vault = new Vault();

        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // remove liquidity
            const { bptAmountIn } = vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOut: poolState.tokens.map((_, i) => (i === tOut.index ? swapAmount.amount : 0n)),
                    maxBptAmountIn: MAX_UINT256,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_OUT,
                },
                poolState,
            );
            calculatedAmount = bptAmountIn;
        } else if (tOut.token.isSameAddress(this.id)) {
            // add liquidity
            const { amountsIn } = vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsIn: Array(poolState.tokens.length).fill(MAX_UINT256),
                    minBptAmountOut: swapAmount.amount,
                    kind: AddKind.SINGLE_TOKEN_EXACT_OUT,
                },
                poolState,
            );
            calculatedAmount = amountsIn[tIn.index];
        } else {
            // swap
            calculatedAmount = vault.swap(
                {
                    amountRaw: swapAmount.amount,
                    tokenIn: tIn.token.address,
                    tokenOut: tOut.token.address,
                    swapKind: SwapKind.GivenOut,
                },
                poolState,
            );
        }
        return TokenAmount.fromRawAmount(tIn.token, calculatedAmount);
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const tokenPair = this.tokenPairs.find(
            (tokenPair) =>
                (tokenPair.tokenA === tIn.token.address && tokenPair.tokenB === tOut.token.address) ||
                (tokenPair.tokenA === tOut.token.address && tokenPair.tokenB === tIn.token.address),
        );

        if (tokenPair) {
            return BigInt(tokenPair.normalizedLiquidity);
        }
        return 0n;
    }

    public getPoolState(): StableState {
        return {
            poolType: 'Stable',
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((t) => t.rate),
            totalSupply: this.totalShares,
            amp: this.amp,
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar * WAD),
            aggregateSwapFee: 0n, // TODO: double check this with John
        };
    }

    private getRequiredTokenPair(tokenIn: Token, tokenOut: Token): { tIn: StablePoolToken; tOut: StablePoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
