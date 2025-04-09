import { Address, Hex, parseEther, parseUnits } from 'viem';
import { PoolType, Token, TokenAmount, WAD } from '@balancer/sdk';
import { Vault, WeightedState, HookState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { TokenPairData } from '../../../../sources/contracts/v3/fetch-tokenpair-data';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';

import { BasePoolMethodsV3 } from '../basePoolMethodsV3';
import { WeightedBasePoolToken } from '../../poolsV2/weighted/weightedBasePoolToken';
import { WeightedErc4626PoolToken } from './weightedErc4626PoolToken';

import { getHookState } from '../../utils/helpers';

import { LiquidityManagement } from '../../../../sor/types';
import { BasePoolV3 } from '../basePoolV3';

type WeightedPoolToken = WeightedBasePoolToken | WeightedErc4626PoolToken;

export class WeightedPoolV3 extends BasePoolV3 implements BasePoolMethodsV3 {
    public readonly poolType: PoolType = PoolType.Weighted;

    public readonly MAX_IN_RATIO = 300000000000000000n; // 0.3
    public readonly MAX_OUT_RATIO = 300000000000000000n; // 0.3

    public readonly tokens: WeightedPoolToken[];
    private readonly tokenMap: Map<string, WeightedPoolToken>;

    static fromPrismaPool(
        pool: PrismaPoolAndHookWithDynamic,
        underlyingTokens: { address: string; decimals: number }[] = [],
    ): WeightedPoolV3 {
        const poolTokens: WeightedPoolToken[] = [];

        if (!pool.dynamicData) {
            throw new Error('No dynamic data for pool');
        }

        for (const poolToken of pool.tokens) {
            if (!poolToken.weight) {
                throw new Error('Weighted pool token does not have a weight');
            }

            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const scale18 = parseEther(poolToken.balance);
            const tokenAmount = TokenAmount.fromScale18Amount(token, scale18);
            if (poolToken.token.underlyingTokenAddress) {
                const underlyingToken = underlyingTokens.find(
                    (token) => token.address === poolToken.token.underlyingTokenAddress,
                );
                if (underlyingToken) {
                    const unwrapRateDecimals = 18 - poolToken.token.decimals + underlyingToken.decimals;
                    // erc4626 token
                    poolTokens.push(
                        new WeightedErc4626PoolToken(
                            token,
                            tokenAmount.amount,
                            poolToken.index,
                            parseEther(poolToken.priceRate),
                            parseUnits(poolToken.token.unwrapRate, unwrapRateDecimals),
                            poolToken.token.underlyingTokenAddress,
                            parseEther(poolToken.weight),
                        ),
                    );
                } else {
                    poolTokens.push(
                        new WeightedBasePoolToken(
                            token,
                            tokenAmount.amount,
                            poolToken.index,
                            parseEther(poolToken.weight),
                        ),
                    );
                }
            } else {
                poolTokens.push(
                    new WeightedBasePoolToken(token, tokenAmount.amount, poolToken.index, parseEther(poolToken.weight)),
                );
            }
        }

        //transform
        const hookState = getHookState(pool);

        return new WeightedPoolV3(
            pool.id as Hex,
            pool.address,
            pool.chain,
            parseEther(pool.dynamicData.swapFee),
            parseEther(pool.dynamicData.aggregateSwapFee),
            parseEther(pool.dynamicData.totalShares),
            poolTokens,
            pool.dynamicData.tokenPairsData as TokenPairData[],
            pool.liquidityManagement as unknown as LiquidityManagement,
            hookState,
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        swapFee: bigint,
        aggregateSwapFee: bigint,
        totalShares: bigint,
        tokens: WeightedPoolToken[],
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
    ) {
        super(id, address, chain, swapFee, aggregateSwapFee, totalShares, tokenPairs, liquidityManagement, hookState);
        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new WeightedBasePoolToken(bpt, totalShares, -1, 0n));

        this.poolState = this.getPoolState(hookState?.hookType);
    }

    public getPoolState(hookName?: string): WeightedState {
        const poolState: WeightedState = {
            poolType: 'WEIGHTED',
            poolAddress: this.address,
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((t) => ('rate' in t ? t.rate : WAD)),
            totalSupply: this.totalShares,
            weights: this.tokens.map((t) => t.weight),
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar),
            aggregateSwapFee: this.aggregateSwapFee,
            supportsUnbalancedLiquidity: !this.liquidityManagement.disableUnbalancedLiquidity,
        };

        poolState.hookType = hookName;

        return poolState;
    }

    // Helper methods

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: WeightedPoolToken; tOut: WeightedPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
