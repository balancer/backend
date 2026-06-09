import { Address, Hex, parseEther, parseUnits } from 'viem';
import { Token } from '@balancer/sdk';
import { HookState, ReClammState, ReClammV2State } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { chainToChainId as chainToIdMap } from '../../../../../config/chain-id-to-chain';
import { TokenPairData } from '../../../../sources/contracts/v3/fetch-tokenpair-data';

import { WAD } from '../../utils/math';
import { BasePoolMethodsV3 } from '../basePoolMethodsV3';
import { PoolTokenWithRate } from '../../utils/poolTokenWithRate';

import { getHookState } from '../../utils/helpers';

import { LiquidityManagement } from '../../../types';
import { BasePoolV3 } from '../basePoolV3';
import { ReclammData } from '../../../../pool/subgraph-mapper';
import { ReClammParams } from './types';

type ReClammPoolToken = PoolTokenWithRate;

export class ReClammPool extends BasePoolV3 implements BasePoolMethodsV3 {
    public readonly reClammParams: ReClammParams;

    public tokens: ReClammPoolToken[];

    private readonly tokenMap: Map<string, ReClammPoolToken>;

    static fromPrismaPool(pool: PrismaPoolAndHookWithDynamic, currentTimestamp: bigint): ReClammPool {
        const poolTokens: ReClammPoolToken[] = [];

        if (!pool.dynamicData) throw new Error(`${pool.type} pool has no dynamic data`);

        for (const poolToken of pool.tokens) {
            if (!poolToken.priceRate) throw new Error(`${pool.type} pool token does not have a price rate`);
            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const amount = parseUnits(poolToken.balance, poolToken.token.decimals);

            poolTokens.push(new PoolTokenWithRate(token, amount, poolToken.index, parseEther(poolToken.priceRate)));
        }

        const totalShares = parseEther(pool.dynamicData.totalShares);

        const reClammData = pool.typeData as ReclammData;

        const reClammParams: ReClammParams = {
            lastTimestamp: BigInt(reClammData.lastTimestamp),
            currentTimestamp,
            lastVirtualBalances: reClammData.lastVirtualBalances.map((balance) => parseEther(balance)),
            dailyPriceShiftBase: parseEther(reClammData.dailyPriceShiftBase),
            centerednessMargin: parseEther(reClammData.centerednessMargin),
            startFourthRootPriceRatio: parseEther(reClammData.startFourthRootPriceRatio),
            endFourthRootPriceRatio: parseEther(reClammData.endFourthRootPriceRatio),
            priceRatioUpdateStartTime: BigInt(reClammData.priceRatioUpdateStartTime),
            priceRatioUpdateEndTime: BigInt(reClammData.priceRatioUpdateEndTime),
        };

        //transform
        const hookState = getHookState(pool);

        return new ReClammPool(
            pool.id as Hex,
            pool.address,
            pool.version === 1 ? 'RECLAMM' : 'RECLAMM_V2',
            pool.chain,
            reClammParams,
            parseEther(pool.dynamicData.swapFee),
            parseEther(pool.dynamicData.aggregateSwapFee),
            poolTokens,
            totalShares,
            pool.dynamicData.tokenPairsData as TokenPairData[],
            pool.liquidityManagement as unknown as LiquidityManagement,
            hookState,
        );
    }

    constructor(
        id: Hex,
        address: string,
        poolType: 'RECLAMM' | 'RECLAMM_V2',
        chain: Chain,
        reClammParams: ReClammParams,
        swapFee: bigint,
        aggregateSwapFee: bigint,
        tokens: ReClammPoolToken[],
        totalShares: bigint,
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
    ) {
        super(
            id,
            address,
            poolType,
            chain,
            swapFee,
            aggregateSwapFee,
            totalShares,
            tokenPairs,
            liquidityManagement,
            hookState,
        );

        this.reClammParams = reClammParams;

        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new PoolTokenWithRate(bpt, totalShares, -1, WAD));

        this.poolState = this.getPoolState(hookState?.hookType);
    }

    public getPoolState(hookName?: string): ReClammState | ReClammV2State {
        const poolState: ReClammState | ReClammV2State = {
            poolType: this.poolType as 'RECLAMM' | 'RECLAMM_V2',
            poolAddress: this.address,
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((t) => t.rate),
            totalSupply: this.totalShares,
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar),
            aggregateSwapFee: this.aggregateSwapFee,
            supportsUnbalancedLiquidity: !this.liquidityManagement.disableUnbalancedLiquidity,
            lastTimestamp: this.reClammParams.lastTimestamp,
            currentTimestamp: this.reClammParams.currentTimestamp,
            lastVirtualBalances: this.reClammParams.lastVirtualBalances,
            dailyPriceShiftBase: this.reClammParams.dailyPriceShiftBase,
            centerednessMargin: this.reClammParams.centerednessMargin,
            startFourthRootPriceRatio: this.reClammParams.startFourthRootPriceRatio,
            endFourthRootPriceRatio: this.reClammParams.endFourthRootPriceRatio,
            priceRatioUpdateStartTime: this.reClammParams.priceRatioUpdateStartTime,
            priceRatioUpdateEndTime: this.reClammParams.priceRatioUpdateEndTime,
        };

        poolState.hookType = hookName;

        return poolState;
    }

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: ReClammPoolToken; tOut: ReClammPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.address);
        const tOut = this.tokenMap.get(tokenOut.address);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }

    public copy(): ReClammPool {
        return new ReClammPool(
            this.id,
            this.address,
            this.poolType as 'RECLAMM' | 'RECLAMM_V2',
            this.chain,
            this.reClammParams,
            this.swapFee,
            this.aggregateSwapFee,
            this.tokens.map((token) => token.copy()),
            this.totalShares,
            this.tokenPairs,
            this.liquidityManagement,
            this.hookState,
        );
    }
}
