import _ from 'lodash';
import { roundToHour, roundToMidnight } from '../../common/time';
import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { SwapEvent } from '../../../prisma/prisma-types';

/**
 * Takes swaps events and enriches them with USD values
 *
 * @param swaps
 * @param chain
 * @returns
 */
export async function swapsUsd(swaps: SwapEvent[], chain: Chain): Promise<SwapEvent[]> {
    // Enrich with USD values
    // Group swaps based on timestamp, hourly and daily buckets
    const groupedSwaps = _.groupBy(swaps, (swap) => {
        const timestamp = swap.blockTimestamp;
        // If swap is older than 30 days, round to midnight
        if (timestamp < Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60) {
            return roundToMidnight(timestamp);
        }
        // Otherwise round to the nearest hour
        return roundToHour(timestamp);
    });

    const dbEntries: SwapEvent[] = [];
    for (const [timestamp, swaps] of Object.entries(groupedSwaps)) {
        const tokenPrices = await prisma.prismaTokenPrice.findMany({
            where: {
                timestamp: {
                    gte: parseInt(timestamp),
                },
                chain,
            },
        });

        for (const swap of swaps) {
            let amountUsd = 0;
            const tokenInPrice =
                tokenPrices.find((price) => price.tokenAddress === swap.payload.tokenIn.address)?.price || 0;
            const tokenOutPrice =
                tokenPrices.find((price) => price.tokenAddress === swap.payload.tokenOut.address)?.price || 0;

            // Taking all the chances to get the token price
            if (tokenInPrice > 0) {
                amountUsd = tokenInPrice * parseFloat(swap.payload.tokenIn.amount);
            } else {
                amountUsd = tokenOutPrice * parseFloat(swap.payload.tokenOut.amount);
            }

            dbEntries.push({
                ...swap,
                valueUSD: amountUsd,
                payload: {
                    tokenIn: {
                        ...swap.payload.tokenIn,
                        valueUSD: tokenInPrice * parseFloat(swap.payload.tokenIn.amount),
                    },
                    tokenOut: {
                        ...swap.payload.tokenOut,
                        valueUSD: tokenOutPrice * parseFloat(swap.payload.tokenOut.amount),
                    },
                },
            });
        }
    }
    return dbEntries;
}
