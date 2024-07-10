import { Chain, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { getPoolCategories } from '../../sources/github/pool-categories';
import { syncIncentivizedCategory } from '../pool/sync-incentivized-category';

export const syncCategories = async (): Promise<void> => {
    // Get metadata
    const metadataCategories = await getPoolCategories();

    // Convert the transformed object to an array of PoolCategories
    const categoriesData = Object.entries(metadataCategories).map(([id, categories]) => ({
        id,
        categories,
    }));

    // Check if the pool exists in the DB
    const existingPools = await prisma.prismaPool.findMany({
        select: {
            chain: true,
            id: true,
        },
    });

    const existingPoolIds = existingPools.map(({ id }) => id);

    const idToChain = existingPools.reduce((acc, { id, chain }) => {
        acc[id] = chain;
        return acc;
    }, {} as Record<string, Chain>);

    // Skip items that are missing in the DB
    const filteredMetadata = categoriesData.filter(({ id }) => existingPoolIds.includes(id));

    const data = filteredMetadata.map(({ id, categories }) => ({
        where: {
            id_chain: {
                id,
                chain: idToChain[id],
            },
        },
        data: {
            categories: categories
                .map((category) => category.toUpperCase())
                .map((category) => (category === 'BLACKLISTED' ? 'BLACK_LISTED' : category)),
        },
    }));

    // Insert new categories
    await prisma.$transaction([
        // Update existing categories
        ...data.map(({ where, data }) => prisma.prismaPool.update({ where, data })),
        // Remove categories from pools that are not in the metadata
        prisma.prismaPool.updateMany({
            where: {
                NOT: {
                    id: {
                        in: filteredMetadata.map(({ id }) => id),
                    },
                },
            },
            data: {
                categories: [],
            },
        }),
    ]);

    // Sync incentivized category
    await syncIncentivizedCategory();
};
