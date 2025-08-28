import { Chain, PrismaPoolSnapshot } from '@prisma/client';
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

const safeParseInt = (value: string | undefined | null, defaultValue = 0): number => {
    if (!value || value === '') return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

const safeNumber = (value: string | number | undefined | null, defaultValue = 0): number => {
    if (value === undefined || value === null || value === '') return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
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

                // Safe data parsing with validation
                const totalSharesNum = safeParseInt(lastSnapshot.totalShares);
                const totalLiquidity = safeParseFloat(lastSnapshot.liquidity);
                const totalSwapVolume = safeParseFloat(lastSnapshot.swapVolume);
                const totalSwapFee = safeParseFloat(lastSnapshot.swapFees);

                const data = {
                    totalShares: lastSnapshot.totalShares || '0',
                    swapsCount: safeNumber(lastSnapshot.swapsCount),
                    holdersCount: safeNumber(lastSnapshot.holdersCount),
                    volume24h: Math.max(0, totalSwapVolume - (latestDb.totalSwapVolume || 0)),
                    fees24h: Math.max(0, totalSwapFee - (latestDb.totalSwapFee || 0)),
                    totalLiquidity,
                    sharePrice: totalSharesNum > 0 ? totalLiquidity / totalSharesNum : 0,
                    totalSharesNum,
                    totalSwapVolume,
                    totalSwapFee,
                };

                snapshotUpdates.push({
                    where: {
                        id_chain: {
                            id: lastSnapshot.id,
                            chain,
                        },
                    },
                    update: data,
                    create: {
                        id: lastSnapshot.id,
                        chain,
                        poolId: lastSnapshot.pool.id,
                        timestamp: lastSnapshot.timestamp,
                        ...data,
                    },
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
    previousSnapshot?: BalancerPoolSnapshotFragment,
) => {
    // Safe parsing with validation
    const totalSharesNum = safeParseInt(s.totalShares);
    const totalLiquidity = safeParseFloat(s.liquidity);
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
        sharePrice: totalSharesNum > 0 ? totalLiquidity / totalSharesNum : 0,
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
                const snapshotsWithDailyValues = sgSnapshots
                    .filter((s) => s?.id && s?.pool?.id && s?.timestamp !== undefined)
                    .map((s, idx) => {
                        const previousSnapshot = sgSnapshots[idx - 1];
                        return dailyValues(chain, s, previousSnapshot);
                    });

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
