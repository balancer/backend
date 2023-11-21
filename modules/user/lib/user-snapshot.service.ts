import { UserSnapshotSubgraphService } from '../../subgraphs/user-snapshot-subgraph/user-snapshot-subgraph.service';
import { prisma } from '../../../prisma/prisma-client';
import moment from 'moment-timezone';
import { UserPoolSnapshot, UserRelicSnapshot } from '../user-types';
import { GqlUserSnapshotDataRange } from '../../../schema';
import { PoolSnapshotService } from '../../pool/lib/pool-snapshot.service';
import {
    Chain,
    Prisma,
    PrismaPool,
    PrismaPoolSnapshot,
    PrismaPoolStaking,
    PrismaUserRelicSnapshot,
} from '@prisma/client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { oneDayInSeconds, secondsPerDay } from '../../common/time';
import { UserBalanceSnapshotFragment } from '../../subgraphs/user-snapshot-subgraph/generated/user-snapshot-subgraph-types';
import { ReliquarySubgraphService } from '../../subgraphs/reliquary-subgraph/reliquary.service';
import { ReliquaryRelicSnapshotFragment } from '../../subgraphs/reliquary-subgraph/generated/reliquary-subgraph-types';
import _ from 'lodash';
import { networkContext } from '../../network/network-context.service';

export class UserSnapshotService {
    private readonly FBEETS_BPT_RATIO: number = 1.0271;

    constructor(
        private readonly userSnapshotSubgraphService: UserSnapshotSubgraphService,
        private readonly reliquarySubgraphService: ReliquarySubgraphService,
        private readonly poolSnapshotService: PoolSnapshotService,
    ) {}

    // problem: user can have multiple relics in the same farm with different snapshots
    public async getUserRelicSnapshotsForFarm(userAddress: string, farmId: string, range: GqlUserSnapshotDataRange) {
        const userSnapshots: UserRelicSnapshot[] = [];

        const firstTimestamp = this.getTimestampForRange(range);
        const allSnapshots = await prisma.prismaUserRelicSnapshot.findMany({
            where: { userAddress: userAddress, farmId: farmId, chain: networkContext.chain },
            orderBy: { timestamp: 'asc' },
        });

        const allRelicIds = _.uniq(allSnapshots.map((snapshot) => snapshot.relicId));

        for (const relicId of allRelicIds) {
            const relicSnapshots = allSnapshots.filter(
                (snapshot) => snapshot.relicId === relicId && snapshot.timestamp >= firstTimestamp,
            );

            let firstSnapshot = relicSnapshots.shift();

            /*
            if the firstSnapshot is not available (because it's older) or if it is younger than what is requested, 
            we try to find an older one to derive from
            if we can't find and older one, then if we found a younger snapshot before it will be used, 
            otherwise we don't have any snapshots for this relic
            */
            if (!firstSnapshot || firstSnapshot.timestamp > firstTimestamp) {
                const snapshotBeforeFirstTimestamp = await prisma.prismaUserRelicSnapshot.findFirst({
                    where: { relicId: relicId, timestamp: { lt: firstTimestamp }, chain: networkContext.chain },
                    orderBy: { timestamp: 'desc' },
                });
                if (snapshotBeforeFirstTimestamp) {
                    firstSnapshot = {
                        ...snapshotBeforeFirstTimestamp,
                        timestamp: firstTimestamp,
                    };
                }
            }
            if (!firstSnapshot) {
                continue;
            }
            // fill in the gaps to return a complete set
            const completeSnapshots: PrismaUserRelicSnapshot[] = [firstSnapshot];
            // this.addToUserSnapshots(userSnapshots, firstSnapshot);
            for (const snapshot of relicSnapshots) {
                // if the previous snapshot is older than 1 day, manually derive a snapshot
                let previousSnapshot = completeSnapshots[completeSnapshots.length - 1];
                while (previousSnapshot.timestamp + oneDayInSeconds < snapshot.timestamp) {
                    completeSnapshots.push({
                        ...previousSnapshot,
                        id: `${snapshot.id}-${previousSnapshot.timestamp + oneDayInSeconds}`,
                        timestamp: previousSnapshot.timestamp + oneDayInSeconds,
                    });
                    previousSnapshot = completeSnapshots[completeSnapshots.length - 1];
                }

                completeSnapshots.push(snapshot);
            }
            // fill gaps until today
            const lastRealSnapshot = completeSnapshots[completeSnapshots.length - 1];
            let previousSnapshot = completeSnapshots[completeSnapshots.length - 1];
            while (previousSnapshot.timestamp < moment().startOf('day').unix()) {
                completeSnapshots.push({
                    ...lastRealSnapshot,
                    id: `${lastRealSnapshot.id}-${previousSnapshot.timestamp + oneDayInSeconds}`,
                    timestamp: previousSnapshot.timestamp + oneDayInSeconds,
                });
                previousSnapshot = completeSnapshots[completeSnapshots.length - 1];
            }
            this.addToUserSnapshots(userSnapshots, completeSnapshots);
        }

        return userSnapshots;
    }

