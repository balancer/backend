import { Address, Hex, parseEther, parseUnits } from 'viem';
import { PoolType, Token, TokenAmount, WAD } from '@balancer/sdk';
import { HookState } from '@balancer-labs/balancer-maths';
import { BasePoolMethodsV3 } from '../basePoolMethodsV3';
import { WeightedPoolTokenWithRate } from '../weighted/weightedPoolTokenWithRate';
import { LiquidityManagement } from '../../../../sor/types';

import { BasePoolV3 } from '../basePoolV3';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';
import { getHookState } from '../../utils/helpers';

import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { TokenPairData } from '../../../../sources/contracts/v3/fetch-tokenpair-data';

import { LiquidityBootstrappingState } from '@balancer-labs/balancer-maths';
import { LBPoolData } from '../../../../../modules/pool/pool-data/lbpool';

type WeightedPoolToken = WeightedPoolTokenWithRate;

export interface LBPParams {
    projectToken: Address;
    reserveTokenIndex: number;
    projectTokenIndex: number;
    isProjectTokenSwapInBlocked: boolean;
    isSwapEnabled: boolean;
    currentTimestamp: bigint;
    startTime: bigint;
    endTime: bigint;
    startWeights: bigint[];
    endWeights: bigint[];
}

export class LiquidityBootstrappingPoolV3 extends BasePoolV3 implements BasePoolMethodsV3 {
    public readonly poolType: string = 'LIQUIDITY_BOOTSTRAPPING';

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
    public currentTimestamp: bigint;
    public startTime: bigint;
    public endTime: bigint;
    public startWeights: bigint[];
    public endWeights: bigint[];

    static fromPrismaPool(pool: PrismaPoolAndHookWithDynamic, currentTimestamp: bigint): LiquidityBootstrappingPoolV3 {
        const poolTokens: WeightedPoolToken[] = [];

        if (!pool.dynamicData) {
            throw new Error('No dynamic data for pool');
        }

        if (!pool.typeData) {
            throw new Error('No type data for pool');
        }

        //access typeData
        const typeData = pool.typeData as LBPoolData;

        // startweights and endweights need to be available as arrays. API does not provide both
        // so calculate them. Weights sum to 100% 1e16 and are sorted according to the alphbetical order
        // of the pool tokens.
        const SCALE = 1_000_000_000_000_000_000;

        const reserveTokenIndex = 1 - typeData.projectTokenIndex;

        const startWeights: bigint[] = Array(2);
        const endWeights: bigint[] = Array(2);

        startWeights[typeData.projectTokenIndex] = BigInt(typeData.projectTokenStartWeight * SCALE);
        startWeights[reserveTokenIndex] = BigInt(typeData.reserveTokenStartWeight * SCALE);

        endWeights[typeData.projectTokenIndex] = BigInt(typeData.projectTokenEndWeight * SCALE);
        endWeights[reserveTokenIndex] = BigInt(typeData.reserveTokenEndWeight * SCALE);

        pool.tokens.forEach((poolToken, i) => {
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

            // LBPs don't allow tokens with rate providers. Hardcode rate to 1 to stick with
            // WeightedPoolTokenWithRate. API provides cached weights.
            poolTokens.push(
                new WeightedPoolTokenWithRate(
                    token,
                    tokenAmount.amount,
                    poolToken.index,
                    parseEther('1'),
                    parseEther(poolToken.weight),
                ),
            );
        });

        //transform
        const hookState = getHookState(pool);

        const lbpParams: LBPParams = {
            projectToken: typeData.projectToken as Address,
            reserveTokenIndex: typeData.reserveTokenIndex,
            projectTokenIndex: typeData.projectTokenIndex,
            isProjectTokenSwapInBlocked: typeData.isProjectTokenSwapInBlocked,
            isSwapEnabled: pool.dynamicData.swapEnabled,
            currentTimestamp,
            startTime: BigInt(typeData.startTime),
            endTime: BigInt(typeData.endTime),
            startWeights,
            endWeights,
        };

        // Force disableUnbalancedLiquidity to true for LBP pools.
        const liquidityManagement: LiquidityManagement = {
            ...(pool.liquidityManagement as unknown as LiquidityManagement),
            disableUnbalancedLiquidity: true,
        };

        return new LiquidityBootstrappingPoolV3(
            pool.id as Hex,
            pool.address,
            pool.chain,
            parseEther(pool.dynamicData.swapFee),
            parseEther(pool.dynamicData.aggregateSwapFee),
            parseEther(pool.dynamicData.totalShares),
            poolTokens,
            pool.dynamicData.tokenPairsData as TokenPairData[],
            liquidityManagement,
            hookState,
            lbpParams,
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
        lbpParams: LBPParams,
    ) {
        super(id, address, chain, swapFee, aggregateSwapFee, totalShares, tokenPairs, liquidityManagement, hookState);
        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new WeightedPoolTokenWithRate(bpt, totalShares, -1, WAD, 0n));

        this.projectToken = lbpParams.projectToken;
        this.reserveTokenIndex = lbpParams.reserveTokenIndex;
        this.projectTokenIndex = lbpParams.projectTokenIndex;
        this.isProjectTokenSwapInBlocked = lbpParams.isProjectTokenSwapInBlocked;
        this.isSwapEnabled = lbpParams.isSwapEnabled;
        this.currentTimestamp = lbpParams.currentTimestamp;
        this.startTime = lbpParams.startTime;
        this.endTime = lbpParams.endTime;
        this.startWeights = lbpParams.startWeights;
        this.endWeights = lbpParams.endWeights;
        this.poolState = this.getPoolState(hookState?.hookType);
    }

    public getPoolState(hookName?: string): LiquidityBootstrappingState {
        const poolState: LiquidityBootstrappingState = {
            poolType: 'LIQUIDITY_BOOTSTRAPPING',
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
            isProjectTokenSwapInBlocked: this.isProjectTokenSwapInBlocked,
            isSwapEnabled: this.isSwapEnabled,
            currentTimestamp: this.currentTimestamp,
            startTime: this.startTime,
            endTime: this.endTime,
            startWeights: this.startWeights,
            endWeights: this.endWeights,
        };

        poolState.hookType = hookName;

        return poolState;
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
