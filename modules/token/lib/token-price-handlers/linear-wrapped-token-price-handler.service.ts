import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { networkContext } from '../../../network/network-context.service';

export class LinearWrappedTokenPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'LinearWrappedTokenPriceHandlerService';

    public async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        return tokens.filter((token) => token.types.includes('LINEAR_WRAPPED_TOKEN')).map((token) => token.address);
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        let operations: any[] = [];
        const tokensUpdated: string[] = [];
        const timestamp = timestampRoundedUpToNearestHour();
        const pools = await prisma.prismaPool.findMany({
            where: {
                type: 'LINEAR',
                chain: networkContext.chain,
                categories: { none: { category: 'BLACK_LISTED' } },
            },
            include: { linearData: true, tokens: { orderBy: { index: 'asc' }, include: { dynamicData: true } } },
        });
        const mainTokenPrices = await prisma.prismaTokenPrice.findMany({
            where: {
                chain: networkContext.chain,
                tokenAddress: { in: pools.map((pool) => pool.tokens[pool.linearData?.mainIndex || 0].address) },
                timestamp,
            },
        });

        for (const token of tokens) {
            const pool = pools.find(
                (pool) => pool.linearData && token.address === pool.tokens[pool.linearData.wrappedIndex].address,
            );

            if (pool && pool.linearData) {
                const mainToken = pool.tokens[pool.linearData.mainIndex];
                const wrappedToken = pool.tokens[pool.linearData.wrappedIndex];
                const mainTokenPrice = mainTokenPrices.find(
                    (tokenPrice) => tokenPrice.tokenAddress == mainToken.address,
                );

                if (mainTokenPrice && wrappedToken.dynamicData) {
                    const price = mainTokenPrice.price * parseFloat(wrappedToken.dynamicData.priceRate);

                    operations.push(
                        prisma.prismaTokenPrice.upsert({
                            where: {
                                tokenAddress_timestamp_chain: {
                                    tokenAddress: token.address,
                                    timestamp,
                                    chain: networkContext.chain,
                                },
                            },
                            update: { price, close: price },
                            create: {
                                tokenAddress: token.address,
                                chain: networkContext.chain,
                                timestamp,
                                price,
                                high: price,
                                low: price,
                                open: price,
                                close: price,
                            },
                        }),
                    );

                    operations.push(
                        prisma.prismaTokenCurrentPrice.upsert({
                            where: { tokenAddress_chain: { tokenAddress: token.address, chain: networkContext.chain } },
                            update: { price: price },
                            create: {
                                tokenAddress: token.address,
                                chain: networkContext.chain,
                                timestamp,
                                price,
                            },
                        }),
                    );

                    tokensUpdated.push(token.address);
                }
            }
        }

        await Promise.all(operations);

        return tokensUpdated;
    }
}
