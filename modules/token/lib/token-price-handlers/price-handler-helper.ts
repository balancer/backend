import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';

export type tokenAndPrice = {
    address: string;
    chain: Chain;
    price: number;
};

export async function updatePrices(handlerId: string, tokens: tokenAndPrice[], hourlyTimestamp: number) {
    const operations: any[] = [];

    for (const token of tokens) {
        // update or create hourly price
        operations.push(
            await prisma.prismaTokenPrice.upsert({
                where: {
                    tokenAddress_timestamp_chain: {
                        tokenAddress: token.address,
                        timestamp: hourlyTimestamp,
                        chain: token.chain,
                    },
                },
                update: {
                    price: token.price,
                    close: token.price,
                    updatedBy: handlerId,
                },
                create: {
                    tokenAddress: token.address,
                    chain: token.chain,
                    timestamp: hourlyTimestamp,
                    price: token.price,
                    high: token.price,
                    low: token.price,
                    open: token.price,
                    close: token.price,
                    updatedBy: handlerId,
                },
            }),
        );

        // create or update current price
        operations.push(
            prisma.prismaTokenCurrentPrice.upsert({
                where: { tokenAddress_chain: { tokenAddress: token.address, chain: token.chain } },
                update: {
                    price: token.price,
                    timestamp: hourlyTimestamp,
                    updatedBy: handlerId,
                },
                create: {
                    tokenAddress: token.address,
                    chain: token.chain,
                    timestamp: hourlyTimestamp,
                    price: token.price,
                    updatedBy: handlerId,
                },
            }),
        );
    }

    await prismaBulkExecuteOperations(operations);
}