    private addToUserSnapshots(userSnapshots: UserRelicSnapshot[], relicSnapshots: PrismaUserRelicSnapshot[]) {
        for (const relicSnapshot of relicSnapshots) {
            let userSnapshotForTimestampIndex = userSnapshots.findIndex(
                (userSnapshot) => userSnapshot.timestamp === relicSnapshot.timestamp,
            );
            if (userSnapshotForTimestampIndex === -1) {
                userSnapshots.push({
                    timestamp: relicSnapshot.timestamp,
                    totalBalance: `0`,
                    relicCount: 0,
                    relicSnapshots: [],
                });
                userSnapshotForTimestampIndex = userSnapshots.length - 1;
            }
            userSnapshots[userSnapshotForTimestampIndex].relicSnapshots.push({
                relicId: relicSnapshot.relicId,
                farmId: relicSnapshot.farmId,
                balance: relicSnapshot.balance,
                entryTimestamp: relicSnapshot.entryTimestamp,
                level: relicSnapshot.level,
            });

            userSnapshots[userSnapshotForTimestampIndex].relicCount++;
            userSnapshots[userSnapshotForTimestampIndex].totalBalance = `${
                parseFloat(userSnapshots[userSnapshotForTimestampIndex].totalBalance) +
                parseFloat(relicSnapshot.balance)
            }`;
        }
    }

    public async syncLatestUserRelicSnapshots(numDays = 1) {
        const yesterdayMorning = moment().utc().subtract(numDays, 'days').startOf('day').unix();
        const relicSnapshots = await this.reliquarySubgraphService.getAllRelicSnapshotsSince(yesterdayMorning);
        const filteredSnapshots = relicSnapshots.filter(
            (snapshot) => !networkContext.data.reliquary!.excludedFarmIds.includes(snapshot.poolId.toString()),
        );
        await this.upsertRelicSnapshots(filteredSnapshots);
    }

    public async loadAllUserRelicSnapshots() {
        const relicSnapshots = await this.reliquarySubgraphService.getAllRelicSnapshotsSince();
        const filteredSnapshots = relicSnapshots.filter(
            (snapshot) => !networkContext.data.reliquary!.excludedFarmIds.includes(snapshot.poolId.toString()),
        );
        await this.upsertRelicSnapshots(filteredSnapshots);
    }

    private async upsertRelicSnapshots(relicSnapshots: ReliquaryRelicSnapshotFragment[]) {
        let operations: any[] = [];
        for (const snapshot of relicSnapshots) {
            const data: PrismaUserRelicSnapshot = {
                farmId: `${snapshot.poolId}`,
                chain: networkContext.chain,
                timestamp: snapshot.snapshotTimestamp,
                userAddress: snapshot.userAddress.toLowerCase(),
                balance: snapshot.balance,
                entryTimestamp: snapshot.entryTimestamp,
                id: snapshot.id,
                level: snapshot.level,
                relicId: snapshot.relicId,
            };
            operations.push(
                prisma.prismaUserRelicSnapshot.upsert({
                    where: { id_chain: { id: snapshot.id, chain: networkContext.chain } },
                    create: data,
                    update: data,
                }),
            );
        }
        await prismaBulkExecuteOperations(operations, true);
    }

