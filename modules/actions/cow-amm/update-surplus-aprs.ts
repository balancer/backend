import { Chain, PrismaPoolAprType, PrismaPoolSnapshot } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';

type SurplusDynamicData = {
    poolId: string;
    chain: Chain;
    totalLiquidity: number;
    surplus24h: number;
};

const midnight = (daysAgo: number) => Math.floor(Date.now() / 1000 / 86400) * 86400 - 86400 * daysAgo;

const getSnapshotsByTimestamp = async (timestamp: number) => {
    // Leaving as an option to use raw SQL in case the prisma queries turn out to get slow
    // const snapshots = await prisma.$queryRaw<PrismaPoolSnapshot[]>`
    //     SELECT DISTINCT ON ("poolId") *
    //     FROM "PrismaPoolSnapshot"
    //     JOIN "PrismaPool" ON "PrismaPoolSnapshot"."poolId" = "PrismaPool"."id"
    //     WHERE "PrismaPool"."type" = 'COW_AMM'
    //     AND "PrismaPoolSnapshot"."timestamp" = ${timestamp}
    //     ORDER BY "poolId", timestamp DESC;
    // `;

    const snapshots = await prisma.prismaPool
        .findMany({
            where: {
                type: 'COW_AMM',
            },
            include: {
                snapshots: {
                    where: {
                        timestamp: timestamp,
                    },
                },
            },
        })
        .then((pools) => pools.flatMap((pool) => pool.snapshots));

    return snapshots;
};

export const updateSurplusAPRs = async () => {
    // Find the snapshot
    const latestSnapshots = await getSnapshotsByTimestamp(midnight(0));
    const snapshots7d = await getSnapshotsByTimestamp(midnight(7));
    const snapshots30d = await getSnapshotsByTimestamp(midnight(30));
    const dynamicData = await prisma.prismaPool
        .findMany({
            where: {
                type: 'COW_AMM',
            },
            include: {
                dynamicData: true,
            },
        })
        .then((pools) =>
            pools.flatMap((pool) => ({
                poolId: pool.id,
                totalLiquidity: pool.dynamicData?.totalLiquidity,
                surplus24h: pool.dynamicData?.surplus24h,
            })),
        )
        .then((pools) =>
            pools.filter(
                (pool): pool is SurplusDynamicData =>
                    pool.totalLiquidity !== undefined && pool.surplus24h !== undefined,
            ),
        );

    const mapLatestSnapshots = latestSnapshots.reduce((acc, snapshot) => {
        acc[snapshot.poolId] = snapshot;
        return acc;
    }, {} as Record<string, PrismaPoolSnapshot>);

    // For each pool, calculate the surplus APR for the last 7d and 30d
    const data7d = snapshots7d.map((snapshot) => ({
        id: `${snapshot.poolId}-surplus-7d`,
        type: PrismaPoolAprType.SURPLUS_7D,
        title: `Surplus APR (7d)`,
        chain: snapshot.chain,
        poolId: snapshot.poolId,
        apr:
            mapLatestSnapshots[snapshot.poolId].totalSurplus <= 0 || snapshot.totalLiquidity === 0
                ? 0
                : ((mapLatestSnapshots[snapshot.poolId].totalSurplus - snapshot.totalSurplus) * 365) /
                  7 /
                  (mapLatestSnapshots[snapshot.poolId].totalLiquidity + snapshot.totalLiquidity) /
                  2,
    }));

    const data30d = snapshots30d.map((snapshot) => ({
        id: `${snapshot.poolId}-surplus-30d`,
        type: PrismaPoolAprType.SURPLUS_30D,
        title: `Surplus APR (30d)`,
        chain: snapshot.chain,
        poolId: snapshot.poolId,
        apr:
            mapLatestSnapshots[snapshot.poolId].totalSurplus <= 0 || snapshot.totalLiquidity === 0
                ? 0
                : ((mapLatestSnapshots[snapshot.poolId].totalSurplus - snapshot.totalSurplus) * 365) /
                  30 /
                  (mapLatestSnapshots[snapshot.poolId].totalLiquidity + snapshot.totalLiquidity) /
                  2,
    }));

    const data24h = dynamicData.map(({ poolId, chain, surplus24h, totalLiquidity }) => ({
        id: `${poolId}-surplus-24h`,
        type: PrismaPoolAprType.SURPLUS_24H,
        title: `Surplus APR`,
        chain: chain,
        poolId: poolId,
        apr: surplus24h <= 0 || totalLiquidity === 0 ? 0 : (surplus24h * 365) / totalLiquidity,
    }));

    const data = data24h.map((v) => ({
        ...v,
        type: PrismaPoolAprType.SURPLUS,
        title: 'Surplus APR',
    }));

    await prisma.$transaction([
        prisma.prismaPoolAprItem.deleteMany({
            where: {
                type: PrismaPoolAprType.SURPLUS,
            },
        }),
        prisma.prismaPoolAprItem.createMany({
            data: [...data, ...data24h, ...data7d, ...data30d],
        }),
    ]);

    return [...data, ...data24h, ...data7d, ...data30d].map(({ id, apr }) => ({ id, apr }));
};
