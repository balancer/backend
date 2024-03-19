import _ from 'lodash';
import { roundToHour, roundToMidnight } from '../../common/time';
import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { SwapEvent } from '../../../prisma/prisma-types';
import { formatUnits } from 'viem';

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
                    equals: parseInt(timestamp),
                },
                chain,
            },
            include: {
                token: true,
            },
        });

        for (const swap of swaps) {
            const tokenIn = tokenPrices.find((price) => price.tokenAddress === swap.payload.tokenIn.address);
            const tokenOut = tokenPrices.find((price) => price.tokenAddress === swap.payload.tokenOut.address);

            console.log('tokenIn', tokenIn);
            console.log('tokenOut', tokenOut);

            const payload = {
                tokenIn: {
                    ...swap.payload.tokenIn,
                    valueUSD:
                        (tokenIn?.price || 0) *
                        parseFloat(formatUnits(BigInt(swap.payload.tokenIn.amount), tokenIn?.token.decimals || 18)),
                },
                tokenOut: {
                    ...swap.payload.tokenOut,
                    valueUSD:
                        (tokenOut?.price || 0) *
                        parseFloat(formatUnits(BigInt(swap.payload.tokenOut.amount), tokenOut?.token.decimals || 18)),
                },
            };

            dbEntries.push({
                ...swap,
                // Taking all the chances to get the token price
                valueUSD: payload.tokenIn.valueUSD || payload.tokenOut.valueUSD || 0,
                payload,
            });
        }
    }
    return dbEntries;
}
