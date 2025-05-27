import { Address, Hex, parseEther } from 'viem';
import { Token, TokenAmount, WAD } from '@balancer/sdk';
import { QuantAmmState, HookState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { TokenPairData } from '../../../../sources/contracts/v3/fetch-tokenpair-data';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';

import { BasePoolMethodsV3 } from '../basePoolMethodsV3';

import { getHookState } from '../../utils/helpers';

import { LiquidityManagement } from '../../../types';
import { BasePoolV3 } from '../basePoolV3';
import { WeightedPoolTokenWithRate } from '../weighted/weightedPoolTokenWithRate';
import { QuantAmmWeightedData } from '../../../../pool/subgraph-mapper';
import { QuantAmmWeightedParams } from './types';

type QuantAmmPoolToken = WeightedPoolTokenWithRate;

export class QuantAmmPool extends BasePoolV3 implements BasePoolMethodsV3 {
    public readonly poolType = 'QUANT_AMM_WEIGHTED';
    public readonly quantAmmParams: QuantAmmWeightedParams;

    public readonly tokens: QuantAmmPoolToken[];
    private readonly tokenMap: Map<string, QuantAmmPoolToken>;

    static fromPrismaPool(pool: PrismaPoolAndHookWithDynamic, currentTimestamp: bigint): QuantAmmPool {
        const poolTokens: QuantAmmPoolToken[] = [];

        if (!pool.dynamicData) {
            throw new Error(`${pool.type} pool has no dynamic data`);
        }

        for (const poolToken of pool.tokens) {
            if (!poolToken.weight) {
                throw new Error('QuantAmm pool token does not have a weight');
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

        const quantAmmData = pool.typeData as QuantAmmWeightedData;

        const firstFourWeightsAndMultipliers = quantAmmData.firstFourWeightsAndMultipliers?.map((w) => parseEther(w));
        const secondFourWeightsAndMultipliers = quantAmmData.secondFourWeightsAndMultipliers?.map((m) => parseEther(m));

        if (!firstFourWeightsAndMultipliers || !secondFourWeightsAndMultipliers) {
            throw new Error('QuantAmm weights and multipliers must be defined');
        }

        const quantAmmParams: QuantAmmWeightedParams = {
            firstFourWeightsAndMultipliers,
            secondFourWeightsAndMultipliers,
            lastUpdateTime: BigInt(quantAmmData.lastUpdateIntervalTime),
            lastInteropTime: BigInt(quantAmmData.lastInterpolationTimePossible),
            currentTimestamp,
            maxTradeSizeRatio: parseEther(quantAmmData.maxTradeSizeRatio),
        };

        //transform
        const hookState = getHookState(pool);

        return new QuantAmmPool(
            pool.id as Hex,
            pool.address,
            pool.chain,
            parseEther(pool.dynamicData.swapFee),
            parseEther(pool.dynamicData.aggregateSwapFee),
            parseEther(pool.dynamicData.totalShares),
            quantAmmParams,
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
        quantAmmParams: QuantAmmWeightedParams,
        tokens: QuantAmmPoolToken[],
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
    ) {
        super(id, address, chain, swapFee, aggregateSwapFee, totalShares, tokenPairs, liquidityManagement, hookState);
        this.quantAmmParams = quantAmmParams;

        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new WeightedPoolTokenWithRate(bpt, totalShares, -1, WAD, 0n));

        this.poolState = this.getPoolState(hookState?.hookType);
    }

    public getPoolState(hookName?: string): QuantAmmState {
        const poolState: QuantAmmState = {
            poolType: 'QUANT_AMM_WEIGHTED',
            poolAddress: this.address,
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((t) => ('rate' in t ? t.rate : WAD)),
            totalSupply: this.totalShares,
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar),
            aggregateSwapFee: this.aggregateSwapFee,
            supportsUnbalancedLiquidity: !this.liquidityManagement.disableUnbalancedLiquidity,
            firstFourWeightsAndMultipliers: this.quantAmmParams.firstFourWeightsAndMultipliers,
            secondFourWeightsAndMultipliers: this.quantAmmParams.secondFourWeightsAndMultipliers,
            lastUpdateTime: this.quantAmmParams.lastUpdateTime,
            lastInteropTime: this.quantAmmParams.lastInteropTime,
            currentTimestamp: this.quantAmmParams.currentTimestamp,
            maxTradeSizeRatio: this.quantAmmParams.maxTradeSizeRatio,
        };

        poolState.hookType = hookName;

        return poolState;
    }

    // Helper methods

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: QuantAmmPoolToken; tOut: QuantAmmPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
