import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { chainIdToChain } from '../../../config/chain-id-to-chain';
import { HookData } from '../../../prisma/prisma-types';

const POOL_TAGS_URL = 'https://raw.githubusercontent.com/balancer/metadata/refs/heads/main/pools/tags/index.json';
const HOOKS_TAGS_URL = 'https://raw.githubusercontent.com/balancer/metadata/refs/heads/main/hooks/index.json';
const ERC4626_TAGS_URL = 'https://raw.githubusercontent.com/balancer/metadata/refs/heads/main/erc4626/index.json';

type TagItem = {
    id: string;
    pools: string[];
    tokens: { [chainId: string]: string[] };
};

type ERC4626Metadata = {
    id: string;
    addresses: {
        [chainId: string]: string[];
    };
};

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
                in: ['NATIVE_REWARD', 'THIRD_PARTY_REWARD', 'MERKL', 'VOTING', 'LOCKING', 'STAKING'],
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

const getPoolMetadataTags = async (existingTags: Record<string, Set<string>>): Promise<Record<string, Set<string>>> => {
    const response = await fetch(POOL_TAGS_URL);
    const tagsList = (await response.json()) as TagItem[];

    for (const tag of tagsList) {
        if (tag.pools) {
            tag.pools.forEach((poolId) => {
                poolId = poolId.toLowerCase();
                if (!existingTags[poolId]) {
                    existingTags[poolId] = new Set();
                }
                existingTags[poolId].add(tag.id.toUpperCase());
                if (tag.id.toLowerCase().startsWith('points_')) {
                    existingTags[poolId].add(`POINTS`);
                }
            });
        }

        if (tag.tokens) {
            // skip sonic points token tags, handled later
            if (tag.id.toLowerCase().startsWith('points_sonic')) {
                continue;
            }
            for (const chainId in tag.tokens) {
                for (const tokenAddress of tag.tokens[chainId]) {
                    const chain = chainIdToChain[chainId];
                    const poolsWithToken = await prisma.prismaPool.findMany({
                        where: { chain: chain, allTokens: { some: { tokenAddress: tokenAddress.toLowerCase() } } },
                    });
                    poolsWithToken.forEach((pool) => {
                        if (!existingTags[pool.id]) {
                            existingTags[pool.id] = new Set();
                        }
                        existingTags[pool.id].add(tag.id.toUpperCase());
                        if (tag.id.toLowerCase().startsWith('points_')) {
                            existingTags[pool.id].add(`POINTS`);
                        }
                    });
                }
            }
        }
    }

    // Sonic points should only show for pools that consist of only sonic point bearing tokens.
    // fetch pools with tokens from db
    const sonicPools = await prisma.prismaPool.findMany({
        where: { chain: 'SONIC' },
        select: { id: true, address: true, chain: true, allTokens: true },
    });

    // from the tag list, find all tags that start with points_sonic
    const sonicPointBearingTags = tagsList.filter((tag) => tag.id.toLowerCase().startsWith('points_sonic'));

    // make all token addresses in the tags lowercase
    sonicPointBearingTags.forEach((tag) => {
        tag.tokens = Object.fromEntries(
            Object.entries(tag.tokens || {}).map(([chainId, addresses]) => [
                chainId,
                addresses.map((address) => address.toLowerCase()),
            ]),
        );
    });

    // get the token addresses for sonic point bearing tags in lowercase
    // this is to ensure we can compare them with the pool token addresses
    const sonicPointBearingTokenAddresses = sonicPointBearingTags
        .flatMap((tag) => {
            return Object.values(tag.tokens || {}).flat();
        })
        .map((token) => token.toLowerCase());

    // find pools that have only sonic point bearing tokens
    const sonicPointBearingPools = sonicPools.filter((pool) => {
        const tokenAddresses = pool.allTokens
            .map((token) => token.tokenAddress.toLowerCase())
            .filter((address) => address !== pool.address.toLowerCase());
        return tokenAddresses.every((address) => sonicPointBearingTokenAddresses.includes(address));
    });

    // add points_sonic tags to pools that have only sonic point bearing tokens
    sonicPointBearingPools.forEach((pool) => {
        if (!existingTags[pool.id]) {
            existingTags[pool.id] = new Set();
            existingTags[pool.id].add(`POINTS`);
        }
        // add a tag for each of the sonic point bearing token in the pool
        sonicPointBearingTags.forEach((tag) => {
            pool.allTokens.forEach((token) => {
                if (tag.tokens && tag.tokens['146']?.includes(token.tokenAddress.toLowerCase())) {
                    existingTags[pool.id].add(tag.id.toUpperCase());
                }
            });
        });
    });

    return existingTags;
};

type HooksMetadata = {
    id: string;
    addresses: {
        [chainId: string]: string[];
    };
};

const getPoolHookTags = async (existingTags: Record<string, Set<string>>): Promise<Record<string, Set<string>>> => {
    const response = await fetch(HOOKS_TAGS_URL);
    const hooksMetadataList = (await response.json()) as HooksMetadata[];

    // Get hook addresses from the database
    const poolsWithHooks = await prisma.prismaPool.findMany({
        where: { hook: { path: ['address'], string_starts_with: '0x' } },
    });

    for (const hookMetadata of hooksMetadataList) {
        for (const chainId in hookMetadata.addresses) {
            const addresses = hookMetadata.addresses[chainId].map((address) => address.toLowerCase());
            for (const pool of poolsWithHooks) {
                if (pool.chain === chainIdToChain[chainId] && addresses.includes((pool.hook as HookData).address)) {
                    if (!existingTags[pool.id]) {
                        existingTags[pool.id] = new Set();
                    }
                    existingTags[pool.id].add(`${hookMetadata.id.toUpperCase()}`);
                }
            }
        }
    }

    return existingTags;
};

const getErc4626Tags = async (existingTags: Record<string, Set<string>>): Promise<Record<string, Set<string>>> => {
    const response = await fetch(ERC4626_TAGS_URL);
    const erc4626MetadataList = (await response.json()) as ERC4626Metadata[];

    for (const erc4626Metadata of erc4626MetadataList) {
        for (const chainId in erc4626Metadata.addresses) {
            const addresses = erc4626Metadata.addresses[chainId].map((address) => address.toLowerCase());
            const poolsWithThisErc4626Token = await prisma.prismaPool.findMany({
                where: {
                    chain: chainIdToChain[chainId],
                    protocolVersion: 3,
                    allTokens: { some: { tokenAddress: { in: addresses } } },
                },
            });
            for (const pool of poolsWithThisErc4626Token) {
                if (!existingTags[pool.id]) {
                    existingTags[pool.id] = new Set();
                }
                existingTags[pool.id].add(`${erc4626Metadata.id.toUpperCase()}`);
                existingTags[pool.id].add(`BOOSTED`);
            }
        }
    }

    return existingTags;
};
