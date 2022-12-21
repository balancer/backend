import { prisma } from '../../../prisma/prisma-client';
import { GqlPoolSnapshotDataRange } from '../../../schema';
import moment from 'moment-timezone';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { ReliquarySubgraphService } from '../../subgraphs/reliquary-subgraph/reliquary.service';
import {
    DailyPoolSnapshot_OrderBy,
    OrderDirection,
} from '../../subgraphs/reliquary-subgraph/generated/reliquary-subgraph-types';
import { blocksSubgraphService } from '../../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { oneDayInMinutes, oneDayInSeconds } from '../../common/time';
import { time } from 'console';
import { PrismaReliquaryLevelSnapshot, PrismaReliquaryTokenBalanceSnapshot } from '@prisma/client';

export class ReliquarySnapshotService {
    constructor(private readonly reliquarySubgraphService: ReliquarySubgraphService) {}

    public async getSnapshotsForFarm(farmId: number, range: GqlPoolSnapshotDataRange) {
        const timestamp = this.getTimestampForRange(range);
        return prisma.prismaReliquaryFarmSnapshot.findMany({
            where: { farmId: `${farmId}`, timestamp: { gte: timestamp } },
            include: { levelBalances: true, tokenBalances: true },
            orderBy: { timestamp: 'asc' },
        });
    }

    public async getSnapshotForFarm(farmId: number, timestamp: number) {
        return prisma.prismaReliquaryFarmSnapshot.findFirst({
            where: { farmId: `${farmId}`, timestamp: timestamp },
            include: { levelBalances: true },
        });
    }

    public async syncLatestSnapshotsForAllFarms() {
        const yesterdayMorning = moment().utc().subtract(1, 'day').startOf('day').unix();

        const { farmSnapshots } = await this.reliquarySubgraphService.getFarmSnapshots({
            where: { snapshotTimestamp_gte: yesterdayMorning },
            orderBy: DailyPoolSnapshot_OrderBy.SnapshotTimestamp,
            orderDirection: OrderDirection.Asc,
        });

        const reliquaryFarms = await prisma.prismaPoolStakingReliquaryFarm.findMany({ include: { snapshots: true } });

        const farmIdsInSubgraphSnapshots = _.uniq(farmSnapshots.map((snapshot) => snapshot.farmId));
        // check if we have a farm that doesn't have snapshots and create it manually
        for (const farm of reliquaryFarms) {
            if (!farmIdsInSubgraphSnapshots.includes(parseFloat(farm.id))) {
                const yesterdaysSnapshot = farm.snapshots.find(
                    (snapshot) => snapshot.timestamp === yesterdayMorning - oneDayInSeconds,
                );
                if (yesterdaysSnapshot) {
                    farmSnapshots.push({
                        id: `${yesterdaysSnapshot.id.split('-')[0]}-${yesterdayMorning}`,
                        farmId: parseFloat(yesterdaysSnapshot.farmId),
                        relicCount: yesterdaysSnapshot.relicCount,
                        snapshotTimestamp: yesterdayMorning,
                        dailyDeposited: `0`,
                        dailyWithdrawn: `0`,
                        totalBalance: yesterdaysSnapshot.totalBalance,
                    });
                }
            }
        }

        await this.upsertFarmSnapshots(farmIdsInSubgraphSnapshots, farmSnapshots);
    }

    public async loadAllSnapshotsForFarm(farmId: number) {
        //assuming the we don't have more than 1,000 snapshots, we should be ok.
        // todo implement proper getAll function
        const farmSnapshots = await this.reliquarySubgraphService.getFarmSnapshots({
            where: { poolId: farmId },
            orderBy: DailyPoolSnapshot_OrderBy.SnapshotTimestamp,
            orderDirection: OrderDirection.Asc,
            first: 1000,
        });
        const firstSnapshot = farmSnapshots.farmSnapshots.shift();
        if (!firstSnapshot) {
            return;
        }
        const snapshotsToSave = [firstSnapshot];
        for (const snapshot of farmSnapshots.farmSnapshots) {
            // if the previous snapshot is older than 1 day, manually derive a snapshot
            let previousSnapshot = snapshotsToSave[snapshotsToSave.length - 1];
            while (previousSnapshot.snapshotTimestamp + oneDayInSeconds < snapshot.snapshotTimestamp) {
                snapshotsToSave.push({
                    ...previousSnapshot,
                    id: `${snapshot.id}-${previousSnapshot.snapshotTimestamp + oneDayInSeconds}`,
                    snapshotTimestamp: previousSnapshot.snapshotTimestamp + oneDayInSeconds,
                    dailyDeposited: `0`,
                    dailyWithdrawn: `0`,
                });
                previousSnapshot = snapshotsToSave[snapshotsToSave.length - 1];
            }

            snapshotsToSave.push(snapshot);
        }
        // fill gaps until today
        const lastRealSnapshot = snapshotsToSave[snapshotsToSave.length - 1];
        let previousSnapshot = snapshotsToSave[snapshotsToSave.length - 1];
        while (previousSnapshot.snapshotTimestamp < moment().startOf('day').unix()) {
            snapshotsToSave.push({
                ...lastRealSnapshot,
                id: `${lastRealSnapshot.id}-${previousSnapshot.snapshotTimestamp + oneDayInSeconds}`,
                snapshotTimestamp: previousSnapshot.snapshotTimestamp + oneDayInSeconds,
                dailyDeposited: `0`,
                dailyWithdrawn: `0`,
            });
            previousSnapshot = snapshotsToSave[snapshotsToSave.length - 1];
        }
        await this.upsertFarmSnapshots([farmId], snapshotsToSave);
    }

