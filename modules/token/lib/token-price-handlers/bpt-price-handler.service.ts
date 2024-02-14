import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';
import { networkContext } from '../../../network/network-context.service';

export class BptPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'BptPriceHandlerService';

    private getAcceptedTokens(tokens: PrismaTokenWithTypes[]): PrismaTokenWithTypes[] {
        return tokens.filter((token) => token.types.includes('BPT') || token.types.includes('PHANTOM_BPT'));
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<PrismaTokenWithTypes[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);
        const timestamp = timestampRoundedUpToNearestHour();
        const pools = await prisma.prismaPool.findMany({
            where: { dynamicData: { totalLiquidity: { gt: 0.1 } }, chain: networkContext.chain },
            include: { dynamicData: true },
        });
        let updated: string[] = [];
        let operations: any[] = [];

        for (const token of tokens) {
            const pool = pools.find((pool) => pool.address === token.address);

            if (
                pool?.dynamicData &&
                pool.dynamicData.totalLiquidity !== 0 &&
                parseFloat(pool.dynamicData.totalShares) !== 0
            ) {
                const price = pool.dynamicData.totalLiquidity / parseFloat(pool.dynamicData.totalShares);

                updated.push(token.address);

                operations.push(
                    await prisma.prismaTokenPrice.upsert({
                        where: {
                            tokenAddress_timestamp_chain: {
                                tokenAddress: token.address,
                                timestamp,
                                chain: networkContext.chain,
                            },
                        },
                        update: { price: price, close: price },
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
            }
        }

        await Promise.all(operations);

        return updated;
    }
}
