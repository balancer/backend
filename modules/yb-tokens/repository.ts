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
        const operations = tokenAprs.map((tokenApr) => ({
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
            operations.map((operation) => prisma.prismaYbToken.upsert(operation)),
            true,
        );
    }
}
