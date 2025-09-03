import { Chain, PrismaYbToken } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { YbToken } from './types';

export class YbTokenRepository {
    /**
     * Get all token yields for a specific chain
     */
    async getTokens(chain: Chain): Promise<PrismaYbToken[]> {
        return prisma.prismaYbToken.findMany({
            where: { chain },
        });
    }

    /**
     * Store token yields in database
     */
    async storeTokens(chain: Chain, tokenAprs: YbToken[]): Promise<void> {
        const existingTokens = await prisma.prismaYbToken
            .findMany({ where: { chain } })
            .then((records) => records.map((r) => r.address));
        const fetchedTokens = new Set(tokenAprs.map((t) => t.address));
        const removeTokens = existingTokens.filter((x) => !fetchedTokens.has(x));

        const upserts = tokenAprs.map((tokenApr) => ({
            where: {
                address_chain: {
                    address: tokenApr.address.toLowerCase(),
                    chain,
                },
            },
            update: {
                apr: tokenApr.apr,
                source: tokenApr.source,
            },
            create: {
                address: tokenApr.address.toLowerCase(),
                chain,
                apr: tokenApr.apr,
                source: tokenApr.source,
            },
        }));

        await prismaBulkExecuteOperations(
            [
                ...upserts.map((upsert) => prisma.prismaYbToken.upsert(upsert)),
                prisma.prismaYbToken.deleteMany({
                    where: {
                        chain,
                        address: {
                            in: removeTokens,
                        },
                    },
                }),
            ],
            true,
        );
    }
}
