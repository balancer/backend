import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import _ from 'lodash';
import { daysAgo, roundToMidnight } from '../../common/time';
import {
    BalancerPoolSnapshotFragment,
    OrderDirection,
    PoolSnapshot_OrderBy,
} from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { poolsToIgnore } from '../../sor/utils';

// Constants
const PROTOCOL_VERSION = 2;
const SECONDS_PER_DAY = 86400;
const SNAPSHOT_STALE_THRESHOLD_DAYS = 5;
const NEW_POOL_LOOKBACK_DAYS = 2;
const BATCH_SIZE = 100;

// Safe parsing utilities
const safeParseFloat = (value: string | undefined | null, defaultValue = 0): number => {
    if (!value || value === '') return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

const safeNumber = (value: string | number | undefined | null, defaultValue = 0): number => {
    if (value === undefined || value === null || value === '') return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Batch fetch current prices for multiple token addresses
 * @param tokenAddresses Array of token addresses
 * @param chain Chain to fetch prices for
 * @returns Map of tokenAddress -> price
 */
const batchFetchCurrentPrices = async (tokenAddresses: string[], chain: Chain): Promise<Record<string, number>> => {
    try {
        if (!tokenAddresses.length) return {};

        const prices = await prisma.prismaTokenCurrentPrice.findMany({
            where: {
                tokenAddress: { in: tokenAddresses.map((addr) => addr.toLowerCase()) },
                chain,
            },
            select: { tokenAddress: true, price: true },
        });

        return prices.reduce(
            (acc, { tokenAddress, price }) => {
                acc[tokenAddress.toLowerCase()] = price;
                return acc;
            },
            {} as Record<string, number>,
        );
    } catch (error) {
        console.error(`Error batch fetching current prices:`, error);
        return {};
    }
};

/**
 * Batch fetch historical prices for multiple token addresses using generated midnight timestamps since Apr-19-2021
 * @param tokenAddresses Array of token addresses
 * @param chain Chain to fetch prices for
 * @returns Map of timestamp -> tokenAddress -> price
 */
const batchFetchHistoricalPrices = async (
    tokenAddresses: string[],
    chain: Chain,
): Promise<Record<string, Record<number, number>>> => {
    try {
        if (!tokenAddresses.length) return {};

        // Use raw SQL with window functions to generate midnight timestamps since Apr-19-2021
        // and get the most recent price for each token at each midnight timestamp
        const rawQuery = `
          WITH midnight_timestamps AS (
              SELECT extract(epoch from date_series::date)::integer AS timestamp
              FROM generate_series(
                  '2021-04-19'::date,
                  CURRENT_DATE,
                  '1 day'::interval
              ) AS date_series
          ),
          token_timestamp_pairs AS (
              SELECT
                  unnest($1::text[]) as token_address,
                  mt.timestamp as target_timestamp
              FROM midnight_timestamps mt
          )
          SELECT
              ttp.token_address,
              ttp.target_timestamp,
              tp.price
          FROM token_timestamp_pairs ttp
          LEFT JOIN LATERAL (
              SELECT price
              FROM "PrismaTokenPrice" tp
              WHERE tp."tokenAddress" = ttp.token_address
                AND tp.chain = $2::"Chain"
                AND tp.timestamp <= ttp.target_timestamp
              ORDER BY tp.timestamp DESC
              LIMIT 1
          ) tp ON TRUE
          WHERE tp.price IS NOT NULL
        `;

        const results = await prisma.$queryRawUnsafe<
            { token_address: string; target_timestamp: number; price: number }[]
        >(
            rawQuery,
            tokenAddresses.map((addr) => addr.toLowerCase()),
            chain,
        );

        // Group results by timestamp, then by token address
        const prices: Record<string, Record<number, number>> = {};

        for (const result of results) {
            if (!prices[result.token_address.toLowerCase()]) {
                prices[result.token_address.toLowerCase()] = {};
            }
            prices[result.token_address.toLowerCase()][result.target_timestamp] = result.price;
        }

        return prices;
    } catch (error) {
        console.error(`Error batch fetching historical prices:`, error);
        return {};
    }
};

/**
 * Sync snapshot balances to the database.
 *
 * @param V2SubgraphClient
 * @param chain
 * @returns
 */
export async function syncSnapshotsV2(subgraphClient: V2SubgraphClient, chain: Chain): Promise<string[]> {
    const midnight = roundToMidnight();
    const updatedPools = new Set<string>();

    try {
        // Get the latest snapshots from DB using safe Prisma query
        const latestSnapshotsList = await prisma.prismaPoolSnapshot.findMany({
            where: {
                chain,
                protocolVersion: PROTOCOL_VERSION,
                timestamp: { lt: midnight },
            },
            distinct: ['poolId'],
            orderBy: { timestamp: 'desc' },
        });

        const latestSnapshots = Object.fromEntries(latestSnapshotsList.map((s) => [s.poolId, s]));

        const latestIds = Object.keys(latestSnapshots);

        const allIds = (
            await prisma.prismaPool.findMany({
                select: { id: true },
                where: {
                    chain,
                    protocolVersion: PROTOCOL_VERSION,
                    createTime: { gte: daysAgo(NEW_POOL_LOOKBACK_DAYS) }, // Fetch new pools only
                },
            })
        ).map((r) => r.id);

        // Fully resync pools without snapshots
        const fullSync = new Set(allIds.filter((x) => !latestIds.includes(x)));

        const lastSnapshots = await subgraphClient.legacyService.getAllPoolSnapshots({
            where: {
                timestamp: midnight,
            },
        });

        // Batch fetch all current prices
        const poolAddresses = new Set(lastSnapshots.map((s) => s.pool.id.substring(0, 42)));
        const currentPrices = await batchFetchCurrentPrices([...poolAddresses], chain);

        // Process snapshots in batches for better performance
        const snapshotUpdates: any[] = [];

        for (const lastSnapshot of lastSnapshots) {
            try {
                // Validate required snapshot data
                if (!lastSnapshot?.pool?.id || !lastSnapshot.id || lastSnapshot.timestamp === undefined) {
                    console.warn(`Invalid snapshot data for pool: ${lastSnapshot?.pool?.id || 'unknown'}`);
                    continue;
                }

                const latestDb = latestSnapshots[lastSnapshot.pool.id];
                const timeDiff = latestDb ? lastSnapshot.timestamp - latestDb.timestamp : Infinity;
                const staleThreshold = SECONDS_PER_DAY * SNAPSHOT_STALE_THRESHOLD_DAYS;

                // If there's no DB record or latest DB snapshot is stale
                if (!latestDb || timeDiff > staleThreshold) {
                    fullSync.add(lastSnapshot.pool.id);
                    continue;
                }

                console.log('updating latest snapshot', lastSnapshot.id, chain);

                const data = dailyValues(
                    chain,
                    lastSnapshot,
                    { swapVolume: `${latestDb.totalSwapVolume}`, swapFees: `${latestDb.totalSwapFee}` },
                    currentPrices[latestDb.poolId.substring(0, 42)],
                );

                snapshotUpdates.push({
                    where: {
                        id_chain: {
                            id: lastSnapshot.id,
                            chain,
                        },
                    },
                    update: data,
                    create: data,
                });

                updatedPools.add(lastSnapshot.pool.id);
            } catch (error) {
                console.error(`Error processing snapshot for pool ${lastSnapshot?.pool?.id}:`, error);
            }
        }

        // Batch upsert snapshots
        for (let i = 0; i < snapshotUpdates.length; i += BATCH_SIZE) {
            const batch = snapshotUpdates.slice(i, i + BATCH_SIZE);
            await Promise.all(
                batch.map((update) =>
                    prisma.prismaPoolSnapshot.upsert(update).catch((error) => {
                        console.error(`Failed to upsert snapshot ${update.create.id}:`, error);
                    }),
                ),
            );
        }

        await syncSnapshotV2Pools(subgraphClient, [...fullSync], chain);

        fullSync.forEach((id) => updatedPools.add(id));

        return [...updatedPools];
    } catch (error) {
        console.error(`Error syncing snapshots for chain ${chain}:`, error);
        throw error;
    }
}

const dailyValues = (
    chain: Chain,
    s: BalancerPoolSnapshotFragment,
    previousSnapshot: { swapVolume: string; swapFees: string } | undefined,
    btpPrice?: number,
) => {
    // Safe parsing with validation
    const totalSharesNum = safeParseFloat(s.totalShares);
    const sharePrice = btpPrice || totalSharesNum > 0 ? safeParseFloat(s.liquidity) / totalSharesNum : 0;
    const totalLiquidity = totalSharesNum * sharePrice;
    const currentSwapVolume = safeParseFloat(s.swapVolume);
    const currentSwapFees = safeParseFloat(s.swapFees);
    const previousSwapVolume = safeParseFloat(previousSnapshot?.swapVolume);
    const previousSwapFees = safeParseFloat(previousSnapshot?.swapFees);

    return {
        id: s.id,
        poolId: s.pool.id,
        chain,
        timestamp: s.timestamp,
        totalShares: s.totalShares || '0',
        swapsCount: safeNumber(s.swapsCount),
        holdersCount: safeNumber(s.holdersCount),
        volume24h: Math.max(0, currentSwapVolume - previousSwapVolume),
        fees24h: Math.max(0, currentSwapFees - previousSwapFees),
        totalLiquidity,
        sharePrice,
        totalSharesNum,
        totalSwapVolume: currentSwapVolume,
        totalSwapFee: currentSwapFees,
    };
};

export const syncSnapshotV2Pools = async (
    subgraphClient: V2SubgraphClient,
    poolIds: string[],
    chain: Chain,
    reload = false,
) => {
    const processedIds: string[] = [];

    // Process pools in batches for better performance and error isolation
    for (let i = 0; i < poolIds.length; i += BATCH_SIZE) {
        const batch = poolIds.slice(i, i + BATCH_SIZE);

        // Batch fetch all historical prices for all midnight timestamps since Apr-19-2021
        const bptAddresses = batch.map((id) => id.substring(0, 42));
        const historicalPrices = await batchFetchHistoricalPrices(bptAddresses, chain);

        const batchPromises = batch.map(async (poolId) => {
            try {
                if (poolsToIgnore.includes(poolId)) {
                    return null;
                }

                console.log('filling snapshots for', poolId, chain);

                const sgSnapshots = await subgraphClient.legacyService.getAllPoolSnapshots({
                    where: { pool: poolId },
                    orderBy: PoolSnapshot_OrderBy.Timestamp,
                    orderDirection: OrderDirection.Asc,
                });

                if (sgSnapshots.length === 0) {
                    console.warn(`No snapshots found for pool ${poolId}`);
                    return null;
                }

                console.log(`found ${sgSnapshots.length} snapshots for`, poolId, chain);

                // Convert cumulative volume/fees to daily values with validation
                const snapshotsWithDailyValues = await Promise.all(
                    sgSnapshots
                        .filter((s) => s?.id && s?.pool?.id && s?.timestamp !== undefined)
                        .map(async (s, idx) => {
                            const previousSnapshot = sgSnapshots[idx - 1];

                            const bptAddress = poolId.substring(0, 42).toLowerCase();
                            const poolHistoricalPrices = historicalPrices[bptAddress];
                            const btpPrice = poolHistoricalPrices ? poolHistoricalPrices[s.timestamp] : undefined;
                            return dailyValues(chain, s, previousSnapshot, btpPrice);
                        }),
                );

                if (snapshotsWithDailyValues.length > 0) {
                    if (reload) {
                        // Delete existing snapshots for this pool first, then create new ones
                        await prisma.prismaPoolSnapshot.deleteMany({
                            where: {
                                poolId: poolId,
                                chain: chain,
                            },
                        });
                    }

                    await prisma.prismaPoolSnapshot.createMany({
                        data: snapshotsWithDailyValues,
                        skipDuplicates: true,
                    });
                }

                return poolId;
            } catch (error) {
                console.error(`Error syncing snapshots for pool ${poolId}:`, error);
                return null;
            }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        // Collect successful results
        batchResults.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value) {
                processedIds.push(result.value);
            } else if (result.status === 'rejected') {
                console.error(`Batch processing failed for pool ${batch[idx]}:`, result.reason);
            }
        });
    }

    return processedIds;
};
