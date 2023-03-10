import { isSameAddress } from '@balancer-labs/sdk';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { prisma } from '../../prisma/prisma-client';
import { networkContext } from '../network/network-context.service';
import { ContentService, HomeScreenFeaturedPoolGroup, HomeScreenNewsItem } from './content-types';

interface TokenListMapByNetwork {
    [networkKey: string]: TokenListMap;
}

interface TokenListMap {
    Balancer: {
        Default: string;
        Vetted: string;
    };
    External: string[];
}

interface WhitelistedTokenList {
    name: string;
    timestamp: string;
    tokens: WhitelistedToken[];
}

interface WhitelistedToken {
    address: string;
    chainId: number;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
}

const TOKEN_LIST_MAP: TokenListMapByNetwork = {
    '1': {
        Balancer: {
            Default: 'https://raw.githubusercontent.com/balancer/assets/master/generated/listed.tokenlist.json',
            Vetted: 'https://raw.githubusercontent.com/balancer/assets/master/generated/vetted.tokenlist.json',
        },
        External: ['ipns://tokens.uniswap.org', 'https://www.gemini.com/uniswap/manifest.json'],
    },
    '5': {
        Balancer: {
            Default:
                'https://raw.githubusercontent.com/balancer/assets/refactor-for-multichain/generated/goerli.listed.tokenlist.json',
            Vetted: 'https://raw.githubusercontent.com/balancer/assets/refactor-for-multichain/generated/goerli.vetted.tokenlist.json',
        },
        External: [],
    },
    '10': {
        Balancer: {
            Default: '',
            Vetted: '',
        },
        External: [],
    },
    '137': {
        Balancer: {
            Default:
                'https://raw.githubusercontent.com/balancer/assets/refactor-for-multichain/generated/polygon.listed.tokenlist.json',
            Vetted: 'https://raw.githubusercontent.com/balancer/assets/refactor-for-multichain/generated/polygon.vetted.tokenlist.json',
        },
        External: ['https://unpkg.com/quickswap-default-token-list@1.0.67/build/quickswap-default.tokenlist.json'],
    },
    '42161': {
        Balancer: {
            Default:
                'https://raw.githubusercontent.com/balancer/assets/refactor-for-multichain/generated/arbitrum.listed.tokenlist.json',
            Vetted: 'https://raw.githubusercontent.com/balancer/assets/refactor-for-multichain/generated/arbitrum.vetted.tokenlist.json',
        },
        External: [],
    },
    '100': {
        Balancer: {
            Default:
                'https://raw.githubusercontent.com/balancer/assets/refactor-for-multichain/generated/gnosis.listed.tokenlist.json',
            Vetted: 'https://raw.githubusercontent.com/balancer/assets/refactor-for-multichain/generated/gnosis.vetted.tokenlist.json',
        },
        External: ['https://unpkg.com/@1hive/default-token-list@latest/build/honeyswap-default.tokenlist.json'],
    },
};

//TODO implement other content functions
export class GithubContentService implements ContentService {
    async syncTokenContentData(): Promise<void> {
        const { data: githubTokenList } = await axios.get<WhitelistedTokenList>(
            TOKEN_LIST_MAP[networkContext.chainId].Balancer.Vetted,
        );

        for (const githubToken of githubTokenList.tokens) {
            const tokenAddress = githubToken.address.toLowerCase();

            await prisma.prismaToken.upsert({
                where: {
                    address_chain: { address: tokenAddress, chain: networkContext.chain },
                },
                create: {
                    name: githubToken.name,
                    address: tokenAddress,
                    chain: networkContext.chain,
                    symbol: githubToken.symbol,
                    decimals: githubToken.decimals,
                    logoURI: githubToken.logoURI,
                    coingeckoPlatformId: null,
                    coingeckoContractAddress: null,
                    coingeckoTokenId: null,
                    description: null,
                    websiteUrl: null,
                    discordUrl: null,
                    telegramUrl: null,
                    twitterUsername: null,
                },
                update: {
                    name: githubToken.name,
                    symbol: githubToken.symbol,
                    logoURI: { set: githubToken.logoURI || null },
                },
            });
        }

        const whiteListedTokens = await prisma.prismaTokenType.findMany({
            where: {
                type: 'WHITE_LISTED',
                chain: networkContext.chain,
            },
        });

        const addToWhitelist = githubTokenList.tokens.filter((githubToken) => {
            return !whiteListedTokens.some((dbToken) => isSameAddress(githubToken.address, dbToken.tokenAddress));
        });

        const removeFromWhitelist = whiteListedTokens.filter((dbToken) => {
            return !githubTokenList.tokens.some((githubToken) =>
                isSameAddress(dbToken.tokenAddress, githubToken.address),
            );
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
        const pools = await prisma.prismaPool.findMany({
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
    async syncPoolContentData(): Promise<void> {}
    async getFeaturedPoolGroups(): Promise<HomeScreenFeaturedPoolGroup[]> {
        return [];
    }
    async getNewsItems(): Promise<HomeScreenNewsItem[]> {
        return [];
    }
}
