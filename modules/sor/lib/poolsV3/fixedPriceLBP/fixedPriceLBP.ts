import { Address, Hex, parseEther, parseUnits } from 'viem';
import { Token, TokenAmount, WAD } from '@balancer/sdk';
import { FixedPriceLBPState, HookState } from '@balancer-labs/balancer-maths';
import { BasePoolMethodsV3 } from '../basePoolMethodsV3';
import { WeightedPoolTokenWithRate } from '../weighted/weightedPoolTokenWithRate';
import { LiquidityManagement } from '../../../types';

import { BasePoolV3 } from '../basePoolV3';
import { chainToChainId as chainToIdMap } from '../../../../../config/chain-id-to-chain';
import { getHookState } from '../../utils/helpers';

import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { TokenPairData } from '../../../../sources/contracts/v3/fetch-tokenpair-data';

import { PoolTokenWithRate } from '../../utils';
import { FixedLBPData } from '../../../../pool/pool-data';

export interface FixedPriceLBPParams {
    projectToken: Address;
    reserveTokenIndex: number;
    projectTokenIndex: number;
    isProjectTokenSwapInBlocked: boolean;
    isSwapEnabled: boolean;
    currentTimestamp: bigint;
    startTime: bigint;
    endTime: bigint;
    projectTokenRate: bigint;
}

export class FixedPriceLBPPoolV3 extends BasePoolV3 implements BasePoolMethodsV3 {
    public readonly tokens: PoolTokenWithRate[];
    private readonly tokenMap: Map<string, PoolTokenWithRate>;

    public projectToken: Address;
    public reserveTokenIndex: number;
    public projectTokenIndex: number;
    public isProjectTokenSwapInBlocked: boolean;
    public isSwapEnabled: boolean;
    public currentTimestamp: bigint;
    public startTime: bigint;
    public endTime: bigint;
    public projectTokenRate: bigint;

    static fromPrismaPool(pool: PrismaPoolAndHookWithDynamic, currentTimestamp: bigint): FixedPriceLBPPoolV3 {
        const poolTokens: PoolTokenWithRate[] = [];

        if (!pool.dynamicData) {
            throw new Error('No dynamic data for pool');
        }

        if (!pool.typeData) {
            throw new Error('No type data for pool');
        }

        //access typeData
        const typeData = pool.typeData as FixedLBPData;

        pool.tokens.forEach((poolToken, i) => {
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
            poolTokens.push(new PoolTokenWithRate(token, tokenAmount.amount, poolToken.index, parseEther('1')));
        });

        //transform
        const hookState = getHookState(pool);

        const lbpParams: FixedPriceLBPParams = {
            projectToken: typeData.projectToken as Address,
            reserveTokenIndex: typeData.reserveTokenIndex,
            projectTokenIndex: typeData.projectTokenIndex,
            isProjectTokenSwapInBlocked: typeData.isProjectTokenSwapInBlocked,
            isSwapEnabled: pool.dynamicData.swapEnabled,
            currentTimestamp,
            startTime: BigInt(typeData.startTime),
            endTime: BigInt(typeData.endTime),
            projectTokenRate: parseUnits(typeData.projectTokenRate, 18),
        };

        // Force disableUnbalancedLiquidity to true for LBP pools.
        const liquidityManagement: LiquidityManagement = {
            ...(pool.liquidityManagement as unknown as LiquidityManagement),
            disableUnbalancedLiquidity: true,
        };

        return new FixedPriceLBPPoolV3(
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
        tokens: PoolTokenWithRate[],
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
        fixedPriceLBPParams: FixedPriceLBPParams,
    ) {
        super(
            id,
            address,
            'FIXED_LBP',
            chain,
            swapFee,
            aggregateSwapFee,
            totalShares,
            tokenPairs,
            liquidityManagement,
            hookState,
        );
        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new WeightedPoolTokenWithRate(bpt, totalShares, -1, WAD, 0n));

        this.projectToken = fixedPriceLBPParams.projectToken;
        this.reserveTokenIndex = fixedPriceLBPParams.reserveTokenIndex;
        this.projectTokenIndex = fixedPriceLBPParams.projectTokenIndex;
        this.isProjectTokenSwapInBlocked = fixedPriceLBPParams.isProjectTokenSwapInBlocked;
        this.isSwapEnabled = fixedPriceLBPParams.isSwapEnabled;
        this.currentTimestamp = fixedPriceLBPParams.currentTimestamp;
        this.startTime = fixedPriceLBPParams.startTime;
        this.endTime = fixedPriceLBPParams.endTime;
        this.projectTokenRate = fixedPriceLBPParams.projectTokenRate;
        this.poolState = this.getPoolState(hookState?.hookType);
    }

    public getPoolState(hookName?: string): FixedPriceLBPState {
        const poolState: FixedPriceLBPState = {
            poolType: 'FIXED_PRICE_LBP',
            poolAddress: this.address,
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar),
            tokenRates: this.tokens.map((t) => ('rate' in t ? t.rate : WAD)),
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            swapFee: this.swapFee,
            aggregateSwapFee: this.aggregateSwapFee,
            totalSupply: this.totalShares,
            supportsUnbalancedLiquidity: !this.liquidityManagement.disableUnbalancedLiquidity,
            projectTokenIndex: this.projectTokenIndex,
            isSwapEnabled: this.isSwapEnabled,
            currentTimestamp: this.currentTimestamp,
            startTime: this.startTime,
            endTime: this.endTime,
            projectTokenRate: this.projectTokenRate,
            reserveTokenIndex: this.reserveTokenIndex,
        };

        poolState.hookType = hookName;

        return poolState;
    }

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: PoolTokenWithRate; tOut: PoolTokenWithRate } {
        const tIn = this.tokenMap.get(tokenIn.address);
        const tOut = this.tokenMap.get(tokenOut.address);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
