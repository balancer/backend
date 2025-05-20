import { Chain, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';

export const syncIncentivizedCategory = async () => {
    const poolsWithReward = await prisma.prismaPoolAprItem.findMany({
        select: { poolId: true },
        where: {
            type: {
                in: ['NATIVE_REWARD', 'THIRD_PARTY_REWARD', 'MERKL', 'VOTING', 'LOCKING'],
            },
            apr: {
                gt: 0,
            },
        },
    });

    const incentivizedPoolIds = await prisma.prismaPool.findMany({
        select: { id: true },
        where: {
            categories: {
                has: 'INCENTIVIZED',
            },
        },
    });

    const incentivizedIds = incentivizedPoolIds.map(({ id }) => id);
    const rewardPoolIds = poolsWithReward.map(({ poolId }) => poolId);

    const idsToAdd = rewardPoolIds.filter((id) => !incentivizedIds.includes(id));
    const idsToRemove = incentivizedIds.filter((id) => !rewardPoolIds.includes(id));

    const queries = [];

    if (idsToRemove.length > 0) {
        console.log('[sync-categories] Removing incentivized category from pools:', idsToRemove);
        queries.push(
            prisma.$executeRaw`UPDATE "PrismaPool"
            SET categories = array_remove(categories, 'INCENTIVIZED')
            WHERE id IN (${Prisma.join(idsToRemove)});`,
        );
    }

    if (idsToAdd.length > 0) {
        console.log('[sync-categories] Adding incentivized category to pools:', idsToAdd);
        queries.push(
            prisma.$executeRaw`UPDATE "PrismaPool"
            SET categories = array_append(categories, 'INCENTIVIZED')
            WHERE id IN (${Prisma.join(idsToAdd)});`,
        );
    }

    if (queries.length > 0) {
        await prisma.$transaction(queries);
    }
};
