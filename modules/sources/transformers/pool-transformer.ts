import { Chain, Prisma, PrismaPoolType } from '@prisma/client';
import { PoolType } from '../subgraphs/balancer-v3-pools/generated/types';
import { StableData } from '../../pool/subgraph-mapper';
import { fx, gyro, element, stable } from '../../pool/pool-data';
import { V3JoinedSubgraphPool } from '../subgraphs';
import { CowAmmPoolFragment } from '../subgraphs/cow-amm/generated/types';
import { zeroAddress } from 'viem';

export const poolV3Transformer = (poolData: V3JoinedSubgraphPool, chain: Chain): Prisma.PrismaPoolCreateInput => {
    let type: PrismaPoolType;
    let typeData: ReturnType<typeof typeDataMapper[keyof typeof typeDataMapper]> | {} = {};

    switch (poolData.factory.type) {
        case PoolType.Weighted:
            type = PrismaPoolType.WEIGHTED;
            break;
        case PoolType.Stable:
            type = PrismaPoolType.STABLE;
            typeData = {
                amp: poolData.amp,
            } as StableData;
            break;
        default:
            type = PrismaPoolType.UNKNOWN;
    }

    return {
        id: poolData.id.toLowerCase(),
        chain: chain,
        protocolVersion: 3,
        address: poolData.id.toLowerCase(),
        decimals: 18,
        symbol: poolData.symbol,
        name: poolData.name,
        owner: zeroAddress, //TODO
        factory: poolData.factory.id.toLowerCase(),
        type: type,
        typeData: typeData,
        version: poolData.factory.version,
        createTime: Number(poolData.blockTimestamp),
        liquidityManagement: poolData.liquidityManagement,
    };
};

export const poolCowTransformer = (poolData: CowAmmPoolFragment, chain: Chain): Prisma.PrismaPoolCreateInput => {
    return {
        id: poolData.id.toLowerCase(),
        chain: chain,
        protocolVersion: 1,
        address: poolData.id.toLowerCase(),
        decimals: 18,
        symbol: poolData.symbol,
        name: poolData.name,
        owner: zeroAddress, //TODO
        factory: poolData.factory.id.toLowerCase(),
        type: 'COW_AMM' as PrismaPoolType,
        typeData: {},
        version: 1,
        createTime: Number(poolData.blockTimestamp),
        liquidityManagement: {},
    };
};

const typeDataMapper = {
    ELEMENT: element,
    FX: fx,
    GYRO: gyro,
    GYRO3: gyro,
    GYROE: gyro,
    STABLE: stable,
    COMPOSABLE_STABLE: stable,
    META_STABLE: stable,
};
