import { PrismaPoolAprType, PrismaPoolSnapshot } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';

const getSnapshotsByTimestamp = async (timestamp: number = Math.floor(Date.now() / 1000 / 86400) * 86400) => {
    const snapshots = await prisma.$queryRaw<PrismaPoolSnapshot[]>`
        SELECT DISTINCT ON ("poolId") *
        FROM "PrismaPoolSnapshot"
        JOIN "PrismaPool" ON "PrismaPoolSnapshot"."poolId" = "PrismaPool"."id"
        WHERE "PrismaPool"."type" = 'COW_AMM'
        AND "PrismaPoolSnapshot"."timestamp" = ${timestamp}
        ORDER BY "poolId", timestamp DESC;
    `;

    return snapshots;
};

export const updateSurplusAPRs = async () => {
    // Find the snapshot
    const latestSnapshots = await getSnapshotsByTimestamp();
    const snapshots7d = await getSnapshotsByTimestamp(Math.floor(Date.now() / 1000 / 86400) * 86400 - 86400 * 7);
    const snapshots30d = await getSnapshotsByTimestamp(Math.floor(Date.now() / 1000 / 86400) * 86400 - 86400 * 30);

    const mapLatestSnapshots = latestSnapshots.reduce((acc, snapshot) => {
        acc[snapshot.poolId] = snapshot;
        return acc;
    }, {} as Record<string, PrismaPoolSnapshot>);

    // For each pool, calculate the surplus APR for the last 7d and 30d
    const data7d = snapshots7d.map((snapshot) => ({
        id: `${snapshot.poolId}-surplus-7d`,
        type: PrismaPoolAprType.SURPLUS,
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
        type: PrismaPoolAprType.SURPLUS,
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

    const data = latestSnapshots.map((snapshot) => ({
        id: `${snapshot.poolId}-surplus`,
        type: PrismaPoolAprType.SURPLUS,
        title: `Surplus APR`,
        chain: snapshot.chain,
        poolId: snapshot.poolId,
        apr:
            snapshot.surplus24h <= 0 || snapshot.totalLiquidity === 0
                ? 0
                : (snapshot.surplus24h * 365) / snapshot.totalLiquidity,
    }));

    await prisma.$transaction([
        prisma.prismaPoolAprItem.deleteMany({
            where: {
                type: PrismaPoolAprType.SURPLUS,
            },
        }),
        prisma.prismaPoolAprItem.createMany({
            data: [...data, ...data7d, ...data30d],
        }),
    ]);

    return [...data, ...data7d, ...data30d].map(({ id, apr }) => ({ id, apr }));
};