    public async syncUserPoolBalanceSnapshots() {
        // sync all snapshots that we have stored

        let operations: any[] = [];

        // get all unique users which have a snapshot stored
        const users = await prisma.prismaUserPoolBalanceSnapshot.findMany({
            distinct: ['userAddress'],
            select: {
                userAddress: true,
            },
            where: { chain: networkContext.chain },
        });

        for (const user of users) {
            const userAddress = user.userAddress;
            const userSnapshotsFromSubgraph =
                await this.userSnapshotSubgraphService.getUserBalanceSnapshotsForUserAndRange(
                    0,
                    moment().unix(),
                    userAddress,
                );
            // no snapshots for the user in the requested timerange
            if (!userSnapshotsFromSubgraph) {
                continue;
            }

            // get the latest snapshot for each unique user/pool pair
            const latestStoredPoolSnapshotsOfUser = await prisma.prismaUserPoolBalanceSnapshot.findMany({
                where: { userAddress: userAddress, chain: networkContext.chain },
                orderBy: { timestamp: 'desc' },
                distinct: ['userAddress', 'poolId'],
            });

            /*
            For each latest stored user pool snapshot, we need to sync from subgraph. We only store user snapshots for pools with an existing snapshot if they meet one of the following criteria:
            - total balance of subgraph snapshot is not 0
            - total balance of subgraph snapshot is 0, but the total balance of the previous stored user pool snapshot was > 0, meaning the user has left the pool. 
            
            A snapshot reflects always the state by the end of the day (UTC). Snapshots for the current day are gradually updated to reflect the current state. 
            Therefore we have to handle those snapshots different than the ones for already closed days. 

            */
            for (const latestStoredUserPoolSnapshot of latestStoredPoolSnapshotsOfUser) {
                let previousStoredUserPoolSnapshotHasBalance =
                    parseFloat(latestStoredUserPoolSnapshot.totalBalance) > 0;
                for (const userSubgraphSnapshot of userSnapshotsFromSubgraph.snapshots) {
                    if (!userSubgraphSnapshot || !latestStoredUserPoolSnapshot.poolId) {
                        continue;
                    }
                    if (userSubgraphSnapshot.timestamp >= latestStoredUserPoolSnapshot.timestamp) {
                        // subgraph snapshot is newer or from today. If it is > 0 balance, we need to enrich and persist.
                        const pool = await prisma.prismaPool.findUniqueOrThrow({
                            where: {
                                id_chain: {
                                    id: latestStoredUserPoolSnapshot.poolId,
                                    chain: latestStoredUserPoolSnapshot.chain,
                                },
                            },
                            include: {
                                staking: true,
                            },
                        });

                        // extract data from snapshot for the requested pool
                        const { totalBalance, walletBalance, gaugeBalance, farmBalance } =
                            this.extractBalancesFromSnapshot(userSubgraphSnapshot, pool);

                        if (totalBalance > 0) {
                            //enrich with poolsnapshot data and save
                            const poolSnapshot = await this.poolSnapshotService.getSnapshotForPool(
                                pool.id,
                                userSubgraphSnapshot.timestamp,
                                pool.chain,
                            );

                            /*
                            Could be that the poolsnapshot is delayed (beethoven subgraph is much slower than bpt subgraph),
                            so we will persist 0 $ value if there is a totalBalance > 0 and try to get the when we serve the data
                            */
                            const userPoolBalanceSnapshotData = this.createUserPoolSnapshotData(
                                poolSnapshot,
                                pool,
                                networkContext.chain,
                                userSubgraphSnapshot,
                                totalBalance,
                                walletBalance,
                                gaugeBalance,
                                farmBalance,
                            );

                            operations.push(
                                prisma.prismaUserPoolBalanceSnapshot.upsert({
                                    where: {
                                        id_chain: { id: userPoolBalanceSnapshotData.id, chain: userPoolBalanceSnapshotData.chain },
                                    },
                                    create: userPoolBalanceSnapshotData,
                                    update: userPoolBalanceSnapshotData,
                                }),
                            );
                            previousStoredUserPoolSnapshotHasBalance = true;
                        } else if (previousStoredUserPoolSnapshotHasBalance) {
                            // if the snapshot has total balance of 0, we store it if the previously stored snapshot had a balance. This is to indicate that the user has left the pool.
                            const userPoolBalanceSnapshotData = {
                                id: `${pool.id}-${userSubgraphSnapshot.user.id.toLowerCase()}-${
                                    userSubgraphSnapshot.timestamp
                                }`,
                                chain: pool.chain,
                                timestamp: userSubgraphSnapshot.timestamp,
                                userAddress: userSubgraphSnapshot.user.id.toLowerCase(),
                                poolId: pool.id,
                                poolToken: pool.address,
                                walletBalance,
                                gaugeBalance,
                                farmBalance,
                                percentShare: `0`,
                                totalBalance: '0',
                                totalValueUSD: `0`,
                                fees24h: `0`,
                            };

                            operations.push(
                                prisma.prismaUserPoolBalanceSnapshot.upsert({
                                    where: {
                                        id_chain: { id: userPoolBalanceSnapshotData.id, chain: userPoolBalanceSnapshotData.chain },
                                    },
                                    create: userPoolBalanceSnapshotData,
                                    update: userPoolBalanceSnapshotData,
                                }),
                            );
                            previousStoredUserPoolSnapshotHasBalance = false;
                        }
                    }
                }
            }
        }

        await prismaBulkExecuteOperations(operations, false);
    }

