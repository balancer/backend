import { Address, Hex, parseEther, parseUnits } from 'viem';

import { BigintIsh, PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { Stable, StableState, Vault } from '@balancer-labs/balancer-maths';
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
    private readonly tokenIndexMap: Map<string, number>;

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
            const scale18 = parseEther(poolToken.dynamicData.balance);
            const tokenAmount = TokenAmount.fromScale18Amount(token, scale18);

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
        this.tokenIndexMap = new Map(this.tokens.map((token) => [token.token.address, token.index]));

        this.tokenPairs = tokenPairs;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const poolState = this.getPoolState();
        const stableV3 = new Stable(poolState);
        return stableV3.getMaxSwapAmount({
            ...poolState,
            swapKind,
            indexIn: this.tokens.findIndex((t) => t.token.isEqual(tokenIn)),
            indexOut: this.tokens.findIndex((t) => t.token.isEqual(tokenOut)),
        });
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const vault = new Vault();
        const calculatedAmount = vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                swapKind: SwapKind.GivenIn,
            },
            this.getPoolState(),
        );
        return TokenAmount.fromRawAmount(tokenOut, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const vault = new Vault();
        const calculatedAmount = vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                swapKind: SwapKind.GivenOut,
            },
            this.getPoolState(),
        );
        return TokenAmount.fromRawAmount(tokenIn, calculatedAmount);
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');

        const tokenPair = this.tokenPairs.find(
            (tokenPair) => tokenPair.tokenA === tIn.token.address && tokenPair.tokenB === tOut.token.address,
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
            aggregateSwapFee: 0n,
        };
    }
}
