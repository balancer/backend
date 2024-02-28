import { Chain, PrismaPool, PrismaPoolType } from '@prisma/client';
import { VaultPoolFragment as VaultSubgraphPoolFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import {
    TypePoolFragment as PoolSubgraphPoolFragment,
    PoolType,
} from '../../subgraphs/balancer-v3-pools/generated/types';
import { StableData } from '../../pool/subgraph-mapper';
import { fx, gyro, linear, element, stable } from '../../pool/pool-data';

export const poolTransformer = (
    vaultSubgraphPool: VaultSubgraphPoolFragment,
    poolSubgraphPool: PoolSubgraphPoolFragment,
    chain: Chain,
) => {
    let type: PrismaPoolType;
    let typeData: ReturnType<typeof typeDataMapper[keyof typeof typeDataMapper]> | {} = {};

    switch (poolSubgraphPool.factory.type) {
        case PoolType.Weighted:
            type = PrismaPoolType.WEIGHTED;
            break;
        case PoolType.Stable:
            type = PrismaPoolType.STABLE;
            typeData = {
                amp: '10', // TODO just a place holder
            } as StableData;
            break;
        default:
            type = PrismaPoolType.UNKNOWN;
    }

    return {
        id: vaultSubgraphPool.id.toLowerCase(),
        chain: chain,
        vaultVersion: 3,
        address: vaultSubgraphPool.id.toLowerCase(),
        decimals: 18,
        symbol: vaultSubgraphPool.symbol,
        name: vaultSubgraphPool.name,
        owner: vaultSubgraphPool.id.toLowerCase(), //TODO
        factory: poolSubgraphPool.factory.id.toLowerCase(),
        type: type,
        typeData: typeData,
        version: poolSubgraphPool.factory.version,
        createTime: Number(vaultSubgraphPool.blockTimestamp),
    };
};

const typeDataMapper = {
    ELEMENT: element,
    FX: fx,
    GYRO: gyro,
    GYRO3: gyro,
    GYROE: gyro,
    LINEAR: linear,
    STABLE: stable,
    COMPOSABLE_STABLE: stable,
    META_STABLE: stable,
};
