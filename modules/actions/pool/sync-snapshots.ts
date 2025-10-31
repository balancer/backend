import { $Enums, Chain, PrismaPoolSnapshot } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { getLastSyncedBlock } from '../last-synced-block';
import { SwapStats } from '../../repositories/events/types';
import { eventsRepository } from '../../repositories/events';
import { now, roundToMidnight } from '../../common/time';
import { blockNumbers } from '../../block-numbers';
import { getViemClient } from '../../sources/viem-client';
import { formatEther, parseAbi } from 'viem/utils';
import config from '../../../config';

export async function reloadSnapshots(chain: Chain, poolId: string): Promise<void> {
    const pool = await prisma.prismaPool.findUniqueOrThrow({
        where: { id_chain: { id: poolId, chain } },
    });

    const firstSnapshotTimestamp = roundToMidnight(pool.createTime) + 86400; // we take the day after creation
    const todayTimestamp = roundToMidnight(Math.floor(Date.now() / 1000));
    const daysSinceFirstSnapshot = Math.floor((todayTimestamp - firstSnapshotTimestamp) / 86400);
    const dailyBlocks = await blockNumbers().getDailyBlocks(chain, daysSinceFirstSnapshot);

    // for each day, calculate the snapshot
    const upsertSnapshots: PrismaPoolSnapshot[] = [];

    for (const block of dailyBlocks) {
        // we need to get totalShares for the specific block on chain and apply BPT pricing to it to calculate TVL and share price
        const blockRoundedTimestamp = roundToMidnight(block.timestamp);
        const totalShares = await getTotalSharesAtBlock(pool, block.number);
        const bptPriceAtTimestamp = await prisma.prismaTokenPrice.findFirst({
            where: {
                chain,
                tokenAddress: pool.address,
                timestamp: {
                    gte: blockRoundedTimestamp,
                },
            },
            select: { price: true },
            orderBy: {
                timestamp: 'desc',
            },
        });

        const { upsertSnapshots: snapshots } = await calculatePoolSnapshots(
            chain,
            [
                {
                    poolId: pool.id,
                    totalLiquidity: parseFloat(totalShares) * (bptPriceAtTimestamp?.price ?? 0),
                    totalShares: totalShares,
                },
            ],
            blockRoundedTimestamp,
            blockRoundedTimestamp + 86400,
        );
        upsertSnapshots.push(...snapshots);
    }

    // Use upserts to sync snapshots into the DB
    const upserts = upsertSnapshots.map((snapshot) =>
        prisma.prismaPoolSnapshot.upsert({
            where: { id_chain: { id: snapshot.id, chain: snapshot.chain } },
            create: snapshot,
            update: snapshot,
        }),
    );

    // Execute upserts in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
        const batch = upserts.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(batch);
    }
}

export async function syncSnapshots(chain: Chain): Promise<string[]> {
    // we only need the latest synced block to understand if we also need to complete yesterdays snapshot
    // if we crossed midnight since the last synced block, we need to sync yesterday as well to complete the snapshot
    const latestSyncedBlock = await getLastSyncedBlock(chain, 'SNAPSHOTS_FROM_EVENTS');
    const timestampForBlock = (await blockNumbers().getTimestamp(chain, latestSyncedBlock)) ?? 0;
    const shouldSyncYesterday = roundToMidnight(timestampForBlock) < roundToMidnight(Math.floor(Date.now() / 1000));

    // we always sync todays snapshot
    const upsertSnapshots: PrismaPoolSnapshot[] = [];
    const snapshotTimestampForToday = roundToMidnight(Math.floor(Date.now() / 1000));

    const poolsDynamicData = await prisma.prismaPoolDynamicData.findMany({
        where: {
            chain,
        },
        select: {
            poolId: true,
            totalLiquidity: true,
            totalShares: true,
        },
    });

    const { upsertSnapshots: snapshotsToday, latestBlock } = await calculatePoolSnapshots(
        chain,
        poolsDynamicData,
        snapshotTimestampForToday,
        now(),
    );

    upsertSnapshots.push(...snapshotsToday);

    if (shouldSyncYesterday) {
        const snapshotTimestampForYesterday = snapshotTimestampForToday - 86400;
        const { upsertSnapshots: snapshotsYesterday } = await calculatePoolSnapshots(
            chain,
            poolsDynamicData,
            snapshotTimestampForYesterday,
            snapshotTimestampForToday,
        );
        upsertSnapshots.push(...snapshotsYesterday);
    }

    // Use upserts to sync snapshots into the DB
    const upserts = upsertSnapshots.map((snapshot) =>
        prisma.prismaPoolSnapshot.upsert({
            where: { id_chain: { id: snapshot.id, chain: snapshot.chain } },
            create: snapshot,
            update: snapshot,
        }),
    );

    // Execute upserts in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
        const batch = upserts.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(batch);
    }

    await prisma.prismaLastBlockSynced.upsert({
        where: { category_chain: { chain, category: 'SNAPSHOTS_FROM_EVENTS' } },
        create: { chain, category: 'SNAPSHOTS_FROM_EVENTS', blockNumber: latestBlock },
        update: { blockNumber: latestBlock },
    });

    return upsertSnapshots.map((snapshot) => snapshot.poolId);
}

