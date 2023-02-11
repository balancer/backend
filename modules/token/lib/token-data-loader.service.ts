import { getSanityClient } from '../../sanity/sanity';
import { prisma } from '../../../prisma/prisma-client';
import { Prisma } from '@prisma/client';
import { isSameAddress } from '@balancer-labs/sdk';
import { networkContext } from '../../network/network-context.service';

const SANITY_TOKEN_TYPE_MAP: { [key: string]: string } = {
    '250': 'fantomToken',
    '4': 'rinkebyToken',
    '10': 'optimismToken',
};

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

export class TokenDataLoaderService {
    public async syncSanityTokenData(): Promise<void> {
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

    public async syncTokenTypes() {
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
}
