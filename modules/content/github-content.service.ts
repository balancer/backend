import { isSameAddress } from '@balancer-labs/sdk';
import { Chain, Prisma } from '@prisma/client';
import axios from 'axios';
import { prisma } from '../../prisma/prisma-client';
import { networkContext } from '../network/network-context.service';
import { ContentService, HomeScreenFeaturedPoolGroup, HomeScreenNewsItem } from './content-types';
import { chainIdToChain } from '../network/network-config';

const POOLS_METADATA_URL = 'https://raw.githubusercontent.com/balancer/metadata/main/pools/featured.json';

const TOKEN_LIST_URL = 'https://raw.githubusercontent.com/balancer/tokenlists/main/generated/balancer.tokenlist.json';

interface FeaturedPoolMetadata {
    id: string;
    imageUrl: string;
    primary: boolean;
    chainId: number;
}
interface WhitelistedTokenList {
    name: string;
    timestamp: string;
    tokens: WhitelistedToken[];
}

interface WhitelistedToken {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
}

//TODO implement other content functions
export class GithubContentService implements ContentService {
    async syncTokenContentData(): Promise<void> {
        const { data: githubAllTokenList } = await axios.get<WhitelistedTokenList>(TOKEN_LIST_URL);

        const filteredTokenList = githubAllTokenList.tokens.filter((token) => {
            if (`${token.chainId}` !== networkContext.chainId) {
                return false;
            }

            const requiredKeys = ['chainId', 'address', 'name', 'symbol', 'decimals'];
            return requiredKeys.every((key) => token?.[key as keyof WhitelistedToken] != null);
        });

        for (const githubToken of filteredTokenList) {
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

        const addToWhitelist = filteredTokenList.filter((githubToken) => {
            return !whiteListedTokens.some((dbToken) => isSameAddress(githubToken.address, dbToken.tokenAddress));
        });

        const removeFromWhitelist = whiteListedTokens.filter((dbToken) => {
            return !filteredTokenList.some((githubToken) => isSameAddress(dbToken.tokenAddress, githubToken.address));
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
                (pool) => pool.linearData && pool.tokens[pool.linearData.wrappedIndex]?.address === token.address,
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
    async getFeaturedPoolGroups(chains: Chain[]): Promise<HomeScreenFeaturedPoolGroup[]> {
        const { data } = await axios.get<FeaturedPoolMetadata[]>(POOLS_METADATA_URL);
        const pools = data.filter((pool) => chains.includes(chainIdToChain[pool.chainId]));
        return pools.map(({ id, imageUrl, primary, chainId }) => ({
            id,
            _type: 'homeScreenFeaturedPoolGroupPoolId',
            title: 'Popular pools',
            items: [
                {
                    _key: '',
                    _type: 'homeScreenFeaturedPoolGroupPoolId',
                    poolId: id,
                },
            ],
            icon: imageUrl,
            chain: chainIdToChain[chainId],
            primary: Boolean(primary),
        })) as HomeScreenFeaturedPoolGroup[];
    }
    async getNewsItems(): Promise<HomeScreenNewsItem[]> {
        return [];
    }
}
