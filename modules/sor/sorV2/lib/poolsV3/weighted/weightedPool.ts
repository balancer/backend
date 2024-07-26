import { Address, Hex, parseEther } from 'viem';
import { SwapKind, Token, TokenAmount, WAD } from '@balancer/sdk';
import { Vault, Weighted, WeightedState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { GqlPoolType } from '../../../../../../schema';
import { TokenPairData } from '../../../../../sources/contracts/fetch-tokenpair-data';
import { chainToIdMap } from '../../../../../network/network-config';

import { BasePoolV3 } from '../../poolsV2/basePool';
import { WeightedPoolToken } from '../../poolsV2/weighted/weightedPoolToken';

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
            poolTokens.push(
                new WeightedPoolToken(
                    token,
                    tokenAmount.amount,
                    parseEther(poolToken.dynamicData.weight),
                    poolToken.index,
                ),
            );
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
        // add BPT to tokenMap
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new WeightedPoolToken(bpt, totalShares, WAD, -1));
        this.tokenPairs = tokenPairs;
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

    // This method also considers limits on add/remove actions when tOut/tIn are the pool's BPT
    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);
        const bptAmount = this.tokenMap.get(this.id) as WeightedPoolToken;
        const poolState = this.getPoolState();
        const weightedV3 = new Weighted(poolState);

        if (tIn.token.isUnderlyingEqual(bptAmount.token)) {
            return weightedV3.getMaxSingleTokenRemoveAmount(
                swapKind === SwapKind.GivenIn,
                poolState.totalSupply,
                poolState.balancesLiveScaled18[tOut.index],
                poolState.scalingFactors[tOut.index],
                poolState.tokenRates[tOut.index],
            );
        }
        if (tOut.token.isUnderlyingEqual(bptAmount.token)) {
            return weightedV3.getMaxSingleTokenAddAmount();
        }

        return weightedV3.getMaxSwapAmount({
            ...poolState,
            swapKind,
            indexIn: tIn.index,
            indexOut: tOut.index,
        });
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const vault = new Vault();
        const calculatedAmount = vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tIn.token.address,
                tokenOut: tOut.token.address,
                swapKind: SwapKind.GivenIn,
            },
            this.getPoolState(),
        );
        return TokenAmount.fromRawAmount(tOut.token, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const vault = new Vault();
        const calculatedAmount = vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tIn.token.address,
                tokenOut: tOut.token.address,
                swapKind: SwapKind.GivenOut,
            },
            this.getPoolState(),
        );
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
            aggregateSwapFee: 0n, // TODO: double check this with John
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
