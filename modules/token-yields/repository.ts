import { Chain, PrismaTokenYield } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { YieldToken } from './types';

export class TokenYieldRepository {
    /**
     * Get all token yields for a specific chain
     */
    async getTokenYields(chain: Chain): Promise<PrismaTokenYield[]> {
        return prisma.prismaTokenYield.findMany({
            where: { chain },
        });
    }

    /**
     * Store token yields in database
     */
    async storeTokenYields(chain: Chain, tokenAprs: YieldToken[]): Promise<void> {
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
            operations.map((operation) => prisma.prismaTokenYield.upsert(operation)),
            true,
        );
    }
}
