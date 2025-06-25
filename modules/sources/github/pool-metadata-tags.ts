import { prisma } from '../../../prisma/prisma-client';
import { chainIdToChain } from '../../network/chain-id-to-chain';

const TAGS_URL = 'https://raw.githubusercontent.com/balancer/metadata/refs/heads/main/pools/tags/index.json';

type TagItem = {
    id: string;
    pools: string[];
    tokens: { [chainId: string]: string[] };
};

export const getPoolMetadataTags = async (
    existingTags: Record<string, Set<string>>,
): Promise<Record<string, Set<string>>> => {
    const response = await fetch(TAGS_URL);
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

    // Sonic points are added via the tokens object in the metadata repo but should only show for pools that consist of only sonic point bearing tokens.
    // So we need to handle them separately.
    // for sonic points, we need to remove the points tag from pools that have non-sonic point bearing tokens
    // find all pools that have a points_sonic tag prefix
    const allSonicPoolIdsWithSonicPoints = Object.keys(existingTags).filter((poolId) =>
        Array.from(existingTags[poolId]).some((tag) => tag.toLowerCase().startsWith('points_sonic')),
    );

    // fetch pools with tokens from db
    const sonicPools = await prisma.prismaPool.findMany({
        where: { id: { in: allSonicPoolIdsWithSonicPoints } },
        select: { id: true, address: true, chain: true, allTokens: true },
    });

    // from the tag list, find all tags that start with points_sonic
    const sonicPointBearingTags = tagsList.filter((tag) => tag.id.toLowerCase().startsWith('points_sonic'));
    // get the token addresses for sonic point bearing tags in lowercase
    // this is to ensure we can compare them with the pool token addresses
    const sonicPointBearingTokens = sonicPointBearingTags
        .flatMap((tag) => {
            return Object.values(tag.tokens || {}).flat();
        })
        .map((token) => token.toLowerCase());

    // find pools that have only sonic point bearing tokens
    const sonicPointBearingPools = sonicPools.filter((pool) => {
        const tokenAddresses = pool.allTokens
            .map((token) => token.tokenAddress.toLowerCase())
            .filter((address) => address !== pool.address.toLowerCase());
        return tokenAddresses.every((address) => sonicPointBearingTokens.includes(address));
    });

    // remove points_sonic prefixed tags from existingTags for all pools that do not have only sonic point bearing tokens
    allSonicPoolIdsWithSonicPoints.forEach((poolId) => {
        if (!sonicPointBearingPools.some((pool) => pool.id === poolId)) {
            existingTags[poolId] = new Set(
                Array.from(existingTags[poolId]).filter((tag) => !tag.toLowerCase().startsWith('points_sonic')),
            );
            // remove all tags if only POINTS tag is left
            if (existingTags[poolId].size === 1 && existingTags[poolId].has('POINTS')) {
                delete existingTags[poolId];
            }
        }
    });

    return existingTags;
};
