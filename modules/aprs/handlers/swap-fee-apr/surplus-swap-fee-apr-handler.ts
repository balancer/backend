import { Chain, PrismaPoolAprItem, PrismaPoolAprType, PrismaPoolSnapshot } from '@prisma/client';
import { AprHandler, PoolAPRData } from '../../types';
import { prisma } from '../../../../prisma/prisma-client';

export class SurplusSwapFeeAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'SurplusSwapFeeAprHandler';
    }

    midnight = (daysAgo: number) => Math.floor(Date.now() / 1000 / 86400) * 86400 - 86400 * daysAgo;

    getSnapshotsByTimestamp = async (timestamp: number, chain?: Chain, ids?: string[]) => {
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
                    chain: chain,
                    ...(ids
                        ? {
                              id: {
                                  in: ids,
                              },
                          }
                        : {}),
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

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        // Find the snapshot
        // const latestSnapshots = await this.getSnapshotsByTimestamp(this.midnight(0), chain, ids);
        // const snapshots7d = await this.getSnapshotsByTimestamp(this.midnight(7), chain, ids);
        // const snapshots30d = await this.getSnapshotsByTimestamp(this.midnight(30), chain, ids);

        const dynamicData = pools
            .filter((pool) => pool.type === 'COW_AMM')
            .flatMap((pool) => ({
                poolId: pool.id,
                chain: pool.chain,
                totalLiquidity: pool.dynamicData?.totalLiquidity ?? 0,
                surplus24h: pool.dynamicData?.surplus24h ?? 0,
            }));

        // const mapLatestSnapshots = latestSnapshots.reduce((acc, snapshot) => {
        //     acc[snapshot.poolId] = snapshot;
        //     return acc;
        // }, {} as Record<string, PrismaPoolSnapshot>);

        // For each pool, calculate the surplus APR for the last 7d and 30d
        // const data7d = snapshots7d.map((snapshot) => ({
        //     id: `${snapshot.poolId}-surplus-7d`,
        //     type: PrismaPoolAprType.SURPLUS_7D,
        //     title: `Surplus APR (7d)`,
        //     chain: snapshot.chain,
        //     poolId: snapshot.poolId,
        //     apr:
        //         !mapLatestSnapshots[snapshot.poolId] ||
        //         mapLatestSnapshots[snapshot.poolId].totalSurplus <= 0 ||
        //         snapshot.totalLiquidity === 0
        //             ? 0
        //             : ((mapLatestSnapshots[snapshot.poolId].totalSurplus - snapshot.totalSurplus) * 365) /
        //               7 /
        //               (mapLatestSnapshots[snapshot.poolId].totalLiquidity + snapshot.totalLiquidity) /
        //               2,
        // }));

        // const data30d = snapshots30d.map((snapshot) => ({
        //     id: `${snapshot.poolId}-surplus-30d`,
        //     type: PrismaPoolAprType.SURPLUS_30D,
        //     title: `Surplus APR (30d)`,
        //     chain: snapshot.chain,
        //     poolId: snapshot.poolId,
        //     apr:
        //         !mapLatestSnapshots[snapshot.poolId] ||
        //         mapLatestSnapshots[snapshot.poolId].totalSurplus <= 0 ||
        //         snapshot.totalLiquidity === 0
        //             ? 0
        //             : ((mapLatestSnapshots[snapshot.poolId].totalSurplus - snapshot.totalSurplus) * 365) /
        //               30 /
        //               (mapLatestSnapshots[snapshot.poolId].totalLiquidity + snapshot.totalLiquidity) /
        //               2,
        // }));

        const data24h = dynamicData.map(({ poolId, chain, surplus24h, totalLiquidity }) => ({
            id: `${poolId}-surplus-24h`,
            type: PrismaPoolAprType.SURPLUS_24H,
            title: `Surplus APR`,
            chain: chain,
            poolId: poolId,
            apr: surplus24h <= 0 || totalLiquidity === 0 ? 0 : (surplus24h * 365) / totalLiquidity,
            rewardTokenAddress: null,
            rewardTokenSymbol: null,
            group: null,
        }));

        return data24h;
    }
}
