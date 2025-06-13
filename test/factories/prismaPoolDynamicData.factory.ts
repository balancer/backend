import { Factory } from 'fishery';
import { PrismaPoolAndHookWithDynamic } from '../../prisma/prisma-types';
import { createRandomAddress } from '../utils';
import { Chain } from '@prisma/client';

export class PrismaPoolDynamicDataFactory extends Factory<PrismaPoolAndHookWithDynamic['dynamicData']> {}

export const prismaPoolDynamicDataFactory = PrismaPoolDynamicDataFactory.define(({ params }) => {
    const poolId = params?.id || createRandomAddress();

    return {
        id: poolId,
        poolId,
        blockNumber: 1,
        updatedAt: new Date(),
        swapFee: '0.01',
        aggregateSwapFee: '0',
        aggregateYieldFee: '0',
        swapEnabled: true,
        totalShares: '10000.000000000000000000',
        totalLiquidity: 10000,
        volume24h: 0,
        fees24h: 0,
        protocolFees24h: 0,
        surplus24h: 0,
        apr: 0,
        totalSharesNum: 10000,
        fees48h: 100,
        protocolFees48h: 0,
        volume48h: 100,
        surplus48h: 0,
        totalLiquidity24hAgo: 10000,
        totalShares24hAgo: '10000.000000000000000000',
        holdersCount: 10,
        lifetimeSwapFees: 1000,
        lifetimeVolume: 100000,
        swapsCount: 1000,
        chain: Chain.MAINNET,
        yieldCapture24h: 0,
        yieldCapture48h: 0,
        protocolYieldCapture24h: 0,
        protocolYieldCapture48h: 0,
        isInRecoveryMode: false,
        isPaused: false,
        protocolYieldFee: '0.5',
        protocolSwapFee: '0.5',
        tokenPairsData: [],
        fees24hAth: 0,
        fees48hAth: 0,
        volume24hAth: 0,
        volume48hAth: 0,
        sharePriceAth: 0,
        sharePriceAtl: 0,
        sharePriceAthTimestamp: 0,
        sharePriceAtlTimestamp: 0,
        totalLiquidityAth: 0,
        totalLiquidityAtl: 0,
        totalLiquidityAthTimestamp: 0,
        totalLiquidityAtlTimestamp: 0,
        volume24hAtl: 0,
        volume24hAthTimestamp: 0,
        volume24hAtlTimestamp: 0,
        fees24hAthTimestamp: 0,
        fees24hAtl: 0,
        fees24hAtlTimestamp: 0,
    };
});
