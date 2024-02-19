import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import {
    timestampEndOfDayMidnight,
    timestampRoundedUpToNearestHour,
    timestampTopOfTheHour,
} from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';

export class BptPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'BptPriceHandlerService';

    private getAcceptedTokens(tokens: PrismaTokenWithTypes[]): PrismaTokenWithTypes[] {
        return tokens.filter((token) => token.types.includes('BPT') || token.types.includes('PHANTOM_BPT'));
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<PrismaTokenWithTypes[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);
        const timestamp = timestampRoundedUpToNearestHour();
        const timestampMidnight = timestampEndOfDayMidnight();
        const pools = await prisma.prismaPool.findMany({
            where: { dynamicData: { totalLiquidity: { gt: 0.1 } } },
            include: { dynamicData: true },
        });
        let updated: PrismaTokenWithTypes[] = [];
        let operations: any[] = [];

        for (const token of acceptedTokens) {
            const pool = pools.find((pool) => pool.address === token.address && pool.chain === token.chain);

            if (
                pool?.dynamicData &&
                pool.dynamicData.totalLiquidity !== 0 &&
                parseFloat(pool.dynamicData.totalShares) !== 0
            ) {
                const price = pool.dynamicData.totalLiquidity / parseFloat(pool.dynamicData.totalShares);

                operations.push(
                    await prisma.prismaTokenPrice.upsert({
                        where: {
                            tokenAddress_timestamp_chain: {
                                tokenAddress: token.address,
                                timestamp,
                                chain: token.chain,
                            },
                        },
                        update: { price: price, close: price },
                        create: {
                            tokenAddress: token.address,
                            chain: token.chain,
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
                    await prisma.prismaTokenPrice.upsert({
                        where: {
                            tokenAddress_timestamp_chain: {
                                tokenAddress: token.address,
                                timestamp: timestampMidnight,
                                chain: token.chain,
                            },
                        },
                        update: { price: price, close: price },
                        create: {
                            tokenAddress: token.address,
                            chain: token.chain,
                            timestamp: timestampMidnight,
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
                        where: { tokenAddress_chain: { tokenAddress: token.address, chain: token.chain } },
                        update: { price: price },
                        create: {
                            tokenAddress: token.address,
                            chain: token.chain,
                            timestamp,
                            price,
                        },
                    }),
                );
            }
            updated.push(token);
        }

        await Promise.all(operations);

        return updated;
    }
}
