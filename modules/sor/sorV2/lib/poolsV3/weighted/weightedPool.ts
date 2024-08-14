import { Address, Hex, parseEther } from 'viem';
import { MAX_UINT256, SwapKind, Token, TokenAmount, WAD } from '@balancer/sdk';
import { AddKind, RemoveKind, Vault, Weighted, WeightedState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { GqlPoolType } from '../../../../../../schema';
import { TokenPairData } from '../../../../../sources/contracts/fetch-tokenpair-data';
import { chainToIdMap } from '../../../../../network/network-config';

import { BasePoolV3 } from '../../poolsV2/basePool';
import { WeightedBasePoolToken } from '../../poolsV2/weighted/weightedBasePoolToken';
import { WeightedErc4626PoolToken } from './weightedErc4626PoolToken';

type WeightedPoolToken = WeightedBasePoolToken | WeightedErc4626PoolToken;

export class WeightedPoolV3 implements BasePoolV3 {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: GqlPoolType = 'WEIGHTED';
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly totalShares: bigint;
    public readonly tokens: WeightedPoolToken[];
    public readonly tokenPairs: TokenPairData[];
    public readonly MAX_IN_RATIO = 300000000000000000n; // 0.3
    public readonly MAX_OUT_RATIO = 300000000000000000n; // 0.3

    private readonly tokenMap: Map<string, WeightedPoolToken>;

    static fromPrismaPool(pool: PrismaPoolWithDynamic): WeightedPoolV3 {
        const poolTokens: WeightedPoolToken[] = [];

        if (!pool.dynamicData) {
            throw new Error('No dynamic data for pool');
        }

        for (const poolToken of pool.tokens) {
            if (!poolToken.dynamicData?.weight) {
                throw new Error('Weighted pool token does not have a weight');
            }

            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const scale18 = parseEther(poolToken.dynamicData.balance);
            const tokenAmount = TokenAmount.fromScale18Amount(token, scale18);
            if (poolToken.token.underlyingTokenAddress) {
                // erc4626 token
                poolTokens.push(
                    new WeightedErc4626PoolToken(
                        token,
                        tokenAmount.amount,
                        poolToken.index,
                        parseEther(poolToken.dynamicData.priceRate),
                        poolToken.token.underlyingTokenAddress,
                        parseEther(poolToken.dynamicData.weight),
                    ),
                );
            } else {
                poolTokens.push(
                    new WeightedBasePoolToken(
                        token,
                        tokenAmount.amount,
                        poolToken.index,
                        parseEther(poolToken.dynamicData.weight),
                    ),
                );
            }
        }

        return new WeightedPoolV3(
            pool.id as Hex,
            pool.address,
            pool.chain,
            pool.version,
            parseEther(pool.dynamicData.swapFee),
            parseEther(pool.dynamicData.totalShares),
            poolTokens,
            pool.dynamicData.tokenPairsData as TokenPairData[],
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        poolTypeVersion: number,
        swapFee: bigint,
        totalShares: bigint,
        tokens: WeightedPoolToken[],
        tokenPairs: TokenPairData[],
    ) {
        this.chain = chain;
        this.id = id;
        this.poolTypeVersion = poolTypeVersion;
        this.address = address;
        this.swapFee = swapFee;
        this.totalShares = totalShares;
        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));
        this.tokenPairs = tokenPairs;

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new WeightedBasePoolToken(bpt, totalShares, -1, 0n));
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

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const poolState = this.getPoolState();
        const vault = new Vault();

        // remove liquidity
        if (tIn.token.isSameAddress(this.id)) {
            return vault.getMaxSingleTokenRemoveAmount(
                {
                    isExactIn: swapKind === SwapKind.GivenIn,
                    totalSupply: poolState.totalSupply,
                    tokenOutBalance: poolState.balancesLiveScaled18[tOut.index],
                    tokenOutScalingFactor: poolState.scalingFactors[tOut.index],
                    tokenOutRate: poolState.tokenRates[tOut.index],
                },
                poolState,
            );
        }
        // add liquidity
        if (tOut.token.isSameAddress(this.id)) {
            return vault.getMaxSingleTokenAddAmount(poolState);
        }
        // swap
        return vault.getMaxSwapAmount(
            {
                swapKind,
                balancesLiveScaled18: poolState.balancesLiveScaled18,
                tokenRates: poolState.tokenRates,
                scalingFactors: poolState.scalingFactors,
                indexIn: tIn.index,
                indexOut: tOut.index,
            },
            poolState,
        );
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const poolState = this.getPoolState();
        const vault = new Vault();
        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // remove liquidity
            const { amountsOutRaw } = vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOutRaw: poolState.tokens.map((_, i) => (i === tOut.index ? 1n : 0n)),
                    maxBptAmountInRaw: swapAmount.amount,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_IN,
                },
                poolState,
            );
            calculatedAmount = amountsOutRaw[tOut.index];
        } else if (tOut.token.isSameAddress(this.id)) {
            // add liquidity
            const { bptAmountOutRaw } = vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsInRaw: poolState.tokens.map((_, i) => (i === tIn.index ? swapAmount.amount : 0n)),
                    minBptAmountOutRaw: 0n,
                    kind: AddKind.UNBALANCED,
                },
                poolState,
            );
            calculatedAmount = bptAmountOutRaw;
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
            const { bptAmountInRaw } = vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOutRaw: poolState.tokens.map((_, i) => (i === tOut.index ? swapAmount.amount : 0n)),
                    maxBptAmountInRaw: MAX_UINT256,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_OUT,
                },
                poolState,
            );
            calculatedAmount = bptAmountInRaw;
        } else if (tOut.token.isSameAddress(this.id)) {
            // add liquidity
            const { amountsInRaw } = vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsInRaw: poolState.tokens.map((_, i) => (i === tIn.index ? MAX_UINT256 : 0n)),
                    minBptAmountOutRaw: swapAmount.amount,
                    kind: AddKind.SINGLE_TOKEN_EXACT_OUT,
                },
                poolState,
            );
            calculatedAmount = amountsInRaw[tIn.index];
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

    public getPoolState(): WeightedState {
        return {
            poolType: 'Weighted',
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((_) => WAD),
            totalSupply: this.totalShares,
            weights: this.tokens.map((t) => t.weight),
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar * WAD),
            aggregateSwapFee: 0n,
        };
    }

    // Helper methods

    public getRequiredTokenPair(tokenIn: Token, tokenOut: Token): { tIn: WeightedPoolToken; tOut: WeightedPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
