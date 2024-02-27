import { isSameAddress } from '@balancer-labs/sdk';
import { Chain, Prisma } from '@prisma/client';
import axios from 'axios';
import { prisma } from '../../prisma/prisma-client';
import { networkContext } from '../network/network-context.service';
import { ContentService, FeaturedPool, HomeScreenFeaturedPoolGroup, HomeScreenNewsItem } from './content-types';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { LinearData } from '../pool/subgraph-mapper';

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

const sepoliaTokens: Record<string, { symbol: string; coingeckoTokenId: string }> = {
    '0xb19382073c7a0addbb56ac6af1808fa49e377b75': {
        symbol: 'BAL',
        coingeckoTokenId: 'balancer',
    },
    '0xf04378a3ff97b3f979a46f91f9b2d5a1d2394773': {
        symbol: 'DAI',
        coingeckoTokenId: 'dai',
    },
    '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': {
        symbol: 'WETH',
        coingeckoTokenId: 'weth',
    },
    '0x80d6d3946ed8a1da4e226aa21ccddc32bd127d1a': {
        symbol: 'USDC',
        coingeckoTokenId: 'usd-coin',
    },
    '0x6bf294b80c7d8dc72dee762af5d01260b756a051': {
        symbol: 'USDT',
        coingeckoTokenId: 'tether',
    },
    '0x23bad11f1543503cb1fb5dad05fdaf93f42d30f3': {
        symbol: 'EURS',
        coingeckoTokenId: 'stasis-eurs',
    },
    '0x0f409e839a6a790aecb737e4436293be11717f95': {
        symbol: 'BEETS',
        coingeckoTokenId: 'beethoven-x',
    },
    '0xc3745bce4b5d0977dc874832bc99108d416dce8f': {
        symbol: 'WBTC',
        coingeckoTokenId: 'wrapped-bitcoin',
    },
};

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
            let coingeckoTokenId = null;

            if (networkContext.chain === 'SEPOLIA') {
                if (sepoliaTokens[tokenAddress]) {
                    coingeckoTokenId = sepoliaTokens[tokenAddress].coingeckoTokenId;
                }
            }

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
                    coingeckoTokenId: coingeckoTokenId,
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
                    coingeckoTokenId: coingeckoTokenId,
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
                typeData: true,
                tokens: { orderBy: { index: 'asc' } },
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

            if (
                (pool?.type === 'COMPOSABLE_STABLE' || pool?.type === 'LINEAR') &&
                !tokenTypes.includes('PHANTOM_BPT')
            ) {
                types.push({
                    id: `${token.address}-phantom-bpt`,
                    chain: networkContext.chain,
                    type: 'PHANTOM_BPT',
                    tokenAddress: token.address,
                });
            }

            const wrappedIndex = pool ? (pool.typeData as LinearData).wrappedIndex : undefined;
            const wrappedLinearPoolToken = wrappedIndex
                ? pools.find((pool) => pool.tokens[wrappedIndex]?.address === token.address)
                : undefined;

            if (wrappedLinearPoolToken && !tokenTypes.includes('LINEAR_WRAPPED_TOKEN')) {
                types.push({
                    id: `${token.address}-linear-wrapped`,
                    chain: networkContext.chain,
                    type: 'LINEAR_WRAPPED_TOKEN',
                    tokenAddress: token.address,
                });
            }

            if (!wrappedLinearPoolToken && tokenTypes.includes('LINEAR_WRAPPED_TOKEN')) {
                prisma.prismaTokenType.delete({
                    where: { id_chain: { id: `${token.address}-linear-wrapped`, chain: networkContext.chain } },
                });
            }
        }

        await prisma.prismaTokenType.createMany({ skipDuplicates: true, data: types });
    }
    async syncPoolContentData(): Promise<void> {}

    async getFeaturedPoolGroups(chains: Chain[]): Promise<HomeScreenFeaturedPoolGroup[]> {
        return [];
    }

    async getFeaturedPools(chains: Chain[]): Promise<FeaturedPool[]> {
        const { data } = await axios.get<FeaturedPoolMetadata[]>(POOLS_METADATA_URL);
        const pools = data.filter((pool) => chains.includes(chainIdToChain[pool.chainId]));
        return pools.map(({ id, primary, chainId }) => ({
            poolId: id,
            chain: chainIdToChain[chainId],
            primary: Boolean(primary),
        })) as FeaturedPool[];
    }

    async getNewsItems(): Promise<HomeScreenNewsItem[]> {
        return [];
    }
}