    public async getUserPoolBalanceSnapshotsForPool(
        userAddress: string,
        poolId: string,
        chain: Chain,
        range: GqlUserSnapshotDataRange,
    ): Promise<UserPoolSnapshot[]> {
        const oldestRequestedSnapshotTimestamp = this.getTimestampForRange(range);

        userAddress = userAddress.toLowerCase();
        poolId = poolId.toLowerCase();

        const storedUserSnapshotsForPool = await this.getStoredSnapshotsForUserForPoolFromTimestamp(
            userAddress,
            0,
            poolId,
            chain,
        );

        let storedUserSnapshotsInRangeForPool = storedUserSnapshotsForPool.filter(
            (snapshot) => snapshot.timestamp >= oldestRequestedSnapshotTimestamp,
        );

        let poolSnapshots: PrismaPoolSnapshot[] = [];

        // no stored snapshots, retrieve from subgraph and store all
        if (storedUserSnapshotsForPool.length === 0) {
            const userSnapshotsFromSubgraph =
                await this.userSnapshotSubgraphService.getUserBalanceSnapshotsForUserAndRange(
                    0,
                    moment().unix(),
                    userAddress,
                );

            const pool = await prisma.prismaPool.findUniqueOrThrow({
                where: {
                    id_chain: { id: poolId, chain: chain },
                },
                include: {
                    staking: true,
                },
            });

            // Check if any of the retrieved subgraph snapshots contain the requested pool, no need to go further if there are no snapshots
            if (
                !userSnapshotsFromSubgraph.snapshots.find((snapshot) => {
                    if (snapshot.walletTokens.includes(pool.address)) {
                        return snapshot;
                    }

                    if (pool.staking.length > 0) {
                        if (
                            pool.staking.some((stake) => snapshot.farms.includes(stake.id)) ||
                            pool.staking.some((stake) => snapshot.gauges.includes(stake.id))
                        )
                            return snapshot;
                    }
                })
            ) {
                return [];
            }

            // make sure users exists
            await prisma.prismaUser.upsert({
                where: { address: userAddress },
                update: {},
                create: { address: userAddress },
            });

            const prismaInput: Prisma.PrismaUserPoolBalanceSnapshotCreateManyInput[] = [];

            poolSnapshots = await this.poolSnapshotService.getSnapshotsForPool(poolId, chain, range);

            /*
            For each snapshot from the subgraph, this will get the poolSnapshot for the same timestamp and enrich with $ value data
            If there is no poolSnapshot for that timestamp, we persist a 0 $ totalUSD snapshot because it could become available at a later time
            If there are consecutive 0 total balance snapshots, only the first one is persisted. This is to avoid unnecessary 0 value 
            snapshots in the database. These 0 balance gaps must be filled when serving the request.
            */
            for (const userSubgraphSnapshot of userSnapshotsFromSubgraph.snapshots) {
                const poolSnapshotForTimestamp = poolSnapshots.find(
                    (poolSnapshot) => userSubgraphSnapshot.timestamp === poolSnapshot.timestamp,
                );

                // extract data from snapshot for the requested pool
                const { totalBalance, walletBalance, gaugeBalance, farmBalance } = this.extractBalancesFromSnapshot(
                    userSubgraphSnapshot,
                    pool,
                );

                /*
                We get ALL snapshots from the subgraph for the user. Total balance will be 0 until he joined the pool we need.
                Therefore we want to skip all 0 total balance snapshot at the beginning.
                */
                if (prismaInput.length === 0 && totalBalance === 0) {
                    continue;
                }

                /*
                If a user left a pool, the snapshot from the subgraph won't list the pool balance with '0'.
                In fact, the pool address (or farm or gage id) won't show up in the array. We therefore need to store the FIRST
                0 total balance snapshot to show that he left the pool, but want to skip any consecutive 0 total value
                snapshots to avoid unnecessary 0 total balance snapshots in the database.
                */
                if (totalBalance === 0 && prismaInput[prismaInput.length - 1].totalBalance === '0') {
                    continue;
                }

                const userPoolBalanceSnapshotData = this.createUserPoolSnapshotData(
                    poolSnapshotForTimestamp,
                    pool,
                    chain,
                    userSubgraphSnapshot,
                    totalBalance,
                    walletBalance,
                    gaugeBalance,
                    farmBalance,
                );

                prismaInput.push(userPoolBalanceSnapshotData);
            }
            await prisma.prismaUserPoolBalanceSnapshot.createMany({
                data: prismaInput,
            });

            storedUserSnapshotsInRangeForPool = await this.getStoredSnapshotsForUserForPoolFromTimestamp(
                userAddress,
                oldestRequestedSnapshotTimestamp,
                poolId,
                chain,
            );
        }

        // Only get them if we didn't get them above
        if (poolSnapshots.length === 0) {
            poolSnapshots = await this.poolSnapshotService.getSnapshotsForPool(poolId, chain, range);
        }

        /*
        

        If a user joined a pool and did not interact with the pool (or any other pool) for a few days, those snapshots 
        will be missing from the subgraph and also in the database. When the user requests his snapshots for a given pool
        we need to find and fill the gaps between the first and the last snapshot we have in the database.

        1st) If there is no snapshot for the oldestRequestedTimestamp but there is an older one, we need to infer from the older one to the oldestRequestedTimestamp
        2nd) We need to find and fill the gaps between the oldestRequestedTimestamp and the latest stored snapshot we have in the database.
        3rd) If the latest stored snapshot is not a 0 total balance snapshot (which would mean the user left the pool) we will also 
        need to fill the gaps from the latest stored snapshot until today.
        */

        // The first snapshot in the database must be >0 total value, push that
        const userPoolSnapshots: UserPoolSnapshot[] = [];

        // 1st) if we either have no stored snapshots for the range or only newer ones, we need to check if we have an older and infer
        if (
            storedUserSnapshotsInRangeForPool.length === 0 ||
            storedUserSnapshotsInRangeForPool[0].timestamp > oldestRequestedSnapshotTimestamp
        ) {
            const olderSnapshot = await prisma.prismaUserPoolBalanceSnapshot.findFirst({
                where: {
                    userAddress: userAddress,
                    timestamp: {
                        lt: oldestRequestedSnapshotTimestamp,
                    },
                    poolId: poolId,
                    chain: chain,
                },
                orderBy: { timestamp: 'desc' },
            });
            if (olderSnapshot) {
                const poolSnapshot = poolSnapshots.find(
                    (snapshot) => snapshot.timestamp === oldestRequestedSnapshotTimestamp,
                );
                const percentShare = poolSnapshot
                    ? parseFloat(olderSnapshot.totalBalance) / poolSnapshot.totalSharesNum
                    : 0;
                userPoolSnapshots.push({
                    timestamp: oldestRequestedSnapshotTimestamp,
                    walletBalance: olderSnapshot.walletBalance,
                    farmBalance: olderSnapshot.farmBalance,
                    gaugeBalance: olderSnapshot.gaugeBalance,
                    totalBalance: olderSnapshot.totalBalance,
                    percentShare: percentShare,
                    totalValueUSD: `${parseFloat(olderSnapshot.totalBalance) * (poolSnapshot?.sharePrice || 0)}`,
                    fees24h: `${
                        percentShare *
                        (poolSnapshot?.fees24h || 0) *
                        (1 - networkContext.data.balancer.swapProtocolFeePercentage)
                    }`,
                });
            }
        }

        // We need the fist snapshot already in the userPoolSnapshots array because we are accessing previous indexes below.
        // We only need to do this here if we didn't already push one snapshot above.
        if (userPoolSnapshots.length === 0) {
            const firstSnapshot = storedUserSnapshotsInRangeForPool.shift();
            if (firstSnapshot) {
                // check
                userPoolSnapshots.push({
                    timestamp: firstSnapshot.timestamp,
                    walletBalance: firstSnapshot.walletBalance,
                    farmBalance: firstSnapshot.farmBalance,
                    gaugeBalance: firstSnapshot.gaugeBalance,
                    totalBalance: firstSnapshot.totalBalance,
                    totalValueUSD: firstSnapshot.totalValueUSD,
                    fees24h: firstSnapshot.fees24h,
                    percentShare: parseFloat(firstSnapshot.percentShare),
                });
            }
        }
        for (const currentSnapshot of storedUserSnapshotsInRangeForPool) {
            /* 2nd)
            as long as the currentSnapshot is newer than (timestamp + 1 day) of the last snapshot in userPoolSnapshots, it means there is a gap that we need to fill. 
            E.g. we have snapshots for day 1 and 4 -> currentSnapshot.timestamp=4 (day 1 already stored above), which is newer than 1+1, so we fill the gap for day 2.
            currentSnapshot.timestamp=4 is newer than 2+1, need to fill gap for day 3.
            currentSnapshot.timestamp=4 is not newer than 3+1, no gap, persist currentSnapshot
            etc.
            */
            while (
                currentSnapshot.timestamp >
                userPoolSnapshots[userPoolSnapshots.length - 1].timestamp + secondsPerDay
            ) {
                //need to fill the gap from last snapshot
                const previousUserSnapshot = userPoolSnapshots[userPoolSnapshots.length - 1];
                const currentTimestamp = previousUserSnapshot.timestamp + secondsPerDay;
                const poolSnapshot = poolSnapshots.find((snapshot) => snapshot.timestamp === currentTimestamp);
                const percentShare = poolSnapshot
                    ? parseFloat(previousUserSnapshot.totalBalance) / poolSnapshot.totalSharesNum
                    : 0;
                userPoolSnapshots.push({
                    timestamp: currentTimestamp,
                    walletBalance: previousUserSnapshot.walletBalance,
                    farmBalance: previousUserSnapshot.farmBalance,
                    gaugeBalance: previousUserSnapshot.gaugeBalance,
                    totalBalance: previousUserSnapshot.totalBalance,
                    percentShare: percentShare,
                    totalValueUSD: `${parseFloat(previousUserSnapshot.totalBalance) * (poolSnapshot?.sharePrice || 0)}`,
                    fees24h: `${
                        percentShare *
                        (poolSnapshot?.fees24h || 0) *
                        (1 - networkContext.data.balancer.swapProtocolFeePercentage)
                    }`,
                });
            }

            if (parseFloat(currentSnapshot.totalBalance) > 0 && parseFloat(currentSnapshot.totalValueUSD) === 0) {
                // We didn't have a poolsnapshot at the time of persistance, let's see if we have one now and persist
                const poolSnapshot = poolSnapshots.find(
                    (poolSnapshot) => poolSnapshot.timestamp === currentSnapshot.timestamp,
                );
                if (poolSnapshot) {
                    const percentShare = parseFloat(currentSnapshot.totalBalance) / poolSnapshot.totalSharesNum;
                    currentSnapshot.percentShare = percentShare.toString();
                    currentSnapshot.totalValueUSD = `${
                        parseFloat(currentSnapshot.totalBalance) * (poolSnapshot.sharePrice || 0)
                    }`;
                    currentSnapshot.fees24h = `${
                        percentShare *
                        (poolSnapshot.fees24h || 0) *
                        (1 - networkContext.data.balancer.swapProtocolFeePercentage)
                    }`;
                    await prisma.prismaUserPoolBalanceSnapshot.update({
                        where: { id_chain: { id: currentSnapshot.id, chain: chain } },
                        data: currentSnapshot,
                    });
                }
            }
            userPoolSnapshots.push({
                timestamp: currentSnapshot.timestamp,
                walletBalance: currentSnapshot.walletBalance,
                farmBalance: currentSnapshot.farmBalance,
                gaugeBalance: currentSnapshot.gaugeBalance,
                totalBalance: currentSnapshot.totalBalance,
                totalValueUSD: currentSnapshot.totalValueUSD,
                fees24h: currentSnapshot.fees24h,
                percentShare: parseFloat(currentSnapshot.percentShare),
            });
        }

        // 3rd) we have to check if there are missing snapshots from the last snapshot until today and fill in those gaps (if the latest balance is > 0)
        if (parseFloat(userPoolSnapshots[userPoolSnapshots.length - 1].totalBalance) > 0) {
            while (userPoolSnapshots[userPoolSnapshots.length - 1].timestamp < moment().startOf('day').unix()) {
                const previousUserSnapshot = userPoolSnapshots[userPoolSnapshots.length - 1];
                const currentTimestamp = previousUserSnapshot.timestamp + secondsPerDay;
                const poolSnapshot = poolSnapshots.find((snapshot) => snapshot.timestamp === currentTimestamp);
                const percentShare = poolSnapshot
                    ? parseFloat(previousUserSnapshot.totalBalance) / poolSnapshot.totalSharesNum
                    : 0;
                userPoolSnapshots.push({
                    timestamp: currentTimestamp,
                    walletBalance: previousUserSnapshot.walletBalance,
                    farmBalance: previousUserSnapshot.farmBalance,
                    gaugeBalance: previousUserSnapshot.gaugeBalance,
                    totalBalance: previousUserSnapshot.totalBalance,
                    percentShare: percentShare,
                    totalValueUSD: `${parseFloat(previousUserSnapshot.totalBalance) * (poolSnapshot?.sharePrice || 0)}`,
                    fees24h: `${
                        percentShare *
                        (poolSnapshot?.fees24h || 0) *
                        (1 - networkContext.data.balancer.swapProtocolFeePercentage)
                    }`,
                });
            }
        }
        return userPoolSnapshots;
    }

