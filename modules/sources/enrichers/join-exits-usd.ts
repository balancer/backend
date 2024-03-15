import _ from 'lodash';
import { roundToHour, roundToMidnight, daysAgo } from '../../common/time';
import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { JoinExitEvent } from '../../../prisma/prisma-types';

/**
 * Takes join/exit events and enriches them with USD values
 *
 * @param events
 * @param chain
 * @returns
 */
export async function joinExitsUsd(events: JoinExitEvent[], chain: Chain): Promise<JoinExitEvent[]> {
    // Enrich with USD values
    // Group swaps based on timestamp, hourly and daily buckets
    const grouped = _.groupBy(events, (event) => {
        const timestamp = event.blockTimestamp;
        // If swap is older than 30 days, round to midnight
        if (timestamp < daysAgo(30)) {
            return roundToMidnight(timestamp);
        }
        // Otherwise round to the nearest hour
        return roundToHour(timestamp);
    });

    const dbEntries: JoinExitEvent[] = [];
    for (const [timestamp, events] of Object.entries(grouped)) {
        // Calculating USD amounts with token prices at the time of the event
        // 🚨 Reading from the DB in a loop – will get slow with a large events volume
        // But we need prices based on the event timestamp, so batching this should be based on timestamp ranges
        const tokenPrices = await prisma.prismaTokenPrice.findMany({
            where: {
                timestamp: {
                    equals: parseInt(timestamp),
                },
                chain,
            },
        });

        for (const event of events) {
            const tokens = event.payload.tokens.map((token) => {
                const tokenPrice = tokenPrices.find((price) => price.tokenAddress === token.address);
                return {
                    ...token,
                    valueUSD: parseFloat(token.amount) * (tokenPrice?.price || 0),
                };
            });
            const valueUSD = tokens.reduce((acc, token) => acc + token.valueUSD, 0);

            dbEntries.push({
                ...event,
                valueUSD,
                payload: {
                    tokens,
                },
            });
        }
    }
    return dbEntries;
}
