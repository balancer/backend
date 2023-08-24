import { isSameAddress } from '@balancer-labs/sdk';
import { Prisma, PrismaPoolCategoryType } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { networkContext } from '../network/network-context.service';
import { ConfigHomeScreen, ContentService, HomeScreenFeaturedPoolGroup, HomeScreenNewsItem } from './content-types';
import SanityClient from '@sanity/client';
import { env } from '../../app/env';

interface SanityToken {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    priority: number;
    coingeckoPlatformId?: string;
    coingeckoContractAddress?: string;
    coingeckoTokenId?: string;
    description?: string;
    websiteUrl?: string;
    twitterUsername?: string;
    discordUrl?: string;
    telegramUrl?: string;
}

interface SanityPoolConfig {
    incentivizedPools: string[];
    blacklistedPools: string[];
    poolFilters: {
        id: string;
        title: string;
        pools: string[];
    }[];
}

const SANITY_TOKEN_TYPE_MAP: { [key: string]: string } = {
    '250': 'fantomToken',
    '4': 'rinkebyToken',
    '10': 'optimismToken',
};

export class SanityContentService implements ContentService {
    async syncTokenContentData(): Promise<void> {
        const sanityTokens = await getSanityClient().fetch<SanityToken[]>(`
            *[_type=="${SANITY_TOKEN_TYPE_MAP[networkContext.chainId]}"] {
                name,
                address,
                symbol,
                decimals,
                logoURI,
                'priority': coalesce(priority, 0),
                coingeckoPlatformId,
                coingeckoContractAddress,
                coingeckoTokenId,
                description,
                websiteUrl,
                twitterUsername,
                discordUrl,
                telegramUrl
            }
        `);

        //TODO: could be more intelligent about when to upsert
        for (const sanityToken of sanityTokens) {
            const tokenAddress = sanityToken.address.toLowerCase();
            let tokenData = {};
            if (
                sanityToken.description ||
                sanityToken.websiteUrl ||
                sanityToken.discordUrl ||
                sanityToken.telegramUrl ||
                sanityToken.twitterUsername
            ) {
                tokenData = {
                    description: sanityToken.description || null,
                    websiteUrl: sanityToken.websiteUrl || null,
                    discordUrl: sanityToken.discordUrl || null,
                    telegramUrl: sanityToken.telegramUrl || null,
                    twitterUsername: sanityToken.twitterUsername || null,
                };
            }

            await prisma.prismaToken.upsert({
                where: {
                    address_chain: { address: tokenAddress, chain: networkContext.chain },
                },
                create: {
                    name: sanityToken.name,
                    address: tokenAddress,
                    chain: networkContext.chain,
                    symbol: sanityToken.symbol,
                    decimals: sanityToken.decimals,
                    logoURI: sanityToken.logoURI,
                    priority: sanityToken.priority,
                    coingeckoPlatformId: sanityToken.coingeckoPlatformId?.toLowerCase(),
                    coingeckoContractAddress: sanityToken.coingeckoContractAddress?.toLowerCase(),
                    coingeckoTokenId: sanityToken.coingeckoTokenId?.toLowerCase(),
                    ...tokenData,
                },
                update: {
                    name: sanityToken.name,
                    symbol: sanityToken.symbol,
                    //use set to ensure we overwrite the underlying value if it is removed in sanity
                    logoURI: { set: sanityToken.logoURI || null },
                    decimals: sanityToken.decimals,
                    priority: sanityToken.priority,
                    coingeckoPlatformId: { set: sanityToken.coingeckoPlatformId?.toLowerCase() || null },
                    coingeckoContractAddress: { set: sanityToken.coingeckoContractAddress?.toLowerCase() || null },
                    coingeckoTokenId: { set: sanityToken.coingeckoTokenId?.toLowerCase() || null },
                    ...tokenData,
                },
            });
        }

        const whiteListedTokens = await prisma.prismaTokenType.findMany({
            where: {
                type: 'WHITE_LISTED',
                chain: networkContext.chain,
            },
        });

        const addToWhitelist = sanityTokens.filter((sanityToken) => {
            return !whiteListedTokens.some((dbToken) => isSameAddress(sanityToken.address, dbToken.tokenAddress));
        });

        const removeFromWhitelist = whiteListedTokens.filter((dbToken) => {
            return !sanityTokens.some((sanityToken) => isSameAddress(dbToken.tokenAddress, sanityToken.address));
        });

        await prisma.prismaTokenType.createMany({
            data: addToWhitelist.map((token) => ({
                id: `${token.address}-white-listed`,
                chain: networkContext.chain,
                tokenAddress: token.address.toLowerCase(),
                type: 'WHITE_LISTED' as const,
            })),
            skipDuplicates: true,
        });

        await prisma.prismaTokenType.deleteMany({
            where: { id: { in: removeFromWhitelist.map((token) => token.id) }, chain: networkContext.chain },
        });

        await this.syncTokenTypes();
    }

