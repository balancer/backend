import { sanityClient } from '../../util/sanity';
import { env } from '../../../app/env';
import { prisma } from '../../util/prisma-client';
import { Prisma } from '@prisma/client';

const SANITY_TOKEN_TYPE_MAP: { [key: string]: string } = {
    '250': 'fantomToken',
    '4': 'rinkebyToken',
};

interface SanityToken {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    coingeckoPlatformId?: string;
    coingeckoContractAddress?: string;
}

export class TokenDataLoaderService {
    public async syncSanityTokenData(): Promise<void> {
        const sanityTokens = await sanityClient.fetch<SanityToken[]>(`
            *[_type=="${SANITY_TOKEN_TYPE_MAP[env.CHAIN_ID]}"] {
                name,
                address,
                symbol,
                decimals,
                logoURI,
                coingeckoPlatformId,
                coingeckoContractAddress
            }
        `);

        //TODO: could be more intelligent about when to upsert
        for (const sanityToken of sanityTokens) {
            const tokenAddress = sanityToken.address.toLowerCase();

            await prisma.prismaToken.upsert({
                where: { address: tokenAddress },
                create: {
                    name: sanityToken.name,
                    address: tokenAddress,
                    symbol: sanityToken.symbol,
                    decimals: sanityToken.decimals,
                    logoURI: sanityToken.logoURI,
                    coingeckoPlatformId: sanityToken.coingeckoPlatformId?.toLowerCase(),
                    coingeckoContractAddress: sanityToken.coingeckoContractAddress?.toLowerCase(),
                },
                update: {
                    name: sanityToken.name,
                    symbol: sanityToken.symbol,
                    //use set to ensure we overwrite the underlying value if it is removed in sanity
                    logoURI: { set: sanityToken.logoURI || null },
                    coingeckoPlatformId: { set: sanityToken.coingeckoPlatformId?.toLowerCase() || null },
                    coingeckoContractAddress: { set: sanityToken.coingeckoContractAddress?.toLowerCase() || null },
                },
            });
        }

        //TODO: need to be able to remove whitelist
        await prisma.prismaTokenType.createMany({
            skipDuplicates: true,
            data: sanityTokens.map((token) => ({
                id: `${token.address}-white-listed`,
                tokenAddress: token.address.toLowerCase(),
                type: 'WHITE_LISTED' as const,
            })),
        });

        await this.syncTokenTypes();
    }

    public async syncTokenTypes() {
        const pools = await this.loadPoolData();
        const tokens = await prisma.prismaToken.findMany({ include: { types: true } });
        const types: Prisma.PrismaTokenTypeCreateManyInput[] = [];

        for (const token of tokens) {
            const tokenTypes = token.types.map((tokenType) => tokenType.type);
            const pool = pools.find((pool) => pool.address === token.address);

            if (pool && !tokenTypes.includes('BPT')) {
                types.push({
                    id: `${token.address}-bpt`,
                    type: 'BPT',
                    tokenAddress: token.address,
                });
            }

            if ((pool?.type === 'PHANTOM_STABLE' || pool?.type === 'LINEAR') && !tokenTypes.includes('PHANTOM_BPT')) {
                types.push({
                    id: `${token.address}-phantom-bpt`,
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
                    type: 'LINEAR_WRAPPED_TOKEN',
                    tokenAddress: token.address,
                });
            }
        }

        await prisma.prismaTokenType.createMany({ skipDuplicates: true, data: types });
    }

    private async loadPoolData() {
        return prisma.prismaPool.findMany({
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
