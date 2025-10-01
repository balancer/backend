import { Chain, PrismaPoolDynamicData, PrismaPoolSnapshot } from '@prisma/client';
import { BalancerPoolSnapshotFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { prisma } from '../../../prisma/prisma-client';
import { roundToMidnight } from '../../common/time';
import { eventsRepository } from '../../events/events-repository';
import { SwapStats } from '../../events/types';

export const syncPoolSnapshotsV2 = async (chain: Chain, poolIds: string[]) => {
    const snapshotTimestampForToday = roundToMidnight(Math.floor(Date.now() / 1000));

    const poolsDynamicData = await prisma.prismaPoolDynamicData.findMany({
        where: {
            chain,
            id: { in: poolIds },
        },
    });
    // convert to map for easier access
    const poolsDynamicDataMap: Record<string, (typeof poolsDynamicData)[0]> = {};
    poolsDynamicData.forEach((data) => {
        poolsDynamicDataMap[data.id] = data;
    });

    const statsSinceMidnight = await eventsRepository.getSwapStats({
        chain,
        poolIds,
        since: snapshotTimestampForToday,
    });

    // convert stats to map for easier access
    const statsMap: Record<string, (typeof statsSinceMidnight)[0]> = {};
    statsSinceMidnight.forEach((stat) => {
        statsMap[stat.poolId] = stat;
    });

    const upsertSnapshots: PrismaPoolSnapshot[] = [];

    for (const poolId of poolIds) {
        if (!poolsDynamicDataMap[poolId] || !statsMap[poolId]) continue; // skip if no dynamic data or no stats
        upsertSnapshots.push(
            getPrismaPoolSnapshotFromStats(
                chain,
                snapshotTimestampForToday,
                statsMap[poolId],
                poolsDynamicDataMap[poolId],
            ),
        );
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
};

function getPrismaPoolSnapshotFromStats(
    chain: Chain,
    timestamp: number,
    stats: SwapStats,
    dynamicData: PrismaPoolDynamicData,
): PrismaPoolSnapshot {
    return {
        id: `${stats.poolId}-${timestamp}`,
        chain: chain,
        poolId: stats.poolId,
        timestamp: timestamp,
        protocolVersion: 2,
        totalLiquidity: dynamicData.totalLiquidity,
        totalShares: dynamicData.totalShares,
        totalSharesNum: parseFloat(dynamicData.totalShares),
        totalSwapVolume: 0,
        totalSwapFee: 0,
        totalSurplus: 0,
        swapsCount: 0,
        holdersCount: 0,
        amounts: [],
        volume24h: stats.volume,
        fees24h: stats.fees,
        surplus24h: stats.surplus || 0,
        sharePrice:
            dynamicData.totalLiquidity > 0 && parseFloat(dynamicData.totalShares) > 0
                ? dynamicData.totalLiquidity / parseFloat(dynamicData.totalShares)
                : 0,
        totalProtocolSwapFees: [],
        totalProtocolYieldFees: [],
        totalVolumes: [],
        totalSwapFees: [],
        totalSurpluses: [],
        dailyProtocolSwapFees: [],
        dailyProtocolYieldFees: [],
        dailyVolumes: [],
        dailySwapFees: [],
        dailySurpluses: [],
    };
}
