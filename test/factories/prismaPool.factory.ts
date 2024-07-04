import { Factory } from 'fishery';
import { PrismaPoolWithDynamic } from '../../prisma/prisma-types';
import { prismaPoolTokenFactory } from './prismaToken.factory';
import { createRandomAddress } from '../utils';

export const prismaPoolFactory = Factory.define<PrismaPoolWithDynamic>(({ params }) => {
    const poolAddress = params.address ?? createRandomAddress();
    return {
        id: poolAddress,
        address: poolAddress,
        symbol: 'TEST-POOL',
        name: 'test pool',
        type: 'WEIGHTED',
        decimals: 18,
        owner: createRandomAddress(),
        factory: createRandomAddress(),
        chain: 'SEPOLIA',
        version: 1,
        protocolVersion: 3,
        typeData: {},
        createTime: 1708433018,
        dynamicData: prismaPoolDynamicDataFactory.build({ id: poolAddress, chain: params?.chain || 'SEPOLIA' }),
        tokens: prismaPoolTokenFactory.buildList(2),
    };
});

export const prismaPoolDynamicDataFactory = Factory.define<PrismaPoolWithDynamic['dynamicData']>(({ params }) => {
    const poolId = params?.id || createRandomAddress();

    return {
        id: poolId,
        poolId,
        blockNumber: 1,
        updatedAt: new Date(),
        swapFee: '0.01',
        swapEnabled: true,
        totalShares: '10000.000000000000000000',
        totalLiquidity: 10000,
        volume24h: 0,
        fees24h: 0,
        surplus24h: 0,
        apr: 0,
        totalSharesNum: 10000,
        fees48h: 100,
        volume48h: 100,
        surplus48h: 0,
        totalLiquidity24hAgo: 10000,
        totalShares24hAgo: '10000.000000000000000000',
        holdersCount: 10,
        lifetimeSwapFees: 1000,
        lifetimeVolume: 100000,
        sharePriceAth: 10,
        sharePriceAtl: 1,
        swapsCount: 1000,
        fees24hAth: 100,
        fees24hAtl: 0,
        totalLiquidityAth: 10000,
        totalLiquidityAtl: 1,
        volume24hAth: 10000,
        volume24hAtl: 0,
        fees24hAthTimestamp: 1710806400,
        fees24hAtlTimestamp: 1705363200,
        sharePriceAthTimestamp: 1710892800,
        sharePriceAtlTimestamp: 1705363200,
        totalLiquidityAthTimestamp: 1707696000,
        totalLiquidityAtlTimestamp: 1705363200,
        volume24hAthTimestamp: 1710806400,
        volume24hAtlTimestamp: 1705363200,
        chain: params?.chain || 'MAINNET',
        yieldCapture24h: 0,
        yieldCapture48h: 0,
        isInRecoveryMode: false,
        isPaused: false,
        protocolYieldFee: '0.5',
        protocolSwapFee: '0.5',
        tokenPairsData: [],
    };
});
