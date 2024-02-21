import { Chain, PrismaPool, PrismaPoolType } from '@prisma/client';
import { PoolFragment as VaultSubgraphPoolFragment } from '../../subgraphs/balancer-v3-vault/generated/types';
import { PoolFragment as PoolSubgraphPoolFragment, PoolType } from '../../subgraphs/balancer-v3-pools/generated/types';
import { StableData } from '../../pool/subgraph-mapper';

export const poolTransformer = (
    vaultSubgraphPool: VaultSubgraphPoolFragment,
    poolSubgraphPool: PoolSubgraphPoolFragment,
    chain: Chain,
): PrismaPool => {
    let type: PrismaPoolType;
    let typeData = {};

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
        owner: '',
        factory: poolSubgraphPool.factory.id.toLowerCase(),
        type: type,
        typeData: typeData,
        version: poolSubgraphPool.factory.version,
        createTime: Number(vaultSubgraphPool.blockTimestamp),
    };
};
