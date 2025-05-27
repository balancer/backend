import { Prisma, Chain, PoolEventType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { JoinExitEvent, SwapEvent } from '../../../prisma/prisma-types';
import type { SwapStats } from './types';
import { daysAgo, now } from '../../common/time';

const orderBy: Prisma.PrismaPoolEventOrderByWithRelationInput[] = [
    { blockTimestamp: 'desc' },
    { blockNumber: 'desc' },
    { logIndex: 'desc' },
];

export const eventsRepository = {
    getEvents: async ({
        chain,
        poolId,
        userAddress,
        limit,
        offset,
    }: {
        chain: Chain;
        poolId?: string;
        userAddress?: string;
        limit?: number;
        offset?: number;
    }): Promise<(SwapEvent | JoinExitEvent)[]> => {
        // Defaults
        limit = Math.min(1000, limit ?? 1000); // Limiting to 1000 events
        offset = offset ?? 0;

        const where: Prisma.PrismaPoolEventWhereInput = {
            chain,
            ...(poolId ? { poolId } : {}),
            ...(userAddress
                ? {
                      userAddress: userAddress.toLowerCase(),
                  }
                : {}),
        };

        const dbEvents = await prisma.prismaPoolEvent.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy,
        });

        const results = dbEvents.map((event) =>
            event.type === 'SWAP' ? (event as SwapEvent) : (event as JoinExitEvent),
        );

        return results;
    },
    getLatestEvent: async ({
        chain,
        protocolVersion,
        types,
        timestamp,
    }: {
        chain: Chain;
        protocolVersion?: number;
        types?: PoolEventType[];
        timestamp?: number;
    }) => {
        if (timestamp && (timestamp < 0 || timestamp > now() || timestamp < now() - 3 * 365 * 24 * 60 * 60)) {
            throw new Error(`Invalid timestamp ${timestamp}`);
        }

        const where: Prisma.PrismaPoolEventWhereInput = {
            chain,
            ...(protocolVersion ? { protocolVersion } : {}),
            ...(types
                ? {
                      type: {
                          in: types,
                      },
                  }
                : {}),
            ...(timestamp ? { blockTimestamp: { lte: timestamp } } : {}),
        };

        const latestEvent = await prisma.prismaPoolEvent.findFirst({
            where,
            orderBy,
        });

        if (!latestEvent) {
            return null;
        }

        return latestEvent.type === 'SWAP' ? (latestEvent as SwapEvent) : (latestEvent as JoinExitEvent);
    },
    getSwapStats: async ({ chain, poolIds, since }: { chain: Chain; poolIds?: string[]; since: number }) => {
        if (since < 0 || since > now() || since < now() - 3 * 365 * 24 * 60 * 60) {
            throw new Error(`Invalid timestamp ${since}`);
        }

        const query = Prisma.raw(`SELECT
            "poolId",
            SUM("valueUSD") AS volume,
            SUM((payload->'fee'->>'valueUSD')::numeric) AS fees,
            SUM((payload->'dynamicFee'->>'valueUSD')::numeric) AS "dynamicFees",
            SUM((payload->'surplus'->>'valueUSD')::numeric) AS surplus
          FROM "PartitionedPoolEvent"
          WHERE
            "blockTimestamp" >= ${since}
            AND chain = '${chain}'
            AND type = 'SWAP'
            ${poolIds && poolIds.length < 30 ? 'AND "poolId" IN (\'' + poolIds.join("','") + "')" : ''}
          GROUP BY 1`);

        const stats = await prisma.$queryRaw<SwapStats[]>(query);

        return stats;
    },
    getDailyBlockNumbers: async (chain: Chain, days: number) => {
        const blocks = await prisma.$queryRawUnsafe<{ timestamp: number; number: number }[]>(`
            SELECT
                ("blockTimestamp"/86400)::INTEGER * 86400 as timestamp,
                MIN("blockNumber") as number
            FROM "PartitionedPoolEvent"
            WHERE chain = '${chain}'
            AND "blockTimestamp" >= ${daysAgo(days)}
            GROUP BY 1
            ORDER BY 1 DESC`);

        return blocks;
    },
    getSwapsForPricing: async (chain: Chain) => {
        const swaps = await prisma.prismaPoolEvent.findMany({
            select: { payload: true },
            where: {
                chain,
                type: 'SWAP',
                blockTimestamp: { gt: now() - 900 }, // only search for the last 15 minutes
            },
            orderBy,
        });

        return swaps as SwapEvent[];
    },
    storeEvents: async (events: (SwapEvent | JoinExitEvent)[]) => {
        await prisma.prismaPoolEvent.createMany({
            skipDuplicates: true,
            data: events,
        });

        return true;
    },
};