    private createUserPoolSnapshotData(
        poolSnapshot: PrismaPoolSnapshot | undefined | null,
        pool: PrismaPool & { staking: PrismaPoolStaking[] },
        chain: Chain,
        subgraphSnapshot: UserBalanceSnapshotFragment,
        totalBalance: number,
        walletBalance: string,
        gaugeBalance: string,
        farmBalance: string,
    ) {
        const percentShare = poolSnapshot ? totalBalance / poolSnapshot?.totalSharesNum : 0;

        const userPoolBalanceSnapshotData = {
            id: `${pool.id}-${subgraphSnapshot.user.id.toLowerCase()}-${subgraphSnapshot.timestamp}`,
            chain: chain,
            timestamp: subgraphSnapshot.timestamp,
            userAddress: subgraphSnapshot.user.id.toLowerCase(),
            poolId: pool.id,
            poolToken: pool.address,
            walletBalance,
            gaugeBalance,
            farmBalance,
            percentShare: `${percentShare}`,
            totalBalance: `${totalBalance}`,
            totalValueUSD: `${totalBalance * (poolSnapshot?.sharePrice || 0)}`,
            fees24h: `${
                percentShare *
                (poolSnapshot?.fees24h || 0) *
                (1 - networkContext.data.balancer.swapProtocolFeePercentage)
            }`,
        };
        return userPoolBalanceSnapshotData;
    }