    private async upsertFarmSnapshots(
        farmIds: number[],
        farmSnapshots: {
            id: string;
            snapshotTimestamp: number;
            totalBalance: string;
            dailyDeposited: string;
            dailyWithdrawn: string;
            relicCount: number;
            farmId: number;
        }[],
    ) {
        let operations: any[] = [];
        for (const farmId of farmIds) {
            const snapshots = farmSnapshots.filter((snapshot) => snapshot.farmId === farmId);

            const farmOperations = [];
            for (const snapshot of snapshots) {
                // If we sync snapshots from the past, we want relics from end of that day.
                // If we sync from today, we want relics up to nowish (accomodate for subgraph lagging)
                const timestampForSnapshot =
                    snapshot.snapshotTimestamp + oneDayInMinutes * 60 < moment().utc().unix()
                        ? snapshot.snapshotTimestamp + oneDayInMinutes * 60
                        : moment().utc().unix() - 600;

                const pool = await prisma.prismaPool.findFirstOrThrow({
                    where: { staking: { reliquary: { id: `${farmId}` } } },
                    include: { tokens: { include: { token: true } } },
                });

                const mostRecentPoolSnapshot = await prisma.prismaPoolSnapshot.findFirstOrThrow({
                    where: { poolId: pool.id, timestamp: { lte: timestampForSnapshot } },
                    orderBy: { timestamp: 'desc' },
                });

                const blockAtTimestamp = await blocksSubgraphService.getBlockForTimestamp(timestampForSnapshot);
                const relicsInFarm = await this.reliquarySubgraphService.getAllRelics({
                    where: { pid: farmId },
                    block: { number: parseFloat(blockAtTimestamp.number) },
                });
                const levelsAtBlock = await this.reliquarySubgraphService.getPoolLevels({
                    where: { pool_: { pid: farmId } },
                    block: { number: parseFloat(blockAtTimestamp.number) },
                });

                const uniqueUsers = _.uniq(relicsInFarm.map((relic) => relic.userAddress));
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

                for (const level of levelsAtBlock.poolLevels) {
                    const data: PrismaReliquaryLevelSnapshot = {
                        id: `${level.id}-${snapshot.id}`,
                        farmSnapshotId: snapshot.id,
                        level: `${level.level}`,
                        balance: level.balance,
                    };
                    farmOperations.push(
                        prisma.prismaReliquaryLevelSnapshot.upsert({
                            where: { id: `${level.id}-${snapshot.id}` },
                            create: data,
                            update: data,
                        }),
                    );
                }

                const sharePercentage = parseFloat(snapshot.totalBalance) / mostRecentPoolSnapshot.totalSharesNum;

                for (const token of pool.tokens) {
                    const data: PrismaReliquaryTokenBalanceSnapshot = {
                        id: `${token.id}-${snapshot.id}`,
                        farmSnapshotId: snapshot.id,
                        address: token.address,
                        symbol: token.token.symbol,
                        name: token.token.name,
                        decimals: token.token.decimals,
                        balance: `${parseFloat(mostRecentPoolSnapshot.amounts[token.index]) * sharePercentage}`,
                    };
                    farmOperations.push(
                        prisma.prismaReliquaryTokenBalanceSnapshot.upsert({
                            where: { id: `${token.id}-${snapshot.id}` },
                            create: data,
                            update: data,
                        }),
                    );
                }
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