    private async syncTokenTypes() {
        const pools = await this.loadPoolData();
        const tokens = await prisma.prismaToken.findMany({
            include: { types: true },
            where: { chain: networkContext.chain },
        });
        const types: Prisma.PrismaTokenTypeCreateManyInput[] = [];

        for (const token of tokens) {
            const tokenTypes = token.types.map((tokenType) => tokenType.type);
            const pool = pools.find((pool) => pool.address === token.address);

            if (pool && !tokenTypes.includes('BPT')) {
                types.push({
                    id: `${token.address}-bpt`,
                    chain: networkContext.chain,
                    type: 'BPT',
                    tokenAddress: token.address,
                });
            }

            if ((pool?.type === 'PHANTOM_STABLE' || pool?.type === 'LINEAR') && !tokenTypes.includes('PHANTOM_BPT')) {
                types.push({
                    id: `${token.address}-phantom-bpt`,
                    chain: networkContext.chain,
                    type: 'PHANTOM_BPT',
                    tokenAddress: token.address,
                });
            }

            const linearPool = pools.find(
                (pool) => pool.linearData && pool.tokens[pool.linearData.wrappedIndex].address === token.address,
            );

            if (linearPool && !tokenTypes.includes('LINEAR_WRAPPED_TOKEN')) {
                types.push({
                    id: `${token.address}-linear-wrapped`,
                    chain: networkContext.chain,
                    type: 'LINEAR_WRAPPED_TOKEN',
                    tokenAddress: token.address,
                });
            }
        }

        await prisma.prismaTokenType.createMany({ skipDuplicates: true, data: types });
    }

    private async loadPoolData() {
        return prisma.prismaPool.findMany({
            where: { chain: networkContext.chain },
            select: {
                address: true,
                symbol: true,
                name: true,
                type: true,
                tokens: { orderBy: { index: 'asc' } },
                linearData: true,
            },
        });
    }

    public async syncPoolContentData(): Promise<void> {
        const response = await getSanityClient().fetch(`*[_type == "config" && chainId == ${networkContext.chainId}][0]{
            incentivizedPools,
            blacklistedPools,
            poolFilters
        }`);

        const config: SanityPoolConfig = {
            incentivizedPools: response?.incentivizedPools ?? [],
            blacklistedPools: response?.blacklistedPools ?? [],
            poolFilters: response?.poolFilters ?? [],
        };

        const categories = await prisma.prismaPoolCategory.findMany({ where: { chain: networkContext.chain } });
        const incentivized = categories.filter((item) => item.category === 'INCENTIVIZED').map((item) => item.poolId);
        const blacklisted = categories.filter((item) => item.category === 'BLACK_LISTED').map((item) => item.poolId);

        await this.updatePoolCategory(incentivized, config.incentivizedPools, 'INCENTIVIZED');
        await this.updatePoolCategory(blacklisted, config.blacklistedPools, 'BLACK_LISTED');

        await prisma.$transaction([
            prisma.prismaPoolFilterMap.deleteMany({ where: { chain: networkContext.chain } }),
            prisma.prismaPoolFilter.deleteMany({ where: { chain: networkContext.chain } }),
            prisma.prismaPoolFilter.createMany({
                data: config.poolFilters.map((item) => ({
                    id: item.id,
                    chain: networkContext.chain,
                    title: item.title,
                })),
                skipDuplicates: true,
            }),
            prisma.prismaPoolFilterMap.createMany({
                data: config.poolFilters
                    .map((item) => {
                        return item.pools.map((poolId) => ({
                            id: `${item.id}-${poolId}`,
                            chain: networkContext.chain,
                            poolId,
                            filterId: item.id,
                        }));
                    })
                    .flat(),
                skipDuplicates: true,
            }),
        ]);
    }

