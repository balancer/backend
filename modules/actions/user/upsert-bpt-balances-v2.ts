import { Chain } from '@prisma/client';
import { V2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import { prisma } from '../../../prisma/prisma-client';
import { zeroAddress } from 'viem';
import _ from 'lodash';

export const upsertBptBalancesV2 = async (poolIds: string[], subgraphClient: V2SubgraphClient, chain: Chain) => {
    // Just fetch all shares when asking for more than 10 pools
    if (poolIds.length > 10) {
        poolIds = [];
    }

    let poolShares = await subgraphClient.legacyService.getAllPoolSharesWithBalance(poolIds, [zeroAddress]);

    // Filter pools that aren't in the DB
    const existingPools = (await prisma.prismaPool.findMany({ where: { chain }, select: { id: true } })).map(
        (pool) => pool.id,
    );

    poolShares = poolShares.filter(({ poolId }) => poolId && existingPools.includes(poolId));

    const operations = [
        // wallet balances are related to users table, so we need to create all users records first
        prisma.prismaUser.createMany({
            data: _.uniq(poolShares.map(({ userAddress }) => ({ address: userAddress }))),
            skipDuplicates: true,
        }),

        ...poolShares.map((dbEntry) => {
            const { id, ...data } = dbEntry;

            return prisma.prismaUserWalletBalance.upsert({
                where: {
                    id_chain: {
                        id,
                        chain,
                    },
                },
                update: data,
                create: dbEntry,
            });
        }),
    ];

    await prisma.$transaction(operations);
};
