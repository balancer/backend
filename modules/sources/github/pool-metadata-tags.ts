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