    private async updatePoolCategory(currentPoolIds: string[], newPoolIds: string[], category: PrismaPoolCategoryType) {
        const itemsToAdd = newPoolIds.filter((poolId) => !currentPoolIds.includes(poolId));
        const itemsToRemove = currentPoolIds.filter((poolId) => !newPoolIds.includes(poolId));

        // make sure the pools really exist to prevent sanity mistakes from breaking the system
        const pools = await prisma.prismaPool.findMany({
            where: { id: { in: itemsToAdd }, chain: networkContext.chain },
            select: { id: true },
        });
        const poolIds = pools.map((pool) => pool.id);
        const existingItemsToAdd = itemsToAdd.filter((poolId) => poolIds.includes(poolId));

        await prisma.$transaction([
            prisma.prismaPoolCategory.createMany({
                data: existingItemsToAdd.map((poolId) => ({
                    id: `${poolId}-${category}`,
                    chain: networkContext.chain,
                    category,
                    poolId,
                })),
                skipDuplicates: true,
            }),
            prisma.prismaPoolCategory.deleteMany({
                where: { poolId: { in: itemsToRemove }, category, chain: networkContext.chain },
            }),
        ]);
    }

    public async getFeaturedPoolGroups(): Promise<HomeScreenFeaturedPoolGroup[]> {
        const data = await getSanityClient().fetch<ConfigHomeScreen | null>(`
        *[_type == "homeScreen" && chainId == ${networkContext.chainId}][0]{
            ...,
            "featuredPoolGroups": featuredPoolGroups[]{
                ...,
                "icon": icon.asset->url + "?w=64",
                "items": items[]{
                    ...,
                    "image": image.asset->url + "?w=600"
                }
            },
            "newsItems": newsItems[]{
                ...,
                "image": image.asset->url + "?w=800"
            }
        }
    `);

        if (data?.featuredPoolGroups) {
            return data.featuredPoolGroups;
        }
        throw new Error(`No featured pool groups found for chain id ${networkContext.chainId}`);
    }

    public async getNewsItems(): Promise<HomeScreenNewsItem[]> {
        const data = await getSanityClient().fetch<ConfigHomeScreen | null>(`
    *[_type == "homeScreen" && chainId == ${networkContext.chainId}][0]{
        ...,
        "featuredPoolGroups": featuredPoolGroups[]{
            ...,
            "icon": icon.asset->url + "?w=64",
            "items": items[]{
                ...,
                "image": image.asset->url + "?w=600"
            }
        },
        "newsItems": newsItems[]{
            ...,
            "image": image.asset->url + "?w=800"
        }
    }
`);

        if (data?.newsItems) {
            return data.newsItems;
        }
        throw new Error(`No news items found for chain id ${networkContext.chainId}`);
    }
}

export function getSanityClient() {
    return SanityClient({
        projectId: networkContext.data.sanity!.projectId,
        dataset: networkContext.data.sanity!.dataset,
        apiVersion: '2021-12-15',
        token: env.SANITY_API_TOKEN,
        useCdn: false,
    });
}
