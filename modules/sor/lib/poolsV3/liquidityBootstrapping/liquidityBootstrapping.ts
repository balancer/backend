import { Address, Hex, parseEther, parseUnits } from 'viem';
import { PoolType, Token, TokenAmount, WAD } from '@balancer/sdk';
import { HookState } from '@balancer-labs/balancer-maths';
import { BasePoolMethodsV3 } from '../basePoolMethodsV3';
import { WeightedPoolTokenWithRate } from '../weighted/weightedPoolTokenWithRate';
import { WeightedErc4626PoolToken } from '../weighted/weightedErc4626PoolToken';
import { LiquidityManagement } from '../../../../sor/types';

import { BasePoolV3 } from '../basePoolV3';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';
import { getHookState } from '../../utils/helpers';

import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { TokenPairData } from '../../../../sources/contracts/v3/fetch-tokenpair-data';

import { LiquidityBootstrappingState } from '../../../../../test/testData/read/readTestData';
import { LBPoolData } from '../../../../../modules/pool/pool-data/lbpool';

type WeightedPoolToken = WeightedPoolTokenWithRate | WeightedErc4626PoolToken;

export class LiquidityBootstrappingPoolV3 extends BasePoolV3 implements BasePoolMethodsV3 {
    public readonly poolType: PoolType = PoolType.LiquidityBootstrapping;

    // LBP is also a weighted pool
    public readonly MAX_IN_RATIO = 300000000000000000n; // 0.3
    public readonly MAX_OUT_RATIO = 300000000000000000n; // 0.3

    public readonly tokens: WeightedPoolToken[];
    private readonly tokenMap: Map<string, WeightedPoolToken>;

    public projectToken: Address;
    public reserveTokenIndex: number;
    public projectTokenIndex: number;
    public isProjectTokenSwapInBlocked: boolean;
    public isSwapEnabled: boolean;

    static fromPrismaPool(
        pool: PrismaPoolAndHookWithDynamic,
        underlyingTokens: { address: string; decimals: number }[] = [],
    ): LiquidityBootstrappingPoolV3 {
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
                    throw new Error('SOR - ERC4626 underlying token not found');
                }
            } else {
                poolTokens.push(
                    new WeightedPoolTokenWithRate(
                        token,
                        tokenAmount.amount,
                        poolToken.index,
                        parseEther(poolToken.priceRate),
                        parseEther(poolToken.weight),
                    ),
                );
            }
        }

        //transform
        const hookState = getHookState(pool);

        //access typeData
        const typeData = pool.typeData as LBPoolData;

        return new LiquidityBootstrappingPoolV3(
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
            typeData.projectToken as Address,
            typeData.reserveTokenIndex,
            typeData.projectTokenIndex,
            typeData.isProjectTokenSwapInBlocked,
            pool.dynamicData.swapEnabled,
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
        projectToken: Address,
        reserveTokenIndex: number,
        projectTokenIndex: number,
        isProjectTokenSwapInBlocked: boolean,
        isSwapEnabled: boolean,
    ) {
        super(id, address, chain, swapFee, aggregateSwapFee, totalShares, tokenPairs, liquidityManagement, hookState);
        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new WeightedPoolTokenWithRate(bpt, totalShares, -1, WAD, 0n));

        this.poolState = this.getPoolState(hookState?.hookType);
        this.projectToken = projectToken;
        this.reserveTokenIndex = reserveTokenIndex;
        this.projectTokenIndex = projectTokenIndex;
        this.isProjectTokenSwapInBlocked = isProjectTokenSwapInBlocked;
        this.isSwapEnabled = isSwapEnabled;
    }

    public getPoolState(hookName?: string): LiquidityBootstrappingState {
        const poolState: LiquidityBootstrappingState = {
            poolType: 'WEIGHTED',
            poolAddress: this.address,
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar),
            tokenRates: this.tokens.map((t) => ('rate' in t ? t.rate : WAD)),
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            swapFee: this.swapFee,
            aggregateSwapFee: this.aggregateSwapFee,
            totalSupply: this.totalShares,
            weights: this.tokens.map((t) => t.weight),
            supportsUnbalancedLiquidity: !this.liquidityManagement.disableUnbalancedLiquidity,
            projectTokenIndex: this.projectTokenIndex,
            reserveTokenIndex: this.reserveTokenIndex,
            isProjectTokenSwapInBlocked: this.isProjectTokenSwapInBlocked,
        };

        poolState.hookType = hookName;

        return poolState;
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        // has the LBP started already? Indicated by swapEnabled
        if (!this.isSwapEnabled) {
            throw new Error('LBP has not started yet');
        }

        // project token swap in can be blocked so check for it here
        if (this.isProjectTokenSwapInBlocked && tokenIn.isSameAddress(this.projectToken)) {
            throw new Error('Project token swap in is blocked');
        }

        // handle add & remove liquidity paths

        // call into BasePoolV3 to do the swap
        return super.swapGivenIn(tokenIn, tokenOut, swapAmount);
    }
    swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        // has the LBP started already? Indicated by swapEnabled
        if (!this.isSwapEnabled) {
            throw new Error('LBP has not started yet');
        }

        if (this.isProjectTokenSwapInBlocked && tokenIn.isSameAddress(this.projectToken)) {
            throw new Error('Project token swap in is blocked');
        }

        // handle add & remove liquidity paths

        // call into BasePoolV3 to do the swap
        // this includes potential for adding and removing liquidity paths
        return super.swapGivenOut(tokenIn, tokenOut, swapAmount);
    }

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: WeightedPoolToken; tOut: WeightedPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
