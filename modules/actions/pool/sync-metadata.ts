import { PrismaPoolCategoryType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { chainIdToChain } from '../../network/chain-id-to-chain';
import { fetchMetadata } from '../../sources/github/fetch-metadata';

// This is not a good solution, but it's fine for now
export const syncMetadata = async (): Promise<void> => {
    const metadata = await fetchMetadata();

    // Delete all github categories
    await prisma.prismaPoolCategory.deleteMany({
        where: {
            category: {
                in: ['LRT', 'POINTS'],
            },
        },
    });

    // Check if the pool exists in the DB
    const existingPools = await prisma.prismaPool.findMany({
        select: {
            id: true,
            chain: true,
        },
    });

    const existingPoolIds = existingPools.map((pool) => `${pool.id}-${pool.chain}`);

    // Skip items that are missing in the DB
    const filteredMetadata = metadata.filter((pool) =>
        existingPoolIds.includes(`${pool.id}-${chainIdToChain[pool.chainId]}`),
    );

    const data = filteredMetadata.flatMap((pool) =>
        pool.categories.map((category) => ({
            id: `${pool.id}-${category.toUpperCase()}`,
            category: category.toUpperCase() as PrismaPoolCategoryType,
            poolId: pool.id,
            chain: chainIdToChain[pool.chainId],
        })),
    );

    // Remove duplicates
    const uniqueData = data.filter(
        (value, index, self) => self.findIndex((t) => t.id === value.id && t.chain === value.chain) === index,
    );

    // Insert new categories
    await prisma.prismaPoolCategory.createMany({
        data: uniqueData,
    });
};
