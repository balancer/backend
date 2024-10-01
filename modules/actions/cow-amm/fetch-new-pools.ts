import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';

export const fetchNewPools = async (subgraphClient: CowAmmSubgraphClient, chain: Chain) => {
    const subgraphPools = await subgraphClient.getAllPools({ isInitialized: true });

    const dbPoolIds = await prisma.prismaPool
        .findMany({
            where: {
                chain,
            },
            select: {
                id: true,
            },
        })
        .then((pools) => pools.map((pool) => pool.id));

    const newPools = subgraphPools.filter((subgraphPool) => dbPoolIds.includes(subgraphPool.id) === false);

    return newPools.map((pool) => pool.id);
};
