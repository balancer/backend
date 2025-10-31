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
        eventType,
        userAddress,
        limit,
        offset,
    }: {
        chain: Chain;
        poolId?: string;
        eventType?: PoolEventType;
        userAddress?: string;
        limit?: number;
        offset?: number;
    }): Promise<(SwapEvent | JoinExitEvent)[]> => {
        // Defaults
        limit = Math.min(1000, limit ?? 1000); // Limiting to 1000 events
        offset = offset ?? 0;

        const where: Prisma.PrismaPoolEventWhereInput = {
            chain,
            ...(poolId
                ? {
                      poolId,
                      ...(userAddress
                          ? {
                                userAddress: userAddress.toLowerCase(),
                            }
                          : {}),
                  }
                : {}),
            ...(eventType ? { type: eventType } : {}),
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
        block,
        poolId,
    }: {
        chain: Chain;
        protocolVersion?: number;
        types?: PoolEventType[];
        timestamp?: number;
        block?: number;
        poolId?: string;
    }) => {
        if (timestamp && (timestamp < 0 || timestamp > now() || timestamp < now() - 3 * 365 * 24 * 60 * 60)) {
            throw new Error(`Invalid timestamp ${timestamp}`);
        }

        const where: Prisma.PrismaPoolEventWhereInput = {
            chain,
            ...(protocolVersion ? { protocolVersion } : {}),
            ...(timestamp ? { blockTimestamp: { lte: timestamp } } : {}),
            ...(block ? { blockNumber: { lte: block } } : {}),
            ...(poolId ? { poolId } : {}),
        };

        if (!types) {
            types = ['EXIT', 'JOIN', 'SWAP'];
        }

        // To use the index properly, query must have a type
        // Get events for all types separately and match which one is the latest
        const events = await Promise.all(
            types.map(async (type) =>
                prisma.prismaPoolEvent.findFirst({
                    where: {
                        ...where,
                        type,
                    },
                    orderBy,
                }),
            ),
        );

        const sortedEvents = events
            .filter((event): event is NonNullable<typeof event> => event !== null)
            .sort((a, b) => b.blockNumber - a.blockNumber);

        const latestEvent = sortedEvents[0] || null;

        if (!latestEvent) {
            return null;
        }

        return latestEvent.type === 'SWAP' ? (latestEvent as SwapEvent) : (latestEvent as JoinExitEvent);
    },
    getSwapStats: async ({
        chain,
        poolIds,
        since,
        until,
    }: {
        chain: Chain;
        poolIds?: string[];
        since: number;
        until?: number;
    }) => {
        if (since < 0 || since > now() || since < now() - 3 * 365 * 24 * 60 * 60) {
            throw new Error(`Invalid timestamp for since ${since}`);
        }
        if (until && (until < 0 || until > since)) {
            throw new Error(`Invalid timestamp for until ${until}`);
        }

        const query = Prisma.raw(`SELECT
            "poolId",
            SUM("valueUSD") AS volume,
            SUM((payload->'fee'->>'valueUSD')::numeric) AS fees,
            SUM((payload->'dynamicFee'->>'valueUSD')::numeric) AS "dynamicFees",
            SUM((payload->'surplus'->>'valueUSD')::numeric) AS surplus,
            MAX("blockNumber") AS "latestBlockNumber" AS,
            count(*) AS "swapsCount"
          FROM "PartitionedPoolEvent"
          WHERE
            "blockTimestamp" >= ${since}
            ${until ? 'AND "blockTimestamp" <= ${until}' : ''}
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
            AND type = 'SWAP'
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
    getAllEventsForTimeRange: async (chain: Chain, poolId: string, startTime?: number, endTime?: number) => {
        const events = await prisma.prismaPoolEvent.findMany({
            where: {
                chain,
                poolId,
                blockTimestamp: {
                    ...(startTime ? { gte: startTime } : {}),
                    ...(endTime ? { lte: endTime } : {}),
                },
            },
            orderBy,
        });

        return events as (SwapEvent | JoinExitEvent)[];
    },
    getTokenFlows: async (
        chain: Chain,
        poolId: string,
        tokenA: string,
        tokenB: string,
        interval = 3600,
        from?: number,
    ) => {
        const whereClause = ['chain = $1::"Chain"', '"poolId" = $2'];
        const params = [chain, poolId, interval];
        if (from) {
            whereClause.push('"blockTimestamp" >= $3');
            params.push(from);
        }

        const query = `
          -- 1) Aggregate SWAPs
          WITH swaps AS (
            SELECT
              FLOOR("blockTimestamp"/3600)*3600 AS timestamp,
              SUM(
                CASE
                  WHEN LOWER("payload"->'tokenIn'->>'address') = $${params.length + 1}
                    THEN ("payload"->'tokenIn'->>'amount')::float
                  WHEN LOWER("payload"->'tokenOut'->>'address') = $${params.length + 1}
                    THEN -("payload"->'tokenOut'->>'amount')::float
                  ELSE 0
                END
              ) AS "tokenAFlow",
              SUM(
                CASE
                  WHEN LOWER("payload"->'tokenIn'->>'address') = $${params.length + 2}
                    THEN ("payload"->'tokenIn'->>'amount')::float
                  WHEN LOWER("payload"->'tokenOut'->>'address') = $${params.length + 2}
                    THEN -("payload"->'tokenOut'->>'amount')::float
                  ELSE 0
                END
              ) AS "tokenBFlow",
              SUM(
                CASE
                  WHEN LOWER("payload"->'tokenOut'->>'address') = $${params.length + 1}
                    THEN ("payload"->'tokenOut'->>'amount')::float
                  ELSE 0
                END
              ) AS "tokenABuy",
              SUM(
                CASE
                  WHEN LOWER("payload"->'tokenIn'->>'address') = $${params.length + 1}
                    THEN ("payload"->'tokenIn'->>'amount')::float
                  ELSE 0
                END
              ) AS "tokenASell",
              COUNT(*) AS "swapCount",
              SUM("valueUSD") AS volume
            FROM "PartitionedPoolEvent"
            WHERE
              "type" = 'SWAP'
              AND
              ${whereClause.join(' AND ')}
            GROUP BY 1
          ),

          -- 2) Unnest & aggregate JOIN/EXIT tokens
          joinexits AS (
            SELECT
              FLOOR(pe."blockTimestamp"/3600)*3600 AS timestamp,
              SUM(
                CASE
                  WHEN LOWER(token->>'address') = $${params.length + 1}
                    THEN (token->>'amount')::float
                         * (CASE WHEN pe."type" = 'EXIT' THEN -1 ELSE 1 END)
                  ELSE 0
                END
              ) AS "tokenAFlow",
              SUM(
                CASE
                  WHEN LOWER(token->>'address') = $${params.length + 2}
                    THEN (token->>'amount')::float
                         * (CASE WHEN pe."type" = 'EXIT' THEN -1 ELSE 1 END)
                  ELSE 0
                END
              ) AS "tokenBFlow"
            FROM "PartitionedPoolEvent" pe
            CROSS JOIN LATERAL
              jsonb_array_elements(pe."payload"->'tokens') AS token
            WHERE
              pe."type"  IN ('JOIN','EXIT')
              AND ${whereClause.join(' AND ')}
            GROUP BY 1
          )

          -- 3) Glue them back together
          SELECT
            COALESCE(s.timestamp, j.timestamp) AS timestamp,
            COALESCE(s."tokenAFlow", 0) + COALESCE(j."tokenAFlow", 0) AS "tokenAFlow",
            COALESCE(s."tokenBFlow", 0) + COALESCE(j."tokenBFlow", 0) AS "tokenBFlow",
            COALESCE(s."tokenABuy", 0) AS "tokenABuy",
            COALESCE(s."tokenASell", 0) AS "tokenASell",
            COALESCE(s."swapCount", 0) AS "swapCount",
            COALESCE(s.volume, 0) AS volume
          FROM swaps s
          FULL OUTER JOIN joinexits j
            ON s.timestamp = j.timestamp
          ORDER BY timestamp`;

        params.push(tokenA.toLowerCase());
        params.push(tokenB.toLowerCase());

        const results = (await prisma.$queryRawUnsafe(query, ...params)) as any[];

        return results
            .map((row) => ({
                timestamp: Number(row.timestamp),
                [tokenA]: Number(row.tokenAFlow || 0),
                [tokenB]: Number(row.tokenBFlow || 0),
                swapCount: Number(row.swapCount),
                volume: Number(row.volume),
                buyVolume: Number(row.tokenABuy),
                sellVolume: Number(row.tokenASell),
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    },
    getTopTrades: async (poolId: string, chain: Chain, take = 10) => {
        const events = await prisma.prismaPoolEvent.findMany({
            where: {
                poolId,
                chain,
                type: 'SWAP',
            },
            orderBy: { valueUSD: 'desc' },
            take,
        });

        return events;
    },
    storeEvents: async (events: (SwapEvent | JoinExitEvent)[]) => {
        await prisma.prismaPoolEvent.createMany({
            skipDuplicates: true,
            data: events,
        });

        return true;
    },
};
