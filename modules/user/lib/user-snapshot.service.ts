import { UserSnapshotSubgraphService } from '../../subgraphs/user-snapshot-subgraph/user-snapshot-subgraph.service';
import { prisma } from '../../../prisma/prisma-client';
import { parseUnits } from 'ethers/lib/utils';
import moment from 'moment-timezone';
import { UserPoolSnapshot, UserPortfolioSnapshot } from '../user-types';
import { GqlUserSnapshotDataRange } from '../../../schema';
import { PoolSnapshotService } from '../../pool/lib/pool-snapshot.service';
import { formatFixed } from '@ethersproject/bignumber';
import { networkConfig } from '../../config/network-config';
import { Prisma, PrismaPoolSnapshot } from '@prisma/client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

//TODO FBEETS
export class UserSnapshotService {
    private readonly ONE_DAY_IN_SECONDS: number = 86400;

    constructor(
        private readonly userSnapshotSubgraphService: UserSnapshotSubgraphService,
        private readonly poolSnapshotService: PoolSnapshotService,
    ) {}

    public async syncUserSnapshots() {
        // sync all snapshots that we have stored

        let operations: any[] = [];

        // get all unique users
        const users = await prisma.prismaUserPoolBalanceSnapshot.findMany({
            distinct: ['userAddress'],
            select: {
                userAddress: true,
            },
        });

        for (const user of users) {
            const userAddress = user.userAddress;
            const subgraphSnapshotForUser = await this.userSnapshotSubgraphService.getUserBalanceSnapshotsWithPaging(
                0,
                moment().unix(),
                userAddress,
            );
            // no snapshots for the user in the requested timerange
            if (!subgraphSnapshotForUser) {
                continue;
            }

            // get all pools where we have snapshots for this user
            const latestStoredPoolSnapshotsOfUser = await prisma.prismaUserPoolBalanceSnapshot.findMany({
                where: { userAddress: userAddress },
                orderBy: { timestamp: 'desc' },
                distinct: ['userAddress', 'poolId'],
            });

            /*
            For each latest stored user pool snapshot, we need to sync from subgraph. We only write to the db if the
            subgraph snapshot has a >0 total balance for the pool 
            -or- 
            if the latest stored user pool snapshot is >0 total balance and the subgraph snapshot has 0 total balance for the pool. This is
            to indicate that a user has left the pool.

            We need to gradually sync/upsert todays snapshot, because the poolsnapshot is also gradually upserted 
            (fees and volume increase in the course of the day). Hence we need to check subgraphSnapshot.timestamp >= latestStoredUserPoolSnapshot.timestamp) 


            Loop through subgraph snapshots 
            - if subgraph snapshot is newer or same than latest stored user pool snapshot:
              - if subgraph snapshot is > 0 balance:
                 enrich and persist
              - else if latest stored user pool snapshot > 0:
                persist 0 total balance snapshot (must become new latest stored snapshot)
              - else:
                do nothing: do not persist consecutive 0 total balance snapshot
            */
            for (const latestStoredUserPoolSnapshot of latestStoredPoolSnapshotsOfUser) {
                let latestStoredUserPoolSnapshotHasBalance = parseFloat(latestStoredUserPoolSnapshot.totalBalance) > 0;
                for (const subgraphSnapshot of subgraphSnapshotForUser.snapshots) {
                    if (!subgraphSnapshot || !latestStoredUserPoolSnapshot.poolId) {
                        continue;
                    }
                    if (subgraphSnapshot.timestamp >= latestStoredUserPoolSnapshot.timestamp) {
                        const pool = await prisma.prismaPool.findUniqueOrThrow({
                            where: {
                                id: latestStoredUserPoolSnapshot.poolId,
                            },
                            include: {
                                staking: true,
                            },
                        });
                        const walletIdx = subgraphSnapshot.walletTokens.indexOf(pool.address);
                        const walletBalance = walletIdx !== -1 ? subgraphSnapshot.walletBalances[walletIdx] : '0';
                        const gaugeIdx = subgraphSnapshot.gauges.indexOf(pool.staking?.id || '');
                        const gaugeBalance = gaugeIdx !== -1 ? subgraphSnapshot.gaugeBalances[gaugeIdx] : '0';
                        const farmIdx = subgraphSnapshot.farms.indexOf(pool.staking?.id || '');

                        const farmBalance = farmIdx !== -1 ? subgraphSnapshot.farmBalances[farmIdx] : '0';
                        const totalBalanceScaled = parseUnits(walletBalance, 18)
                            .add(parseUnits(gaugeBalance, 18))
                            .add(parseUnits(farmBalance, 18));

                        if (totalBalanceScaled.gt(0)) {
                            //enrich with poolsnapshot data and save
                            const poolSnapshot = await this.poolSnapshotService.getSnapshotForPool(
                                latestStoredUserPoolSnapshot.poolId,
                                subgraphSnapshot.timestamp,
                            );

                            /*
                            Could be that the poolsnapshot is delayed (beethoven subgraph is much slower than bpt subgraph),
                            so we will persist 0 $ value if there is a totalBalance > 0 and try to get the when we serve the data
                            */
                            const percentShare = poolSnapshot
                                ? parseFloat(formatFixed(totalBalanceScaled, 18)) / poolSnapshot?.totalSharesNum
                                : 0;

                            const userPoolBalanceSnapshotData = {
                                id: `${pool.id}-${subgraphSnapshot.user.id.toLowerCase()}-${
                                    subgraphSnapshot.timestamp
                                }`,
                                timestamp: subgraphSnapshot.timestamp,
                                userAddress: subgraphSnapshot.user.id.toLowerCase(),
                                poolId: pool.id,
                                poolToken: pool.address,
                                walletBalance,
                                gaugeBalance,
                                farmBalance,
                                percentShare: `${percentShare}`,
                                totalBalance: formatFixed(totalBalanceScaled, 18),
                                totalValueUSD: `${
                                    parseFloat(formatFixed(totalBalanceScaled, 18)) * (poolSnapshot?.sharePrice || 0)
                                }`,
                                fees24h: `${
                                    percentShare *
                                    (poolSnapshot?.fees24h || 0) *
                                    (1 - networkConfig.balancer.swapProtocolFeePercentage)
                                }`,
                            };

                            operations.push(
                                prisma.prismaUserPoolBalanceSnapshot.upsert({
                                    where: { id: userPoolBalanceSnapshotData.id },
                                    create: userPoolBalanceSnapshotData,
                                    update: userPoolBalanceSnapshotData,
                                }),
                            );
                            latestStoredUserPoolSnapshotHasBalance = true;
                        } else if (latestStoredUserPoolSnapshotHasBalance) {
                            const userPoolBalanceSnapshotData = {
                                id: `${pool.id}-${subgraphSnapshot.user.id.toLowerCase()}-${
                                    subgraphSnapshot.timestamp
                                }`,
                                timestamp: subgraphSnapshot.timestamp,
                                userAddress: subgraphSnapshot.user.id.toLowerCase(),
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
                                    where: { id: userPoolBalanceSnapshotData.id },
                                    create: userPoolBalanceSnapshotData,
                                    update: userPoolBalanceSnapshotData,
                                }),
                            );
                            latestStoredUserPoolSnapshotHasBalance = false;
                        }
                    }
                }
            }
        }

        await prismaBulkExecuteOperations(operations, false);
    }

    public async getUserSnapshotsForPool(
        userAddress: string,
        poolId: string,
        range: GqlUserSnapshotDataRange,
    ): Promise<UserPoolSnapshot[]> {
        const oldestRequestedSnapshotTimestamp = this.getTimestampForRange(range);

        userAddress = userAddress.toLowerCase();
        poolId = poolId.toLowerCase();

        let storedUserSnapshotsFromRange = await this.getStoredSnapshotsForUserForPoolFromTimestamp(
            userAddress,
            oldestRequestedSnapshotTimestamp,
            poolId,
        );

        let poolSnapshots: PrismaPoolSnapshot[] = [];

        // no stored snapshots, retrieve from subgraph and store all
        if (storedUserSnapshotsFromRange.length === 0) {
            const userSnapshotsFromSubgraph = await this.userSnapshotSubgraphService.getUserBalanceSnapshotsWithPaging(
                0,
                moment().unix(),
                userAddress,
            );

            const pool = await prisma.prismaPool.findUniqueOrThrow({
                where: {
                    id: poolId,
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

                    if (pool.staking) {
                        if (snapshot.farms.includes(pool.staking.id) || snapshot.gauges.includes(pool.staking.id))
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

            poolSnapshots = await this.poolSnapshotService.getSnapshotsForPool(poolId, range);

            /*
            For each snapshot from the subgraph, this will get the poolSnapshot for the same timestamp and enrich with $ value data
            If there is no poolSnapshot for that timestamp, we persist a 0 $ totalUSD snapshot because it could become available at a later time
            If there are consecutive 0 total balance snapshots, only the first one is persisted. This is to avoid unnecessary 0 value 
            snapshots in the database. These 0 balance gaps must be filled when serving the request.
            */
            for (const userSnapshot of userSnapshotsFromSubgraph.snapshots) {
                const poolSnapshotForTimestamp = poolSnapshots.find(
                    (poolSnapshot) => userSnapshot.timestamp === poolSnapshot.timestamp,
                );

                // exctract data for the pool we need
                const walletIdx = userSnapshot.walletTokens.indexOf(pool.address);
                const walletBalance = walletIdx !== -1 ? userSnapshot.walletBalances[walletIdx] : '0';
                const gaugeIdx = userSnapshot.gauges.indexOf(pool.staking?.id || '');
                const gaugeBalance = gaugeIdx !== -1 ? userSnapshot.gaugeBalances[gaugeIdx] : '0';
                const farmIdx = userSnapshot.farms.indexOf(pool.staking?.id || '');
                const farmBalance = farmIdx !== -1 ? userSnapshot.farmBalances[farmIdx] : '0';
                const totalBalanceScaled = parseUnits(walletBalance, 18)
                    .add(parseUnits(gaugeBalance, 18))
                    .add(parseUnits(farmBalance, 18));

                /*
                We get ALL snapshots from the subgraph for the user. Total balance will be 0 until he joined the pool we need.
                Therefore we want to skip all 0 total balance snapshot at the beginning.
                */
                if (prismaInput.length === 0 && totalBalanceScaled.eq(0)) {
                    continue;
                }

                /*
                If a user left a pool, the snapshot from the subgraph won't list the pool balance with '0'.
                In fact, the pool address (or farm or gage id) won't show up in the array. We therefore need to push the FIRST
                0 total balance snapshot to show that he left the pool, but want to skip any consecutive 0 total value
                snapshots to avoid unnecessary 0 total balance snapshots in the database.
                */
                if (totalBalanceScaled.eq(0) && prismaInput[prismaInput.length - 1].totalBalance === '0') {
                    continue;
                }

                /*
                Could be that the poolsnapshot is delayed (beethoven subgraph is much slower than bpt subgraph),
                so we will persist 0 $ value if there is a totalBalance > 0 and try to get the when we serve the data
                */
                const percentShare = poolSnapshotForTimestamp
                    ? parseFloat(formatFixed(totalBalanceScaled, 18)) / poolSnapshotForTimestamp?.totalSharesNum
                    : 0;

                prismaInput.push({
                    id: `${pool.id}-${userSnapshot.user.id.toLowerCase()}-${userSnapshot.timestamp}`,
                    timestamp: userSnapshot.timestamp,
                    userAddress: userSnapshot.user.id.toLowerCase(),
                    poolId: pool.id,
                    poolToken: pool.address,
                    walletBalance,
                    gaugeBalance,
                    farmBalance,
                    percentShare: `${percentShare}`,
                    totalBalance: formatFixed(totalBalanceScaled, 18),
                    totalValueUSD: `${
                        parseFloat(formatFixed(totalBalanceScaled, 18)) * (poolSnapshotForTimestamp?.sharePrice || 0)
                    }`,
                    fees24h: `${
                        percentShare *
                        (poolSnapshotForTimestamp?.fees24h || 0) *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                });
            }
            await prisma.prismaUserPoolBalanceSnapshot.createMany({
                data: prismaInput,
            });

            storedUserSnapshotsFromRange = await this.getStoredSnapshotsForUserForPoolFromTimestamp(
                userAddress,
                oldestRequestedSnapshotTimestamp,
                poolId,
            );
        }

        // Only get them if we didn't get them above
        if (poolSnapshots.length === 0) {
            poolSnapshots = await this.poolSnapshotService.getSnapshotsForPool(poolId, range);
        }

        /*
        If a user joined a pool and did not interact with the pool (or any other pool) for a few days, those snapshots 
        will be missing from the subgraph and also in the database. When the user requests his snapshots for a given pool
        we need to find and fill the gaps between the first and the last snapshot we have in the database
        In addition, if the last snapshot is not a 0 total balance snapshot (which would mean the user left the pool) we will also 
        need to fill the gaps from the last snapshot until today.
        */

        // The first snapshot in the database must be >0 total value, push that
        const userPoolSnapshots: UserPoolSnapshot[] = [];
        userPoolSnapshots.push({
            timestamp: storedUserSnapshotsFromRange[0].timestamp,
            walletBalance: storedUserSnapshotsFromRange[0].walletBalance,
            farmBalance: storedUserSnapshotsFromRange[0].farmBalance,
            gaugeBalance: storedUserSnapshotsFromRange[0].gaugeBalance,
            totalBalance: storedUserSnapshotsFromRange[0].totalBalance,
            totalValueUSD: storedUserSnapshotsFromRange[0].totalValueUSD,
            fees24h: storedUserSnapshotsFromRange[0].fees24h,
            percentShare: parseFloat(storedUserSnapshotsFromRange[0].percentShare),
        });
        let firstIteration = true;
        for (const snapshot of storedUserSnapshotsFromRange) {
            // skip first
            if (firstIteration) {
                firstIteration = false;
                continue;
            }
            // as long as the current snapshot is newer than the last snapshot in the result array + 1 day,
            // it means there is a gap that we need to fill

            while (
                snapshot.timestamp >
                userPoolSnapshots[userPoolSnapshots.length - 1].timestamp + this.ONE_DAY_IN_SECONDS
            ) {
                //need to fill the gap from last snapshot
                const previousUserSnapshot = userPoolSnapshots[userPoolSnapshots.length - 1];
                const currentTimestamp = previousUserSnapshot.timestamp + this.ONE_DAY_IN_SECONDS;
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
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                });
            }

            // We didn't have a poolsnapshot at the time of persistance, let's see if we have one now and persist
            if (parseUnits(snapshot.totalBalance, 18).gt(0) && parseUnits(snapshot.totalValueUSD, 18).eq(0)) {
                const poolSnapshot = poolSnapshots.find(
                    (poolSnapshot) => poolSnapshot.timestamp === snapshot.timestamp,
                );
                if (poolSnapshot) {
                    const percentShare = parseFloat(snapshot.totalBalance) / poolSnapshot.totalSharesNum;
                    snapshot.percentShare = percentShare.toString();
                    snapshot.totalValueUSD = `${parseFloat(snapshot.totalBalance) * (poolSnapshot.sharePrice || 0)}`;
                    snapshot.fees24h = `${
                        percentShare *
                        (poolSnapshot.fees24h || 0) *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`;
                    await prisma.prismaUserPoolBalanceSnapshot.update({
                        where: { id: snapshot.id },
                        data: snapshot,
                    });
                }
            }
            userPoolSnapshots.push({
                timestamp: snapshot.timestamp,
                walletBalance: snapshot.walletBalance,
                farmBalance: snapshot.farmBalance,
                gaugeBalance: snapshot.gaugeBalance,
                totalBalance: snapshot.totalBalance,
                totalValueUSD: snapshot.totalValueUSD,
                fees24h: snapshot.fees24h,
                percentShare: parseFloat(snapshot.percentShare),
            });
        }

        // find and fill gap from last snapshot to today (if its balance is > 0)
        if (parseUnits(userPoolSnapshots[userPoolSnapshots.length - 1].totalBalance, 18).gt(0)) {
            while (userPoolSnapshots[userPoolSnapshots.length - 1].timestamp < moment().startOf('day').unix()) {
                const previousUserSnapshot = userPoolSnapshots[userPoolSnapshots.length - 1];
                const currentTimestamp = previousUserSnapshot.timestamp + this.ONE_DAY_IN_SECONDS;
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
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                });
            }
        }
        return userPoolSnapshots;
    }

    private async getStoredSnapshotsForUserForPoolFromTimestamp(
        userAddress: string,
        oldestRequestedSnapshotTimestamp: number,
        poolId: string,
    ) {
        return await prisma.prismaUserPoolBalanceSnapshot.findMany({
            where: {
                userAddress: userAddress,
                timestamp: {
                    gte: oldestRequestedSnapshotTimestamp,
                },
                poolId: poolId,
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
