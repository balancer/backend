import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { prisma } from '../../util/prisma-client';
import {
    BalancerPoolSnapshotFragment,
    OrderDirection,
    PoolSnapshot_OrderBy,
} from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { GqlPoolSnapshotDataRange } from '../../../schema';
import moment from 'moment-timezone';
import _ from 'lodash';

export class PoolSnapshotService {
    constructor(private readonly balancerSubgraphService: BalancerSubgraphService) {}

    public async getSnapshotsForPool(poolId: string, range: GqlPoolSnapshotDataRange) {
        const timestamp = this.getTimestampForRange(range);

        return prisma.prismaPoolSnapshotData.findMany({
            where: { poolId, timestamp: { gte: timestamp } },
            orderBy: { timestamp: 'asc' },
        });
    }

    //TODO: this could be optimized, currently we just reload all snapshots for the last two days
    public async syncLatestSnapshotsForAllPools(daysToSync = 2) {
        const twoDaysAgo = moment().subtract(daysToSync, 'day').unix();

        const snapshots = await this.balancerSubgraphService.getAllPoolSnapshots({
            where: { timestamp_gte: twoDaysAgo },
            orderBy: PoolSnapshot_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        await this.createSnapshotRecords(snapshots);
    }

    public async loadAllSnapshotsForPools(poolIds: string[]) {
        //assuming the pool does not have more than 5,000 snapshots, we should be ok.
        const snapshots = await this.balancerSubgraphService.getAllPoolSnapshots({
            where: { pool_in: poolIds },
            orderBy: PoolSnapshot_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        await this.createSnapshotRecords(snapshots);
    }

    private async createSnapshotRecords(allSnapshots: BalancerPoolSnapshotFragment[]) {
        const poolIds = _.uniq(allSnapshots.map((snapshot) => snapshot.pool.id));

        for (const poolId of poolIds) {
            const snapshots = allSnapshots.filter((snapshot) => snapshot.pool.id === poolId);

            await prisma.prismaPoolSnapshotData.createMany({
                data: snapshots.map((snapshot, index) => ({
                    id: snapshot.id,
                    poolId,
                    timestamp: snapshot.timestamp,
                    totalLiquidity: snapshot.totalLiquidity,
                    totalShares: snapshot.totalShares,
                    totalSwapVolume: snapshot.totalSwapVolume,
                    totalSwapFee: snapshot.totalSwapFee,
                    swapsCount: snapshot.swapsCount,
                    holdersCount: snapshot.holdersCount,
                    amounts: snapshot.amounts,
                    volume24h: `${Math.max(
                        parseFloat(snapshot.totalSwapVolume) -
                            parseFloat(index > 0 ? snapshots[index - 1].totalSwapVolume : '0'),
                        0,
                    )}`,
                    fees24h: `${Math.max(
                        parseFloat(snapshot.totalSwapFee) -
                            parseFloat(index > 0 ? snapshots[index - 1].totalSwapFee : '0'),
                        0,
                    )}`,
                    sharePrice: `${parseFloat(snapshot.totalLiquidity) / parseFloat(snapshot.totalShares)}`,
                })),
                skipDuplicates: true,
            });
        }
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
