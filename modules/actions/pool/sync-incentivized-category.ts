import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';

export const syncIncentivizedCategory = async (chain: Chain) => {
    const poolsWithReward = await prisma.prismaPoolAprItem.findMany({
        select: { poolId: true },
        where: {
            type: {
                in: ['NATIVE_REWARD', 'THIRD_PARTY_REWARD'],
            },
            apr: {
                gt: 0,
            },
            chain,
        },
    });

    const ids = poolsWithReward.map(({ poolId }) => poolId);

    await prisma.prismaPoolCategory.createMany({
        data: ids.map((poolId) => ({
            id: `${chain}-${poolId}-INCENTIVIZED`,
            category: 'INCENTIVIZED' as const,
            poolId,
            chain,
        })),
        skipDuplicates: true,
    });

    await prisma.prismaPoolCategory.deleteMany({
        where: {
            category: 'INCENTIVIZED',
            chain,
            poolId: {
                notIn: ids,
            },
        },
    });
};
