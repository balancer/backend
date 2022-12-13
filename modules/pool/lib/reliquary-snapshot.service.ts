import { prisma } from '../../../prisma/prisma-client';
import { GqlPoolSnapshotDataRange } from '../../../schema';
import moment from 'moment-timezone';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { ReliquarySubgraphService } from '../../subgraphs/reliquary-subgraph/reliquary.service';
import {
    DailyPoolSnapshot_OrderBy,
    OrderDirection,
    ReliquaryFarmSnapshotsQuery,
    ReliquaryFarmSnapshotsQueryVariables,
} from '../../subgraphs/reliquary-subgraph/generated/reliquary-subgraph-types';
import { blocksSubgraphService } from '../../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { oneDayInMinutes } from '../../common/time';

export class ReliquarySnapshotService {
    constructor(private readonly reliquarySubgraphService: ReliquarySubgraphService) {}

    public async getSnapshotsForFarm(farmId: number, range: GqlPoolSnapshotDataRange) {
        const timestamp = this.getTimestampForRange(range);

        return prisma.prismaReliquaryFarmSnapshot.findMany({
            where: { farmId: `${farmId}`, timestamp: { gte: timestamp } },
            orderBy: { timestamp: 'asc' },
        });
    }

    public async getSnapshotForFarm(farmId: number, timestamp: number) {
        return prisma.prismaReliquaryFarmSnapshot.findFirst({
            where: { farmId: `${farmId}`, timestamp: timestamp },
        });
    }

    public async syncLatestSnapshotsForAllFarms(daysToSync = 1) {
        const oneDayAgoStartOfDay = moment().utc().startOf('day').subtract(daysToSync, 'days').unix();

        const farmSnapshots = await this.reliquarySubgraphService.getFarmSnapshots({
            where: { snapshotTimestamp_gte: oneDayAgoStartOfDay },
            orderBy: DailyPoolSnapshot_OrderBy.SnapshotTimestamp,
            orderDirection: OrderDirection.Asc,
        });

        const farmIds = _.uniq(farmSnapshots.farmSnapshots.map((snapshot) => snapshot.farmId));

        await this.saveFarmSnapshots(farmIds, farmSnapshots);
    }

    public async loadAllSnapshotsForFarms(farmIds: number[]) {
        //assuming the we don't have more than 1,000 snapshots, we should be ok.
        // todo implement proper getAll function
        const farmSnapshots = await this.reliquarySubgraphService.getFarmSnapshots({
            where: { poolId_in: farmIds },
            orderBy: DailyPoolSnapshot_OrderBy.SnapshotTimestamp,
            orderDirection: OrderDirection.Asc,
            first: 1000,
        });

        await this.saveFarmSnapshots(farmIds, farmSnapshots);
    }

    private async saveFarmSnapshots(farmIds: number[], farmSnapshotsQuery: ReliquaryFarmSnapshotsQuery) {
        let operations: any[] = [];
        const farmSnapshots = farmSnapshotsQuery.farmSnapshots;
        for (const farmId of farmIds) {
            const snapshots = farmSnapshots.filter((snapshot) => snapshot.farmId === farmId);

            const farmOperations = [];
            for (const snapshot of snapshots) {
                // if we sync snapshots from the past, we want relics from end of that day. If we sync from today, we want relics up to now
                const timestampForSnapshot =
                    snapshot.snapshotTimestamp + oneDayInMinutes * 60 < moment().utc().unix()
                        ? snapshot.snapshotTimestamp + oneDayInMinutes * 60
                        : moment().utc().unix();
                const blockAtTimestamp = await blocksSubgraphService.getBlockForTimestamp(timestampForSnapshot - 20);
                const relicsInFarm = await this.reliquarySubgraphService.getAllRelics({
                    where: { pid: farmId },
                    block: { number: parseFloat(blockAtTimestamp.number) },
                });
                const uniqueUsers = _.uniq((await relicsInFarm).map((relic) => relic.userAddress));
                const data = {
                    id: snapshot.id,
                    farmId: `${snapshot.farmId}`,
                    timestamp: snapshot.snapshotTimestamp,
                    relicCount: snapshot.relicCount,
                    userCount: uniqueUsers.length,
                    totalBalance: snapshot.totalBalance,
                    dailyDeposited: snapshot.dailyDeposited,
                    dailyWithdrawn: snapshot.dailyWithdrawn,
                };
                farmOperations.push(
                    prisma.prismaReliquaryFarmSnapshot.upsert({
                        where: { id: snapshot.id },
                        create: data,
                        update: data,
                    }),
                );
            }
            operations.push(...farmOperations);
        }
        await prismaBulkExecuteOperations(operations, true);
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
