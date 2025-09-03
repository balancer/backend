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
        const existingTokens = await prisma.prismaTokenYield.findMany({ where: { chain } });

        const fetchedTokenSources = new Set(tokenAprs.map((t) => t.source));
        const fetchedTokenSourcesSuccess = new Set(tokenAprs.filter((t) => t.success).map((t) => t.source));
        const fetchedTokenAddresses = new Set(tokenAprs.map((t) => t.address));

        const removeTokens = existingTokens
            .filter(
                (x) =>
                    // remove a token if the source is no longer fetched
                    !fetchedTokenSources.has(x.source) ||
                    // remove a token if the source is fetched and successful but the address is not fetched
                    (fetchedTokenSources.has(x.source) &&
                        fetchedTokenSourcesSuccess.has(x.source) &&
                        !fetchedTokenAddresses.has(x.address)),
            )
            .map((x) => x.address);

        const upserts = tokenAprs
            .filter((tokenApr) => tokenApr.success)
            .map((tokenApr) => ({
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
                ...upserts.map((upsert) => prisma.prismaTokenYield.upsert(upsert)),
                prisma.prismaTokenYield.deleteMany({
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
