import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { Chain } from '@prisma/client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';

export class FallbackHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'FallbackHandlerService';

    public async updatePricesForTokens(
        tokens: PrismaTokenWithTypes[],
        chains: Chain[],
    ): Promise<PrismaTokenWithTypes[]> {
        const timestamp = timestampRoundedUpToNearestHour();
        const updated: PrismaTokenWithTypes[] = [];

        const operations: any[] = [];
        for (const chain of chains) {
            const acceptedTokensForChain = tokens.filter((token) => token.chain === chain);
            const tokenAddresses = acceptedTokensForChain.map((token) => token.address);

            const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
                where: { chain: chain, tokenAddress: { in: tokenAddresses } },
            });

            for (const token of acceptedTokensForChain) {
                const price = tokenPrices.find((tokenPrice) => tokenPrice.tokenAddress === token.address);
                if (price) {
                    operations.push(
                        prisma.prismaTokenPrice.upsert({
                            where: {
                                tokenAddress_timestamp_chain: {
                                    tokenAddress: token.address,
                                    timestamp: timestamp,
                                    chain: token.chain,
                                },
                            },
                            update: {
                                price: price.price,
                                close: price.price,
                                updatedAt: price.updatedAt,
                                updatedBy: price.updatedBy,
                            },
                            create: {
                                tokenAddress: token.address,
                                chain: token.chain,
                                timestamp: timestamp,
                                price: price.price,
                                high: price.price,
                                low: price.price,
                                open: price.price,
                                close: price.price,
                                updatedAt: price.updatedAt,
                                updatedBy: price.updatedBy,
                            },
                        }),
                    );
                    updated.push(token);
                }
            }
        }

        prismaBulkExecuteOperations(operations);

        return updated;
    }
}
