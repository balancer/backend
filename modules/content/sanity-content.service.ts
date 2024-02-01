import { isSameAddress } from '@balancer-labs/sdk';
import { Chain, Prisma, PrismaPoolCategoryType } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import {
    ConfigHomeScreen,
    ContentService,
    FeaturedPool,
    HomeScreenFeaturedPoolGroup,
    HomeScreenNewsItem,
} from './content-types';
import SanityClient from '@sanity/client';
import { env } from '../../app/env';
import { chainToIdMap } from '../network/network-config';
import { wrap } from 'module';
import { LinearData } from '../pool/subgraph-mapper';

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
}

const SANITY_TOKEN_TYPE_MAP: { [key: string]: string } = {
    '250': 'fantomToken',
    '4': 'rinkebyToken',
    '10': 'optimismToken',
};

export class SanityContentService implements ContentService {
    constructor(
        private readonly chain: Chain,
        private readonly projectId = '1g2ag2hb',
        private readonly dataset = 'production',
    ) {}

    async syncTokenContentData(): Promise<void> {
        const sanityTokens = await this.getSanityClient().fetch<SanityToken[]>(`
            *[_type=="${SANITY_TOKEN_TYPE_MAP[chainToIdMap[this.chain]]}"] {
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
                    address_chain: { address: tokenAddress, chain: this.chain },
                },
                create: {
                    name: sanityToken.name,
                    address: tokenAddress,
                    chain: this.chain,
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
                chain: this.chain,
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
                chain: this.chain,
                tokenAddress: token.address.toLowerCase(),
                type: 'WHITE_LISTED' as const,
            })),
            skipDuplicates: true,
        });

        await prisma.prismaTokenType.deleteMany({
            where: { id: { in: removeFromWhitelist.map((token) => token.id) }, chain: this.chain },
        });

        await this.syncTokenTypes();
    }

    private async syncTokenTypes() {
        const pools = await this.loadPoolData();
        const tokens = await prisma.prismaToken.findMany({
            include: { types: true },
            where: { chain: this.chain },
        });
        const types: Prisma.PrismaTokenTypeCreateManyInput[] = [];

        for (const token of tokens) {
            const tokenTypes = token.types.map((tokenType) => tokenType.type);
            const pool = pools.find((pool) => pool.address === token.address);

            if (pool && !tokenTypes.includes('BPT')) {
                types.push({
                    id: `${token.address}-bpt`,
                    chain: this.chain,
                    type: 'BPT',
                    tokenAddress: token.address,
                });
            }

            if (
                (pool?.type === 'COMPOSABLE_STABLE' || pool?.type === 'LINEAR') &&
                !tokenTypes.includes('PHANTOM_BPT')
            ) {
                types.push({
                    id: `${token.address}-phantom-bpt`,
                    chain: this.chain,
                    type: 'PHANTOM_BPT',
                    tokenAddress: token.address,
                });
            }

            const wrappedIndex = (pool?.staticTypeData as LinearData).wrappedIndex;
            const wrappedLinearPoolToken = pools.find((pool) => pool.tokens[wrappedIndex]?.address === token.address);

            if (wrappedLinearPoolToken && !tokenTypes.includes('LINEAR_WRAPPED_TOKEN')) {
                types.push({
                    id: `${token.address}-linear-wrapped`,
                    chain: this.chain,
                    type: 'LINEAR_WRAPPED_TOKEN',
                    tokenAddress: token.address,
                });
            }

            if (!wrappedLinearPoolToken && tokenTypes.includes('LINEAR_WRAPPED_TOKEN')) {
                prisma.prismaTokenType.delete({
                    where: { id_chain: { id: `${token.address}-linear-wrapped`, chain: this.chain } },
                });
            }
        }

        await prisma.prismaTokenType.createMany({ skipDuplicates: true, data: types });
    }

    private async loadPoolData() {
        return prisma.prismaPool.findMany({
            where: { chain: this.chain },
            select: {
                address: true,
                symbol: true,
                name: true,
                type: true,
                staticTypeData: true,
                tokens: { orderBy: { index: 'asc' } },
            },
        });
    }

    public async syncPoolContentData(): Promise<void> {
        const response = await this.getSanityClient().fetch(`*[_type == "config" && chainId == ${
            chainToIdMap[this.chain]
        }][0]{
            incentivizedPools,
            blacklistedPools,
        }`);

        const config: SanityPoolConfig = {
            incentivizedPools: response?.incentivizedPools ?? [],
            blacklistedPools: response?.blacklistedPools ?? [],
        };

        const categories = await prisma.prismaPoolCategory.findMany({ where: { chain: this.chain } });
        const incentivized = categories.filter((item) => item.category === 'INCENTIVIZED').map((item) => item.poolId);
        const blacklisted = categories.filter((item) => item.category === 'BLACK_LISTED').map((item) => item.poolId);

        await this.updatePoolCategory(incentivized, config.incentivizedPools, 'INCENTIVIZED');
        await this.updatePoolCategory(blacklisted, config.blacklistedPools, 'BLACK_LISTED');
    }

    private async updatePoolCategory(currentPoolIds: string[], newPoolIds: string[], category: PrismaPoolCategoryType) {
        const itemsToAdd = newPoolIds.filter((poolId) => !currentPoolIds.includes(poolId));
        const itemsToRemove = currentPoolIds.filter((poolId) => !newPoolIds.includes(poolId));

        // make sure the pools really exist to prevent sanity mistakes from breaking the system
        const pools = await prisma.prismaPool.findMany({
            where: { id: { in: itemsToAdd }, chain: this.chain },
            select: { id: true },
        });
        const poolIds = pools.map((pool) => pool.id);
        const existingItemsToAdd = itemsToAdd.filter((poolId) => poolIds.includes(poolId));

        await prisma.$transaction([
            prisma.prismaPoolCategory.createMany({
                data: existingItemsToAdd.map((poolId) => ({
                    id: `${poolId}-${category}`,
                    chain: this.chain,
                    category,
                    poolId,
                })),
                skipDuplicates: true,
            }),
            prisma.prismaPoolCategory.deleteMany({
                where: { poolId: { in: itemsToRemove }, category, chain: this.chain },
            }),
        ]);
    }

    public async getFeaturedPoolGroups(chains: Chain[]): Promise<HomeScreenFeaturedPoolGroup[]> {
        const featuredPoolGroups: HomeScreenFeaturedPoolGroup[] = [];
        for (const chain of chains) {
            const data = await this.getSanityClient().fetch<ConfigHomeScreen | null>(`
            *[_type == "homeScreen" && chainId == ${chainToIdMap[chain]}][0]{
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
            if (data) {
                featuredPoolGroups.push(...data.featuredPoolGroups);
            }
        }
        return featuredPoolGroups;
    }

    public async getFeaturedPools(chains: Chain[]): Promise<FeaturedPool[]> {
        const featuredPools: FeaturedPool[] = [];
        for (const chain of chains) {
            const data = await this.getSanityClient().fetch<ConfigHomeScreen | null>(`
            *[_type == "homeScreen" && chainId == ${chainToIdMap[chain]}][0]{
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
            if (data) {
                const featuredPoolGroupItems = data.featuredPoolGroups.find(
                    (group) => group.id === 'popular-pools',
                )?.items;
                if (featuredPoolGroupItems) {
                    for (let i = 0; i < featuredPoolGroupItems.length; i++) {
                        const group = featuredPoolGroupItems[i];
                        if (group._type === 'homeScreenFeaturedPoolGroupPoolId') {
                            featuredPools.push({
                                poolId: group.poolId,
                                primary: i === 0 ? true : false,
                                chain: chain,
                            });
                        }
                    }
                }
            }
        }
        return featuredPools;
    }

    public async getNewsItems(): Promise<HomeScreenNewsItem[]> {
        const data = await this.getSanityClient().fetch<ConfigHomeScreen | null>(`
    *[_type == "homeScreen" && chainId == ${chainToIdMap[this.chain]}][0]{
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
        throw new Error(`No news items found for chain id ${this.chain}`);
    }

    private getSanityClient() {
        return SanityClient({
            projectId: this.projectId,
            dataset: this.dataset,
            apiVersion: '2021-12-15',
            token: env.SANITY_API_TOKEN,
            useCdn: false,
        });
    }
}