async function calculatePoolSnapshots(
    chain: Chain,
    poolsDynamicData: {
        poolId: string;
        totalLiquidity: number;
        totalShares: string;
    }[],
    since: number,
    until: number,
) {
    const poolIds = poolsDynamicData.map((p) => p.poolId);

    // convert to map for easier access
    const poolsDynamicDataMap: Record<string, (typeof poolsDynamicData)[0]> = {};
    poolsDynamicData.forEach((data) => {
        poolsDynamicDataMap[data.poolId] = data;
    });

    const swapStats = await eventsRepository.getSwapStats({
        chain,
        poolIds,
        since,
        until,
    });

    let latestBlock = 0;
    // convert stats to map for easier access
    const statsMap: Record<string, (typeof swapStats)[0]> = {};
    swapStats.forEach((stat) => {
        statsMap[stat.poolId] = stat;
        latestBlock = Math.max(latestBlock, stat.latestBlockNumber);
    });

    const upsertSnapshots: PrismaPoolSnapshot[] = [];

    for (const poolId of poolIds) {
        if (!poolsDynamicDataMap[poolId] || !statsMap[poolId]) continue; // skip if no dynamic data or no stats
        upsertSnapshots.push(
            getPrismaPoolSnapshotFromStats(
                chain,
                since,
                statsMap[poolId],
                poolsDynamicDataMap[poolId].totalLiquidity,
                poolsDynamicDataMap[poolId].totalShares,
            ),
        );
    }
    return { upsertSnapshots, latestBlock };
}

function getPrismaPoolSnapshotFromStats(
    chain: Chain,
    timestamp: number,
    stats: SwapStats,
    totalLiquidity: number,
    totalShares: string,
): PrismaPoolSnapshot {
    return {
        id: `${stats.poolId}-${timestamp}`,
        chain: chain,
        poolId: stats.poolId,
        timestamp: timestamp,
        protocolVersion: 2,
        totalLiquidity: totalLiquidity,
        totalShares: totalShares,
        totalSharesNum: parseFloat(totalShares),
        swapsCount: stats.swapsCount,
        volume24h: stats.volume,
        fees24h: stats.fees,
        surplus24h: stats.surplus || 0,
        sharePrice: totalLiquidity > 0 && parseFloat(totalShares) > 0 ? totalLiquidity / parseFloat(totalShares) : 0,
    };
}

async function getTotalSharesAtBlock(
    pool: {
        id: string;
        chain: Chain;
        address: string;
        type: $Enums.PrismaPoolType;
        version: number;
        protocolVersion: number;
    },
    blockNumber: number,
) {
    const viemClient = getViemClient(pool.chain);

    if (pool.protocolVersion === 2 || pool.protocolVersion === 1) {
        let supplyFunction: 'getVirtualSupply' | 'getActualSupply' | 'totalSupply' = 'totalSupply';

        if (pool.type === 'COMPOSABLE_STABLE' && pool.version === 0) {
            supplyFunction = 'getVirtualSupply';
        } else if (
            pool.type === 'COMPOSABLE_STABLE' ||
            (pool.type === 'WEIGHTED' && pool.version > 1) ||
            (pool.type === 'UNKNOWN' && pool.version > 1)
        ) {
            supplyFunction = 'getActualSupply';
        } else {
            supplyFunction = 'totalSupply';
        }

        const totalSupply = (await viemClient.readContract({
            address: pool.address as `0x${string}`,
            abi: parseAbi([
                'function getActualSupply() view returns (uint256)',
                'function totalSupply() view returns (uint256)',
                'function getVirtualSupply() view returns (uint256)',
            ]),
            functionName: supplyFunction,
            blockNumber: BigInt(blockNumber),
        })) as bigint;

        return formatEther(totalSupply);
    } else {
        const totalSupply = (await viemClient.readContract({
            address: config[pool.chain].balancer.v3.vaultAddress as `0x${string}`,
            abi: parseAbi(['function totalSupply(address) view returns (uint256)']),
            functionName: 'totalSupply',
            blockNumber: BigInt(blockNumber),
            args: [pool.address as `0x${string}`],
        })) as bigint;

        return formatEther(totalSupply);
    }
}
