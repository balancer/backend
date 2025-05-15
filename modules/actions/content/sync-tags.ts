import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { getPoolMetadataTags as getPoolMetadataTags } from '../../sources/github/pool-metadata-tags';
import { getErc4626Tags } from '../../sources/github/pool-erc4626-tags';
import { getPoolHookTags } from '../../sources/github/pool-hook-tags';
import _ from 'lodash';

export const syncTags = async (): Promise<void> => {
    // Get metadata as tags
    let allTags = await getPoolMetadataTags({});
    allTags = await getErc4626Tags(allTags);
    allTags = await getPoolHookTags(allTags);

    // Add incentivized category to pools with rewards
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

    // Add incentivized category to tags array
    poolsWithReward.forEach(({ poolId }) => {
        if (allTags[poolId]) {
            allTags[poolId].add('INCENTIVIZED');
        } else {
            allTags[poolId] = new Set(['INCENTIVIZED']);
        }
    });

    // Convert the transformed object to an array of PoolTags
    const externalCategoriesMap = Object.entries(allTags).reduce((acc, [id, tags]) => {
        acc[id] = new Set(
            [...tags].map((tag) => tag.toUpperCase()).map((tag) => (tag === 'BLACKLISTED' ? 'BLACK_LISTED' : tag)),
        );
        return acc;
    }, {} as Record<string, Set<string>>);

    // Get DB data
    const dbPools = await prisma.prismaPool.findMany({
        select: {
            chain: true,
            id: true,
            categories: true,
        },
    });
    const dbCategoriesMap = dbPools.reduce((acc, { id, categories }) => {
        acc[id] = new Set(categories);
        return acc;
    }, {} as Record<string, Set<string>>);
    const dbPoolIds = Object.keys(dbCategoriesMap);
    const idToChain = dbPools.reduce((acc, { id, chain }) => {
        acc[id] = chain;
        return acc;
    }, {} as Record<string, Chain>);

    const poolsToUpdate = new Set<string>();
    const poolsToRemove = new Set<string>();

    Object.entries(externalCategoriesMap).forEach(([id, tags]) => {
        const dbCategories = dbCategoriesMap[id];
        if (!dbCategories) {
            // Pool does not exist in the DB
            return;
        }
        if (_.xor([...dbCategories], [...tags]).length === 0) {
            // External tags are the same as the DB, no need to update
            return;
        }
        // Tags are different
        poolsToUpdate.add(id);
    });

    // Remove categories from pools that are not in the metadata
    dbPoolIds.forEach((id) => {
        const dbCategories = dbCategoriesMap[id];
        const tags = externalCategoriesMap[id];
        if (dbCategories.size > 0 && (!tags || tags.size === 0)) {
            // Pool shouldn't have categories
            poolsToRemove.add(id);
            return;
        }
    });

    const queries: any[] = [];

    if (poolsToUpdate.size > 0) {
        poolsToUpdate.forEach((id) => {
            const categories = externalCategoriesMap[id];
            queries.push(
                prisma.prismaPool.update({
                    where: { id_chain: { id, chain: idToChain[id] } },
                    data: { categories: [...categories] },
                }),
            );
        });
    }
    if (poolsToRemove.size > 0) {
        poolsToRemove.forEach((id) => {
            queries.push(
                prisma.prismaPool.update({
                    where: { id_chain: { id, chain: idToChain[id] } },
                    data: { categories: [] },
                }),
            );
        });
    }

    await prisma.$transaction(queries);
};