    /*
    The snapshot consists of 6 arrays which follow the same structure. For each type (wallet, farm, gauge) it has a "index" array and a "balance" array:
    - walletTokens -> walletBalances
    - Gauges -> GaugeBalances
    - Farms -> FarmBalances

    The index array indicates the position of the walletToken, gauge or farm in the balance array. e.g.:
    - walletTokens: ["token1", "token2"]
    - walletBalances: ["200", "100"]
    This means the user has 200 of token1 and 100 of token2 in his wallet. 
    */
    private extractBalancesFromSnapshot(
        userSnapshot: UserBalanceSnapshotFragment,
        pool: PrismaPool & { staking: PrismaPoolStaking[] },
    ) {
        const walletIdx = userSnapshot.walletTokens.indexOf(pool.address);
        let walletBalance = walletIdx !== -1 ? userSnapshot.walletBalances[walletIdx] : '0';
        let gaugeBalance = '0';
        let farmBalance = '0';
        for (const stake of pool.staking) {
            const gaugeIdx = userSnapshot.gauges.indexOf(stake.id || '');
            gaugeBalance =
                gaugeIdx !== -1
                    ? `${parseFloat(userSnapshot.gaugeBalances[gaugeIdx]) + parseFloat(gaugeBalance)}`
                    : gaugeBalance;
            const farmIdx = userSnapshot.farms.indexOf(stake.id || '');
            farmBalance =
                farmIdx !== -1 ? `${parseFloat(userSnapshot.farmBalances[farmIdx]) + parseFloat(farmBalance)}` : '0';
        }

        // if the pool is fbeets (fidelio duetto), we need to also add fbeets wallet balance (multiplied by bpt ratio) to the bpt wallet balance
        // we also need to multiply the staked amount by the fbeets->bpt ratio
        if (pool.id === networkContext.data.fbeets?.poolId) {
            const fBeetsWalletIdx = userSnapshot.walletTokens.indexOf(networkContext.data.fbeets?.address || '');
            const fBeetsWalletBalance = fBeetsWalletIdx !== -1 ? userSnapshot.walletBalances[fBeetsWalletIdx] : '0';
            walletBalance = (
                parseFloat(walletBalance) +
                parseFloat(fBeetsWalletBalance) * this.FBEETS_BPT_RATIO
            ).toString();

            farmBalance = (parseFloat(farmBalance) * this.FBEETS_BPT_RATIO).toString();
        }

        const totalBalance = parseFloat(walletBalance) + parseFloat(gaugeBalance) + parseFloat(farmBalance);
        return { totalBalance, walletBalance, gaugeBalance, farmBalance };
    }

    private async getStoredSnapshotsForUserForPoolFromTimestamp(
        userAddress: string,
        oldestRequestedSnapshotTimestamp: number,
        poolId: string,
        chain: Chain,
    ) {
        return await prisma.prismaUserPoolBalanceSnapshot.findMany({
            where: {
                userAddress: userAddress,
                timestamp: {
                    gte: oldestRequestedSnapshotTimestamp,
                },
                poolId: poolId,
                chain: chain,
            },
            orderBy: { timestamp: 'asc' },
        });
    }

    private getTimestampForRange(range: GqlUserSnapshotDataRange): number {
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
