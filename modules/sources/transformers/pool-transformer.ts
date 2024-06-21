import { Chain, PrismaPoolType } from '@prisma/client';
import { PoolType } from '../subgraphs/balancer-v3-pools/generated/types';
import { StableData } from '../../pool/subgraph-mapper';
import { fx, gyro, element, stable } from '../../pool/pool-data';
import { JoinedSubgraphPool } from '../subgraphs';

export const poolTransformer = (poolData: JoinedSubgraphPool, chain: Chain) => {
    let type: PrismaPoolType;
    let typeData: ReturnType<typeof typeDataMapper[keyof typeof typeDataMapper]> | {} = {};

    switch (poolData.factory.type) {
        case PoolType.Weighted:
            type = PrismaPoolType.WEIGHTED;
            break;
        case PoolType.Stable:
            type = PrismaPoolType.STABLE;
            typeData = {
                amp: '10', // TODO just a place holder
            } as StableData;
            break;
        case 'COW_AMM':
            type = PrismaPoolType.COW_AMM;
            break;
        default:
            type = PrismaPoolType.UNKNOWN;
    }

    return {
        id: poolData.id.toLowerCase(),
        chain: chain,
        vaultVersion: type === PrismaPoolType.COW_AMM ? 1 : 3,
        protocolVersion: type === PrismaPoolType.COW_AMM ? 1 : 3,
        address: poolData.id.toLowerCase(),
        decimals: 18,
        symbol: poolData.symbol,
        name: poolData.name,
        owner: poolData.id.toLowerCase(), //TODO
        factory: poolData.factory.id.toLowerCase(),
        type: type,
        typeData: typeData,
        version: poolData.factory.version,
        createTime: Number(poolData.blockTimestamp),
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
