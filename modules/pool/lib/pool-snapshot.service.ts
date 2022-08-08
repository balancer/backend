import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { prisma } from '../../../prisma/prisma-client';
import {
    BalancerPoolSnapshotFragment,
    OrderDirection,
    PoolSnapshot_OrderBy,
} from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { GqlPoolSnapshotDataRange } from '../../../schema';
import moment from 'moment-timezone';
import _ from 'lodash';
import { PrismaPoolSnapshot } from '@prisma/client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

export class PoolSnapshotService {
    constructor(private readonly balancerSubgraphService: BalancerSubgraphService) {}

    public async getSnapshotsForPool(poolId: string, range: GqlPoolSnapshotDataRange) {
        const timestamp = this.getTimestampForRange(range);

        return prisma.prismaPoolSnapshot.findMany({
            where: { poolId, timestamp: { gte: timestamp } },
            orderBy: { timestamp: 'asc' },
        });
    }

    //TODO: this could be optimized
    public async syncLatestSnapshotsForAllPools(daysToSync = 1) {
        let operations: any[] = [];
        const oneDayAgoStartOfDay = moment().utc().startOf('day').subtract(daysToSync, 'days').unix();

        const allSnapshots = await this.balancerSubgraphService.getAllPoolSnapshots({
            where: { timestamp_gte: oneDayAgoStartOfDay },
            orderBy: PoolSnapshot_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        const latestSyncedSnapshots = await prisma.prismaPoolSnapshot.findMany({
            where: {
                timestamp: moment()
                    .utc()
                    .startOf('day')
                    .subtract(daysToSync + 1, 'days')
                    .unix(),
            },
        });

        const poolIds = _.uniq(allSnapshots.map((snapshot) => snapshot.pool.id));

        for (const poolId of poolIds) {
            const snapshots = allSnapshots.filter((snapshot) => snapshot.pool.id === poolId);
            const latestSyncedSnapshot = latestSyncedSnapshots.find((snapshot) => snapshot.poolId === poolId);
            const startTotalSwapVolume = `${latestSyncedSnapshot?.totalSwapVolume || '0'}`;
            const startTotalSwapFee = `${latestSyncedSnapshot?.totalSwapFee || '0'}`;

            const poolOperations = snapshots.map((snapshot, index) => {
                const prevTotalSwapVolume = index === 0 ? startTotalSwapVolume : snapshots[index - 1].totalSwapVolume;
                const prevTotalSwapFee = index === 0 ? startTotalSwapFee : snapshots[index - 1].totalSwapFee;

                const data = this.getPrismaPoolSnapshotFromSubgraphData(
                    snapshot,
                    prevTotalSwapVolume,
                    prevTotalSwapFee,
                );

                return prisma.prismaPoolSnapshot.upsert({
                    where: { id: snapshot.id },
                    create: data,
                    update: data,
                });
            });
            operations.push(...poolOperations);
        }

        await prismaBulkExecuteOperations(operations, true);
    }

    public async loadAllSnapshotsForPools(poolIds: string[]) {
        //assuming the pool does not have more than 5,000 snapshots, we should be ok.
        const allSnapshots = await this.balancerSubgraphService.getAllPoolSnapshots({
            where: { pool_in: poolIds },
            orderBy: PoolSnapshot_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        for (const poolId of poolIds) {
            const snapshots = allSnapshots.filter((snapshot) => snapshot.pool.id === poolId);

            await prisma.prismaPoolSnapshot.createMany({
                data: snapshots.map((snapshot, index) => {
                    let prevTotalSwapVolume = index === 0 ? '0' : snapshots[index - 1].totalSwapVolume;
                    let prevTotalSwapFee = index === 0 ? '0' : snapshots[index - 1].totalSwapFee;

                    return this.getPrismaPoolSnapshotFromSubgraphData(snapshot, prevTotalSwapVolume, prevTotalSwapFee);
                }),
                skipDuplicates: true,
            });
        }
    }

    private getPrismaPoolSnapshotFromSubgraphData(
        snapshot: BalancerPoolSnapshotFragment,
        prevTotalSwapVolume: string,
        prevTotalSwapFee: string,
    ): PrismaPoolSnapshot {
        const totalLiquidity = parseFloat(snapshot.totalLiquidity);
        const totalShares = parseFloat(snapshot.totalShares);

        return {
            id: snapshot.id,
            poolId: snapshot.pool.id,
            timestamp: snapshot.timestamp,
            totalLiquidity: parseFloat(snapshot.totalLiquidity),
            totalShares: snapshot.totalShares,
            totalSharesNum: parseFloat(snapshot.totalShares),
            totalSwapVolume: parseFloat(snapshot.totalSwapVolume),
            totalSwapFee: parseFloat(snapshot.totalSwapFee),
            swapsCount: parseInt(snapshot.swapsCount),
            holdersCount: parseInt(snapshot.holdersCount),
            amounts: snapshot.amounts,
            volume24h: Math.max(parseFloat(snapshot.totalSwapVolume) - parseFloat(prevTotalSwapVolume), 0),
            fees24h: Math.max(parseFloat(snapshot.totalSwapFee) - parseFloat(prevTotalSwapFee), 0),
            sharePrice: totalLiquidity > 0 && totalShares > 0 ? totalLiquidity / totalShares : 0,
        };
    }

    private getTimestampForRange(range: GqlPoolSnapshotDataRange): number {
        switch (range) {
            case 'THIRTY_DAYS':
                return moment().startOf('day').subtract(30, 'days').unix();
            case 'NINETY_DAYS':
                return moment().startOf('day').subtract(90, 'days').unix();
            case 'ONE_HUNDRED_EIGHTY_DAYS':
                return moment().startOf('day').subtract(180, 'days').unix();
            case 'ONE_YEAR':
                return moment().startOf('day').subtract(365, 'days').unix();
            case 'ALL_TIME':
                return 0;
        }
    }
}
