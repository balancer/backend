import { Chain, PrismaPool, PrismaPoolType } from '@prisma/client';
import { PoolFragment } from '../../subgraphs/balancer-v3-vault/generated/types';

export const poolTransformer = (
    subgraphPool: PoolFragment,
    contractData: { name?: string; symbol?: string },
    chain: Chain,
): PrismaPool => {
    return {
        id: subgraphPool.id.toLowerCase(),
        chain: chain,
        vaultVersion: 3,
        address: subgraphPool.id.toLowerCase(),
        decimals: 18,
        symbol: contractData.symbol || '',
        name: contractData.name || '',
        owner: '',
        factory: (subgraphPool.factory && subgraphPool.factory.toLowerCase()) || '',
        type: PrismaPoolType.WEIGHTED,
        typeData: {},
        version: 1,
        createTime: Number(subgraphPool.blockTimestamp),
    };
};
