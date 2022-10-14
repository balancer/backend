import moment from 'moment';
import { graphql } from 'msw';
import { prisma } from '../../prisma/prisma-client';
import { networkConfig } from '../config/network-config';
import {
    createWeightedPoolFromDefault,
    defaultTokens,
    createRandomSnapshotsForPool,
    createRandomSnapshotsForPoolForTimestamp,
    createUserPoolBalanceSnapshot,
} from '../tests-helper/poolTestdataHelpers';
import { createIndividualDatabaseSchemaForTest as createDedicatedSchemaForTest } from '../tests-helper/setupTestDatabase';
import { mockServer } from '../tests-helper/mocks/mockHttpServer';
import { userService } from './user.service';
import { secondsPerDay } from '../common/time';

/*
TEST SETUP:
- Two different weighted pools, one with 30 random snapshots (complete, one spanshot per day) one with only 2 snapshots
- pool1 has also a farm specified
- One user 
- fidelio pool

*/
const poolId1 = '0x001a';
const poolName1 = 'Test pool 1';
const poolAddress1 = '0x001';
const farmId1 = '0x001a-stake';

const pool2Id = '0x002a';
const poolName2 = 'Test pool 2';
const poolAddress2 = '0x002';

const userAddress = '0x0000000000000000000000000000000000000001';

const FBEETS_BPT_RATIO: number = 1.0271;

const today = moment().startOf('day').unix();
const sevenDaysAgo = today - 7 * secondsPerDay;
const sixDaysAgo = today - 6 * secondsPerDay;
const fiveDaysAgo = today - 5 * secondsPerDay;
const fourDaysAgo = today - 4 * secondsPerDay;
const threeDaysAgo = today - 3 * secondsPerDay;
const twoDaysAgo = today - 2 * secondsPerDay;
const oneDayAgo = today - 1 * secondsPerDay;

beforeAll(async () => {
    await createDedicatedSchemaForTest();
    const pool1 = await createWeightedPoolFromDefault(
        {
            id: poolId1,
            name: poolName1,
            address: poolAddress1,
            staking: {
                create: {
                    id: farmId1,
                },
            },
        },
        [defaultTokens.usdc, defaultTokens.wftm, defaultTokens.wbtc, defaultTokens.beets],
    );

    // create 30 snapshotsfor pool1
    await createRandomSnapshotsForPool(pool1.id, pool1.tokens.length, 30);

    const fidelio = await createWeightedPoolFromDefault(
        {
            id: networkConfig.fbeets.poolId,
            name: 'Fidelio Duetto',
            address: networkConfig.fbeets.poolAddress,
            staking: {
                create: {
                    id: networkConfig.fbeets.farmId,
                },
            },
        },
        [defaultTokens.wftm, defaultTokens.beets],
    );

    // create 30 snapshotsfor pool1
    await createRandomSnapshotsForPool(fidelio.id, fidelio.tokens.length, 365);

    // create user
    await prisma.prismaUser.create({
        data: {
            address: userAddress,
        },
    });
}, 60000);

afterEach(async () => {
    mockServer.resetHandlers();
    await prisma.prismaUserPoolBalanceSnapshot.deleteMany({});
});

// Clean up after the tests are finished.
afterAll(async () => {
    await prisma.$disconnect();
});

test('The user requests the user stats for the first time, requesting from subgraph, persiting to db.', async () => {
    /*
    Scenario: 
    - The user requests the user stats for the first time
    - The user joined pool1 three days ago, joined again one day ago, added some to farm and joined another pool one day ago

    Behaviour under test:
    - Snapshot inference that a fourth snapshot is created for missing day two days ago
    - Snapshots are retrieved from subgraph and persisted in DB
    - Only snapshots for requested pool and without inferred snapshot are persisted in DB (three snapshots)
    - Balances are correctly returned and summarized (farmbalance + walletbalance = totalbalance)
    - USD values are correctly calculated based on pool snapshot values

    Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
    - Create three snapshots for user
    - First snapshot from three days ago, where he only has 1 bpts from pool1 in his wallet
    - Seconds snapshot from one day ago, where he has 0.5 bpt from pool1 and 1 bpt from pool2 in his wallet and 1 bpt from pool1 in the farm
    - Third snapshot from today, where he has only 1 bpt from pool2 in his wallet 

    */

    const timestampOfLastReturnedSnapshot = today;

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > timestampOfLastReturnedSnapshot) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${threeDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: threeDaysAgo,
                                walletTokens: [poolAddress1],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${oneDayAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: oneDayAgo,
                                walletTokens: [poolAddress1, poolAddress2],
                                walletBalances: ['0.5', '1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [farmId1],
                                farmBalances: ['1'],
                            },
                            {
                                id: `${userAddress}-${today}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: today,
                                walletTokens: [poolAddress2],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    const snapshotsFromService = await userService.getUserBalanceSnapshotsForPool(userAddress, poolId1, 'THIRTY_DAYS');
    //check if 4th snapshot has been inferred from three present ones
    expect(snapshotsFromService.length).toBe(4);
    const snapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
        include: { pool: true },
    });

    // check if the 3 snapshots have been persisted
    expect(snapshotsFromDb.length).toBe(3);

    // check if balances are calculated correctly
    expect(snapshotsFromService[0].walletBalance).toBe('1');
    expect(snapshotsFromService[0].timestamp).toBe(today - 3 * secondsPerDay);
    expect(snapshotsFromService[1].walletBalance).toBe('1');
    expect(snapshotsFromService[1].timestamp).toBe(today - 2 * secondsPerDay);

    expect(snapshotsFromService[2].walletBalance).toBe('0.5');
    expect(snapshotsFromService[2].farmBalance).toBe('1');
    expect(snapshotsFromService[2].totalBalance).toBe('1.5');
    expect(snapshotsFromService[2].timestamp).toBe(today - 1 * secondsPerDay);

    expect(snapshotsFromService[3].walletBalance).toBe('0');
    expect(snapshotsFromService[3].timestamp).toBe(today - 0 * secondsPerDay);

    const poolSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: { poolId: poolId1 },
    });

    // check if usd value, percent share of the pool and fees are correctly calculated based on poolsnapshots
    for (const userBalanceSnapshot of snapshotsFromService) {
        let foundPoolSnapshot = false;
        for (const poolSnapshot of poolSnapshots) {
            if (poolSnapshot.timestamp === userBalanceSnapshot.timestamp) {
                expect(userBalanceSnapshot.totalValueUSD).toBe(
                    `${poolSnapshot.sharePrice * parseFloat(userBalanceSnapshot.totalBalance)}`,
                );
                expect(userBalanceSnapshot.percentShare).toBe(
                    parseFloat(userBalanceSnapshot.totalBalance) / poolSnapshot.totalSharesNum,
                );
                expect(userBalanceSnapshot.fees24h).toBe(
                    `${
                        userBalanceSnapshot.percentShare *
                        poolSnapshot.fees24h *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                );
                foundPoolSnapshot = true;
            }
        }
        //make sure we have a pool snapshot for each user snapshot
        expect(foundPoolSnapshot).toBe(true);
    }
});

test('User in in the pool for a very long time, requests various different time ranges.', async () => {
    /*
    Scenario: 
    - The user joined pool1 one year ago and is in there ever since, never changed position.
    - Requests different time ranges

    Behaviour under test:
    - If the various time ranges return correct number of snapshots
    - Only one snapshot a year ago, all other snapshots should be inferred up to today
    - Only one year old snapshot, make sure that also snapshots are returned for shorter timeframes

    Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
    - Create 1 snapshot one year ago for the user in the subgraph
    
    Also create 365 Snapshots for the pool.

    */

    const oneYearAgo = today - 365 * secondsPerDay;
    const timestampOfLastReturnedSnapshot = oneYearAgo;

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > timestampOfLastReturnedSnapshot) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${oneYearAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: oneYearAgo,
                                walletTokens: [poolAddress1],
                                walletBalances: ['10'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [farmId1],
                                farmBalances: ['5'],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    const thirtySnapshotsFromService = await userService.getUserBalanceSnapshotsForPool(
        userAddress,
        poolId1,
        'THIRTY_DAYS',
    );

    //also includes the one from today
    expect(thirtySnapshotsFromService.length).toBe(31);
    const thirtySnapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
        include: { pool: true },
    });

    // check if the 3 snapshots have been persisted
    expect(thirtySnapshotsFromDb.length).toBe(1);

    const ninetySnapshotsFromService = await userService.getUserBalanceSnapshotsForPool(
        userAddress,
        poolId1,
        'NINETY_DAYS',
    );
    //also includes the one from today
    expect(ninetySnapshotsFromService.length).toBe(91);
    const ninetySnapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
        include: { pool: true },
    });

    // check if the 3 snapshots have been persisted
    expect(ninetySnapshotsFromDb.length).toBe(1);
});

test('user leaves pool and joins pool again', async () => {
    /*
Scenario: 
- The user requests the user stats for the first time
- The user joined pool1 three days ago, left the pool two days ago and joined again one day ago

Behaviour under test:
- Snapshot inference that he has the same amount today as yesterday
- 0 balance snapshots are correctly returned

Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
- Create three snapshots for user
- First snapshot from three days ago, where he only has 1 bpts from pool1 in his wallet
- Seconds snapshot from two days ago, where he has no balance
- Third snapshot from yesterday, where he has 1 bpt from pool1 in his wallet

*/

    const timestampOfLastReturnedSnapshot = oneDayAgo;

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > timestampOfLastReturnedSnapshot) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${threeDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: threeDaysAgo,
                                walletTokens: [poolAddress1],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${twoDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: twoDaysAgo,
                                walletTokens: [],
                                walletBalances: [],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${oneDayAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: oneDayAgo,
                                walletTokens: [poolAddress1],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    const snapshotsFromService = await userService.getUserBalanceSnapshotsForPool(userAddress, poolId1, 'THIRTY_DAYS');
    //check if 4th snapshot has been inferred from three present ones
    expect(snapshotsFromService.length).toBe(4);
    const snapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
        include: { pool: true },
    });

    // check if the 3 snapshots have been persisted
    expect(snapshotsFromDb.length).toBe(3);

    // check if balances are calculated correctly
    expect(snapshotsFromService[0].timestamp).toBe(threeDaysAgo);
    expect(snapshotsFromService[0].walletBalance).toBe('1');
    expect(snapshotsFromService[1].timestamp).toBe(twoDaysAgo);
    expect(snapshotsFromService[1].walletBalance).toBe('0');
    expect(snapshotsFromService[1].totalValueUSD).toBe('0');
    expect(snapshotsFromService[1].fees24h).toBe('0');
    expect(snapshotsFromService[1].percentShare).toBe(0);

    expect(snapshotsFromService[2].timestamp).toBe(oneDayAgo);
    expect(snapshotsFromService[2].walletBalance).toBe('1');

    expect(snapshotsFromService[3].timestamp).toBe(today);
    expect(snapshotsFromService[3].walletBalance).toBe('1');

    const poolSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: { poolId: poolId1 },
    });

    // check if usd value, percent share of the pool and fees are correctly calculated based on poolsnapshots
    for (const userBalanceSnapshot of snapshotsFromService) {
        let foundPoolSnapshot = false;
        for (const poolSnapshot of poolSnapshots) {
            if (poolSnapshot.timestamp === userBalanceSnapshot.timestamp) {
                expect(userBalanceSnapshot.totalValueUSD).toBe(
                    `${poolSnapshot.sharePrice * parseFloat(userBalanceSnapshot.totalBalance)}`,
                );
                expect(userBalanceSnapshot.percentShare).toBe(
                    parseFloat(userBalanceSnapshot.totalBalance) / poolSnapshot.totalSharesNum,
                );
                expect(userBalanceSnapshot.fees24h).toBe(
                    `${
                        userBalanceSnapshot.percentShare *
                        poolSnapshot.fees24h *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                );
                foundPoolSnapshot = true;
            }
        }
        //make sure we have a pool snapshot for each user snapshot
        expect(foundPoolSnapshot).toBe(true);
    }
});

test('When user left pool, no more snapshots are returned', async () => {
    /*
Scenario: 
- The user requests the user stats for the first time
- The user joined pool1 three days ago, left the pool two days ago

Behaviour under test:
- That once he leaves, those 0 balance snapshots are neither persisted nor returned

Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
- Create two snapshots for user
- First snapshot from three days ago, where he only has 1 bpts from pool1 in his wallet
- Seconds snapshot from two days ago, where he has no balance

*/
    const timestampOfLastReturnedSnapshot = secondsPerDay;

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > timestampOfLastReturnedSnapshot) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${threeDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: threeDaysAgo,
                                walletTokens: [poolAddress1],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${twoDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: twoDaysAgo,
                                walletTokens: [],
                                walletBalances: [],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    const snapshotsFromService = await userService.getUserBalanceSnapshotsForPool(userAddress, poolId1, 'THIRTY_DAYS');
    //check if 4th snapshot has been inferred from three present ones
    expect(snapshotsFromService.length).toBe(2);
    const snapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
        include: { pool: true },
    });

    // check if the 3 snapshots have been persisted
    expect(snapshotsFromDb.length).toBe(2);

    // check if balances are calculated correctly
    expect(snapshotsFromService[0].timestamp).toBe(threeDaysAgo);
    expect(snapshotsFromService[0].walletBalance).toBe('1');
    expect(snapshotsFromService[1].timestamp).toBe(twoDaysAgo);
    expect(snapshotsFromService[1].walletBalance).toBe('0');
    expect(snapshotsFromService[1].totalValueUSD).toBe('0');
    expect(snapshotsFromService[1].fees24h).toBe('0');
    expect(snapshotsFromService[1].percentShare).toBe(0);
});

test('Return a snapshot with 0 valueUSD if there is no pool snapshot for the given day. When pool snapshot becomes present, return and persist correct valueUSD for the given day.', async () => {
    /*
    Scenario: 
    - The user requests the user stats for the first time
    - The user joined pool2 three days ago and is still in the pool
    - Poolsnapshots are only available for two days, therefore only two valueUSD > 0 snapshots are present
    - Adding another "delayed" poolSnapshot after the frist query for today, which changes the valueUSD of the user snapshot for today

    Behaviour under test:
    - Pool2 has only two snapshots for three days ago and two days ago. 
    - We should have 4 usersnapshots but only the ones from three and two days ago should have USD values.
    - We then create another pool snapshot for today
    - We should now have 3 usersnapshots with $ values

    Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
    - Create one snapshots for user
    - First snapshot from three days ago, where he has 1 bpts from pool1 in his wallet
    - create two pool snapshots for pool2 for three days ago and two days ago
    */

    const timestampOfLastReturnedSnapshot = threeDaysAgo;

    // setup mock data in DB
    const pool2 = await createWeightedPoolFromDefault(
        {
            id: pool2Id,
            name: poolName2,
            address: poolAddress2,
        },
        [defaultTokens.usdc, defaultTokens.beets],
    );
    await createRandomSnapshotsForPoolForTimestamp(pool2.id, pool2.tokens.length, threeDaysAgo);
    await createRandomSnapshotsForPoolForTimestamp(pool2.id, pool2.tokens.length, twoDaysAgo);

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > timestampOfLastReturnedSnapshot) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${threeDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: threeDaysAgo,
                                walletTokens: [pool2.address],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    const snapshotsFromService = await userService.getUserBalanceSnapshotsForPool(userAddress, pool2Id, 'THIRTY_DAYS');
    // should get all 4 snapshots
    expect(snapshotsFromService.length).toBe(4);
    const snapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
        include: { pool: true },
    });

    // check if the 1 snapshots have been persisted (others are inferred on query)
    expect(snapshotsFromDb.length).toBe(1);

    // check if balances are calculated correctly
    expect(snapshotsFromService[0].timestamp).toBe(threeDaysAgo);
    expect(snapshotsFromService[0].walletBalance).toBe('1');
    expect(parseFloat(snapshotsFromService[0].totalValueUSD)).toBeGreaterThan(0);
    expect(snapshotsFromService[1].timestamp).toBe(twoDaysAgo);
    expect(snapshotsFromService[1].walletBalance).toBe('1');
    expect(parseFloat(snapshotsFromService[1].totalValueUSD)).toBeGreaterThan(0);

    expect(snapshotsFromService[2].timestamp).toBe(oneDayAgo);
    expect(snapshotsFromService[2].walletBalance).toBe('1');
    expect(parseFloat(snapshotsFromService[2].totalValueUSD)).toBe(0);

    expect(snapshotsFromService[3].timestamp).toBe(today);
    expect(snapshotsFromService[3].walletBalance).toBe('1');
    expect(parseFloat(snapshotsFromService[3].totalValueUSD)).toBe(0);

    await createRandomSnapshotsForPoolForTimestamp(pool2.id, pool2.tokens.length, today);

    const snapshotsAfterAdditionalPoolSnapshot = await userService.getUserBalanceSnapshotsForPool(
        userAddress,
        pool2Id,
        'THIRTY_DAYS',
    );
    //expect still the same results here as above
    expect(snapshotsFromService[0].timestamp).toBe(threeDaysAgo);
    expect(snapshotsFromService[0].walletBalance).toBe('1');
    expect(parseFloat(snapshotsFromService[0].totalValueUSD)).toBeGreaterThan(0);
    expect(snapshotsFromService[1].timestamp).toBe(twoDaysAgo);
    expect(snapshotsFromService[1].walletBalance).toBe('1');
    expect(parseFloat(snapshotsFromService[1].totalValueUSD)).toBeGreaterThan(0);

    expect(snapshotsFromService[2].timestamp).toBe(oneDayAgo);
    expect(snapshotsFromService[2].walletBalance).toBe('1');
    expect(parseFloat(snapshotsFromService[2].totalValueUSD)).toBe(0);

    // expecting a >0 value here since now a poolsnapshot was created
    expect(snapshotsAfterAdditionalPoolSnapshot[3].timestamp).toBe(today);
    expect(snapshotsAfterAdditionalPoolSnapshot[3].walletBalance).toBe('1');
    expect(parseFloat(snapshotsAfterAdditionalPoolSnapshot[3].totalValueUSD)).toBeGreaterThan(0);
});

test('User snapshots in the database must be picked up and synced by the sync process.', async () => {
    /*
    Scenario:
    - The user has once requested the user stats for pool1
    - We manually add a user pool snapshot to simulate that user stats on this pool have already been requested once
    - Since one user snapshot is in the database, the userBalanceSync should query the subgraph and sync all missing snapshots until now

    Behaviour under test:
    - The oldest user snapshot from three days ago for pool1 is already persisted in the db from a previous run (here mocked)
    - Sync finds that snapshot and will sync ALL from the latest until today
    - Sync will only sync snapshots of pool1, not of pool2

    Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
    - Create three snapshots for user
    - First snapshot from three days ago, where he only has 1 bpts from pool1 in his wallet
    - Seconds snapshot from one day ago, where he has 0.5 bpt from pool1 and 1 bpt from pool2 in his wallet and 1 bpt from pool1 in the farm
    - Third snapshot from today, where he has only 1 bpt from pool2 in his wallet

    Mock data in data base:
    - Create one userbalance snapshot for three days ago for the user and pool1

    */

    const newestSnapshotTimestamp = today;

    await createUserPoolBalanceSnapshot({
        id: `${poolId1}-${userAddress}-${threeDaysAgo}`,
        timestamp: threeDaysAgo,
        user: { connect: { address: userAddress } },
        pool: {
            connect: {
                id: poolId1,
            },
        },
        poolToken: poolAddress1,
        walletBalance: '1',
        farmBalance: '0',
        gaugeBalance: '0',
        totalBalance: '1',
    });

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > newestSnapshotTimestamp) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${threeDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: threeDaysAgo,
                                walletTokens: [poolAddress1],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${oneDayAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: oneDayAgo,
                                walletTokens: [poolAddress1, poolAddress2],
                                walletBalances: ['0.5', '1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [farmId1],
                                farmBalances: ['1'],
                            },
                            {
                                id: `${userAddress}-${today}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: today,
                                walletTokens: [poolAddress1, poolAddress2],
                                walletBalances: ['0', '1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    // before the sync is called, this should only return one snapshot that was manually added to the DB in this test
    const snapshotsInDbBeforeSync = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
    });
    expect(snapshotsInDbBeforeSync.length).toBe(1);

    // sync
    await userService.syncUserBalanceSnapshots();

    const snapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
    });

    // check if snapshots have been persisted (only three, one is inferred at query)
    expect(snapshotsFromDb.length).toBe(3);

    // after the sync, all 4 snapshots should be present
    const snapshotsAfterSync = await userService.getUserBalanceSnapshotsForPool(userAddress, poolId1, 'THIRTY_DAYS');
    expect(snapshotsAfterSync.length).toBe(4);

    // check if balances are calculated correctly
    expect(snapshotsAfterSync[0].walletBalance).toBe('1');
    expect(snapshotsAfterSync[0].timestamp).toBe(threeDaysAgo);
    expect(snapshotsAfterSync[1].walletBalance).toBe('1');
    expect(snapshotsAfterSync[1].timestamp).toBe(twoDaysAgo);

    expect(snapshotsAfterSync[2].walletBalance).toBe('0.5');
    expect(snapshotsAfterSync[2].farmBalance).toBe('1');
    expect(snapshotsAfterSync[2].totalBalance).toBe('1.5');
    expect(snapshotsAfterSync[2].timestamp).toBe(oneDayAgo);

    expect(snapshotsAfterSync[3].walletBalance).toBe('0');
    expect(snapshotsAfterSync[3].timestamp).toBe(today);

    const poolSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: { poolId: poolId1 },
    });

    // check if usd value, percent share of the pool and fees are correctly calculated based on poolsnapshots
    for (const userBalanceSnapshot of snapshotsAfterSync) {
        let foundPoolSnapshot = false;
        for (const poolSnapshot of poolSnapshots) {
            if (poolSnapshot.timestamp === userBalanceSnapshot.timestamp) {
                expect(userBalanceSnapshot.totalValueUSD).toBe(
                    `${poolSnapshot.sharePrice * parseFloat(userBalanceSnapshot.totalBalance)}`,
                );
                expect(userBalanceSnapshot.percentShare).toBe(
                    parseFloat(userBalanceSnapshot.totalBalance) / poolSnapshot.totalSharesNum,
                );
                expect(userBalanceSnapshot.fees24h).toBe(
                    `${
                        userBalanceSnapshot.percentShare *
                        poolSnapshot.fees24h *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                );
                foundPoolSnapshot = true;
            }
        }
        //make sure we have a pool snapshot for each user snapshot
        expect(foundPoolSnapshot).toBe(true);
    }
});

test('User has left and re-entered the pool. Make sure the sync does not persist the 0 total value snapshots in the gaps.', async () => {
    /*
    Scenario:
    - The user has once requested the user stats for pool1
    - We manually add a user pool snapshot to simulate that user stats on this pool have already been requested once
    - Since one user snapshot is in the database, the userBalanceSync should query the subgraph and sync all missing snapshots until now
    - user joined pool seven days ago, left again five days ago, joined pool and farm again three days ago, left both two days ago

    Behaviour under test:
    - The oldest user snapshot from seven days ago for pool1 is already persisted in the db from a previous run (here mocked)
    - Sync finds that snapshot and will sync ALL from the latest until today
    - Sync will not persist the 0 balance gap from four days ago and one day ago and today
    - Sync will not persist >0 balance gap from six days ago

    Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
    - Create five snapshots for user representing the above scenario

    Mock data in data base:
    - Create one userbalance snapshot for seven days ago for the user and pool1

    */

    const newestSnapshotTimestamp = oneDayAgo;

    await createUserPoolBalanceSnapshot({
        id: `${poolId1}-${userAddress}-${sevenDaysAgo}`,
        timestamp: sevenDaysAgo,
        user: { connect: { address: userAddress } },
        pool: {
            connect: {
                id: poolId1,
            },
        },
        poolToken: poolAddress1,
        walletBalance: '1',
        farmBalance: '0',
        gaugeBalance: '0',
        totalBalance: '1',
    });

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > newestSnapshotTimestamp) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${sevenDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: sevenDaysAgo,
                                walletTokens: [poolAddress1],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${fiveDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: fiveDaysAgo,
                                walletTokens: [],
                                walletBalances: [],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${threeDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: threeDaysAgo,
                                walletTokens: [poolAddress1],
                                walletBalances: ['0.5'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [farmId1],
                                farmBalances: ['1'],
                            },
                            {
                                id: `${userAddress}-${twoDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: twoDaysAgo,
                                walletTokens: [],
                                walletBalances: [],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${oneDayAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: oneDayAgo,
                                walletTokens: [],
                                walletBalances: [],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    // before the sync is called, this should only return one snapshot that was manually added to the DB in this test
    const snapshotsInDbBeforeSync = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
    });
    expect(snapshotsInDbBeforeSync.length).toBe(1);

    // sync
    await userService.syncUserBalanceSnapshots();

    const snapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
    });

    // check if snapshots have been persisted (only four, rest is inferred at query or consecutive 0 balance)
    expect(snapshotsFromDb.length).toBe(4);

    // after the sync, 5 snapshots should be present.
    //Sevendaysago, sixdaysago (inferred), fivedaysago (0 balance), fourdays ago (0 balance), threedaysago and twodaysago (0 balance)
    const snapshotsAfterSync = await userService.getUserBalanceSnapshotsForPool(userAddress, poolId1, 'THIRTY_DAYS');
    expect(snapshotsAfterSync.length).toBe(6);

    const snapshotsFromDbAfterGet = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
    });

    // check if snapshots are still 4 on db (no new added because of get)
    expect(snapshotsFromDbAfterGet.length).toBe(4);

    // check if balances are calculated correctly
    expect(snapshotsAfterSync[0].timestamp).toBe(sevenDaysAgo);
    expect(snapshotsAfterSync[0].walletBalance).toBe('1');
    expect(snapshotsAfterSync[0].totalBalance).toBe('1');
    expect(snapshotsAfterSync[1].timestamp).toBe(sixDaysAgo);
    expect(snapshotsAfterSync[1].walletBalance).toBe('1');
    expect(snapshotsAfterSync[1].totalBalance).toBe('1');

    expect(snapshotsAfterSync[2].timestamp).toBe(fiveDaysAgo);
    expect(snapshotsAfterSync[2].walletBalance).toBe('0');
    expect(snapshotsAfterSync[2].totalBalance).toBe('0');

    expect(snapshotsAfterSync[3].timestamp).toBe(fourDaysAgo);
    expect(snapshotsAfterSync[3].walletBalance).toBe('0');
    expect(snapshotsAfterSync[3].farmBalance).toBe('0');
    expect(snapshotsAfterSync[3].totalBalance).toBe('0');

    expect(snapshotsAfterSync[4].timestamp).toBe(threeDaysAgo);
    expect(snapshotsAfterSync[4].walletBalance).toBe('0.5');
    expect(snapshotsAfterSync[4].farmBalance).toBe('1');
    expect(snapshotsAfterSync[4].totalBalance).toBe('1.5');

    expect(snapshotsAfterSync[5].timestamp).toBe(twoDaysAgo);
    expect(snapshotsAfterSync[5].walletBalance).toBe('0');
    expect(snapshotsAfterSync[5].totalBalance).toBe('0');

    const poolSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: { poolId: poolId1 },
    });

    // check if usd value, percent share of the pool and fees are correctly calculated based on poolsnapshots
    for (const userBalanceSnapshot of snapshotsAfterSync) {
        let foundPoolSnapshot = false;
        for (const poolSnapshot of poolSnapshots) {
            if (poolSnapshot.timestamp === userBalanceSnapshot.timestamp) {
                expect(userBalanceSnapshot.totalValueUSD).toBe(
                    `${poolSnapshot.sharePrice * parseFloat(userBalanceSnapshot.totalBalance)}`,
                );
                expect(userBalanceSnapshot.percentShare).toBe(
                    parseFloat(userBalanceSnapshot.totalBalance) / poolSnapshot.totalSharesNum,
                );
                expect(userBalanceSnapshot.fees24h).toBe(
                    `${
                        userBalanceSnapshot.percentShare *
                        poolSnapshot.fees24h *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                );
                foundPoolSnapshot = true;
            }
        }
        //make sure we have a pool snapshot for each user snapshot
        expect(foundPoolSnapshot).toBe(true);
    }
});

test('Todays user snapshot must be gradually updated based on an updated pool snapshot.', async () => {
    /*
    Behaviour under test:
    - The user has once requested the user stats for pool1
    - Poolsnapshots are updated regularly for fees/volume, if we request user snapshot again and the poolsnapshot has changed, these changes should be reflected in the user snapshot

    Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
    - Create one snapshot for user for today where he has only 1 bpt from pool1 in his wallet
    */

    const newestSnapshotTimestamp = today;

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > newestSnapshotTimestamp) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${today}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: today,
                                walletTokens: [poolAddress1],
                                walletBalances: ['1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    const userSnapshotsBefore = await userService.getUserBalanceSnapshotsForPool(userAddress, poolId1, 'THIRTY_DAYS');
    expect(userSnapshotsBefore.length).toBe(1);

    // check if balances are calculated correctly
    expect(userSnapshotsBefore[0].walletBalance).toBe('1');
    expect(userSnapshotsBefore[0].timestamp).toBe(today);

    const poolSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: { poolId: poolId1 },
    });

    // check if usd value, percent share of the pool and fees are correctly calculated based on poolsnapshots
    for (const userBalanceSnapshot of userSnapshotsBefore) {
        let foundPoolSnapshot = false;
        for (const poolSnapshot of poolSnapshots) {
            if (poolSnapshot.timestamp === userBalanceSnapshot.timestamp) {
                expect(userBalanceSnapshot.totalValueUSD).toBe(
                    `${poolSnapshot.sharePrice * parseFloat(userBalanceSnapshot.totalBalance)}`,
                );
                expect(userBalanceSnapshot.percentShare).toBe(
                    parseFloat(userBalanceSnapshot.totalBalance) / poolSnapshot.totalSharesNum,
                );
                expect(userBalanceSnapshot.fees24h).toBe(
                    `${
                        userBalanceSnapshot.percentShare *
                        poolSnapshot.fees24h *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                );
                foundPoolSnapshot = true;
            }
        }
        //make sure we have a pool snapshot for each user snapshot
        expect(foundPoolSnapshot).toBe(true);
    }

    // update poolsnapshot of today
    await prisma.prismaPoolSnapshot.update({
        where: { id: `${poolId1}-${today}` },
        data: {
            totalLiquidity: 1000,
            volume24h: 500,
            fees24h: 5000,
            sharePrice: 10,
        },
    });

    // sync
    await userService.syncUserBalanceSnapshots();

    // check numbers again
    const userSnapshotsAfter = await userService.getUserBalanceSnapshotsForPool(userAddress, poolId1, 'THIRTY_DAYS');
    expect(userSnapshotsBefore.length).toBe(1);

    // check if balances are calculated correctly
    expect(userSnapshotsAfter[0].walletBalance).toBe('1');
    expect(userSnapshotsAfter[0].timestamp).toBe(today);

    const poolSnapshotsAfter = await prisma.prismaPoolSnapshot.findMany({
        where: { poolId: poolId1 },
    });

    // check if usd value, percent share of the pool and fees are correctly calculated based on poolsnapshots
    for (const userBalanceSnapshot of userSnapshotsAfter) {
        let foundPoolSnapshot = false;
        for (const poolSnapshot of poolSnapshotsAfter) {
            if (poolSnapshot.timestamp === userBalanceSnapshot.timestamp) {
                if (poolSnapshot.timestamp === today) {
                    expect(poolSnapshot.totalLiquidity).toBe(1000);
                    expect(poolSnapshot.volume24h).toBe(500);
                    expect(poolSnapshot.fees24h).toBe(5000);
                    expect(poolSnapshot.sharePrice).toBe(10);
                }
                expect(userBalanceSnapshot.totalValueUSD).toBe(
                    `${poolSnapshot.sharePrice * parseFloat(userBalanceSnapshot.totalBalance)}`,
                );
                expect(userBalanceSnapshot.percentShare).toBe(
                    parseFloat(userBalanceSnapshot.totalBalance) / poolSnapshot.totalSharesNum,
                );
                expect(userBalanceSnapshot.fees24h).toBe(
                    `${
                        userBalanceSnapshot.percentShare *
                        poolSnapshot.fees24h *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                );
                foundPoolSnapshot = true;
            }
        }
        //make sure we have a pool snapshot for each user snapshot
        expect(foundPoolSnapshot).toBe(true);
    }
});

test('User requests pool snapshots for Fidelio Duetto Pool. Make sure fBeets are correctly accounted for.', async () => {
    /*
    Scenario:
    - Request snapshots for the fidelio duetto pool

    Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
    - Create three snapshots for user, one with only bpt, one with btp and fbeets, and one with bpt, fbeets and staked fbeets

    Behaviour under test:
    - For fidelio duetto, we must also add fbeets wallet balance to the fidelio bpt wallet balance (adjusted with the correct BPT->fbeets ratio)
    */

    const newestSnapshotTimestamp = oneDayAgo;

    const fidelioPoolId = networkConfig.fbeets.poolId;
    const fidelioPoolAddress = networkConfig.fbeets.poolAddress;
    const fbeets = networkConfig.fbeets.address;
    const fbeetsFarm = networkConfig.fbeets.farmId;

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > newestSnapshotTimestamp) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${threeDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: threeDaysAgo,
                                walletTokens: [fidelioPoolAddress],
                                walletBalances: ['0.5'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${twoDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: twoDaysAgo,
                                walletTokens: [fidelioPoolAddress, fbeets],
                                walletBalances: ['0.5', '1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${oneDayAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: oneDayAgo,
                                walletTokens: [fidelioPoolAddress, fbeets],
                                walletBalances: ['1', '2'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [fbeetsFarm],
                                farmBalances: ['2'],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    const userBalanceSnapshots = await userService.getUserBalanceSnapshotsForPool(
        userAddress,
        fidelioPoolId,
        'THIRTY_DAYS',
    );
    expect(userBalanceSnapshots.length).toBe(4);

    const snapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
    });

    // check if snapshots have been persisted (last one in inferred)
    expect(snapshotsFromDb.length).toBe(3);

    // check if balances are calculated correctly
    expect(userBalanceSnapshots[0].timestamp).toBe(threeDaysAgo);
    expect(userBalanceSnapshots[0].walletBalance).toBe('0.5');
    expect(userBalanceSnapshots[0].totalBalance).toBe('0.5');

    expect(userBalanceSnapshots[1].timestamp).toBe(twoDaysAgo);
    expect(userBalanceSnapshots[1].walletBalance).toBe(`${FBEETS_BPT_RATIO * 1 + 0.5}`);
    expect(userBalanceSnapshots[1].totalBalance).toBe(`${FBEETS_BPT_RATIO * 1 + 0.5}`);

    expect(userBalanceSnapshots[2].timestamp).toBe(oneDayAgo);
    expect(userBalanceSnapshots[2].walletBalance).toBe(`${FBEETS_BPT_RATIO * 2 + 1}`);
    expect(userBalanceSnapshots[2].farmBalance).toBe(`${FBEETS_BPT_RATIO * 2}`);
    expect(userBalanceSnapshots[2].totalBalance).toBe(`${FBEETS_BPT_RATIO * 2 + 1 + FBEETS_BPT_RATIO * 2}`);

    expect(userBalanceSnapshots[3].timestamp).toBe(today);
    expect(userBalanceSnapshots[3].walletBalance).toBe(`${FBEETS_BPT_RATIO * 2 + 1}`);
    expect(userBalanceSnapshots[3].farmBalance).toBe(`${FBEETS_BPT_RATIO * 2}`);
    expect(userBalanceSnapshots[3].totalBalance).toBe(`${FBEETS_BPT_RATIO * 2 + 1 + FBEETS_BPT_RATIO * 2}`);

    const poolSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: { poolId: fidelioPoolId },
    });

    // check if usd value, percent share of the pool and fees are correctly calculated based on poolsnapshots
    for (const userBalanceSnapshot of userBalanceSnapshots) {
        let foundPoolSnapshot = false;
        for (const poolSnapshot of poolSnapshots) {
            if (poolSnapshot.timestamp === userBalanceSnapshot.timestamp) {
                expect(userBalanceSnapshot.percentShare).toBe(
                    parseFloat(userBalanceSnapshot.totalBalance) / poolSnapshot.totalSharesNum,
                );
                expect(userBalanceSnapshot.totalValueUSD).toBe(
                    `${poolSnapshot.sharePrice * parseFloat(userBalanceSnapshot.totalBalance)}`,
                );
                expect(userBalanceSnapshot.fees24h).toBe(
                    `${
                        userBalanceSnapshot.percentShare *
                        poolSnapshot.fees24h *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                );
                foundPoolSnapshot = true;
            }
        }
        //make sure we have a pool snapshot for each user snapshot
        expect(foundPoolSnapshot).toBe(true);
    }
});

test('Sync user snapshots for Fidelio Duetto pool. Make sure fBeets are correctly accounted for when persisting.', async () => {
    /*
    Scenario:
    - sync snapshots for fidelio pool

    Mock data for user-balance-subgraph (important that timestamps are ASC, as this is requested like this form the function under test):
    - Create three snapshots for user

    Mock data in data base:
    - Create one userbalance snapshot for three days ago for the user and fidelio pool

    Behaviour under test:
    - For fidelio duetto, we must also add fbeets wallet balance to the fidelio bpt wallet balance (adjusted with the correct BPT->fbeets ratio). The sync needs to account for that.
    */

    const newestSnapshotTimestamp = oneDayAgo;

    const fidelioPoolId = networkConfig.fbeets.poolId;
    const fidelioPoolAddress = networkConfig.fbeets.poolAddress;
    const fbeets = networkConfig.fbeets.address;
    const fbeetsFarm = networkConfig.fbeets.farmId;

    await createUserPoolBalanceSnapshot({
        id: `${fidelioPoolId}-${userAddress}-${threeDaysAgo}`,
        timestamp: threeDaysAgo,
        user: { connect: { address: userAddress } },
        pool: {
            connect: {
                id: fidelioPoolId,
            },
        },
        poolToken: fidelioPoolAddress,
        walletBalance: '1',
        farmBalance: '0',
        gaugeBalance: '0',
        totalBalance: '1',
    });

    mockServer.use(
        ...[
            graphql.query('UserBalanceSnapshots', async (req, res, ctx) => {
                const requestJson = await req.json();
                if (requestJson.variables.where.timestamp_gte > newestSnapshotTimestamp) {
                    return res(
                        ctx.data({
                            snapshots: [],
                        }),
                    );
                }
                // important, sort snapshots ASC
                return res(
                    ctx.data({
                        snapshots: [
                            {
                                id: `${userAddress}-${threeDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: threeDaysAgo,
                                walletTokens: [fidelioPoolAddress],
                                walletBalances: ['0.5'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${twoDaysAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: twoDaysAgo,
                                walletTokens: [fidelioPoolAddress, fbeets],
                                walletBalances: ['0.5', '1'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [],
                                farmBalances: [],
                            },
                            {
                                id: `${userAddress}-${oneDayAgo}`,
                                user: {
                                    id: userAddress,
                                },
                                timestamp: oneDayAgo,
                                walletTokens: [fidelioPoolAddress, fbeets],
                                walletBalances: ['1', '2'],
                                gauges: [],
                                gaugeBalances: [],
                                farms: [fbeetsFarm],
                                farmBalances: ['2'],
                            },
                        ],
                    }),
                );
            }),
        ],
    );

    const snapshotsFromDb = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
    });

    expect(snapshotsFromDb.length).toBe(1);

    // sync
    await userService.syncUserBalanceSnapshots();

    const snapshotsFromDbAfterSync = await prisma.prismaUserPoolBalanceSnapshot.findMany({
        where: {
            userAddress: userAddress,
        },
        orderBy: { timestamp: 'asc' },
    });

    // check if snapshots have been persisted (last one is inferred)
    expect(snapshotsFromDbAfterSync.length).toBe(3);

    // check if balances are calculated correctly
    expect(snapshotsFromDbAfterSync[0].timestamp).toBe(threeDaysAgo);
    expect(snapshotsFromDbAfterSync[0].walletBalance).toBe('0.5');
    expect(snapshotsFromDbAfterSync[0].totalBalance).toBe('0.5');

    expect(snapshotsFromDbAfterSync[1].timestamp).toBe(twoDaysAgo);
    expect(snapshotsFromDbAfterSync[1].walletBalance).toBe(`${FBEETS_BPT_RATIO * 1 + 0.5}`);
    expect(snapshotsFromDbAfterSync[1].totalBalance).toBe(`${FBEETS_BPT_RATIO * 1 + 0.5}`);

    expect(snapshotsFromDbAfterSync[2].timestamp).toBe(oneDayAgo);
    expect(snapshotsFromDbAfterSync[2].walletBalance).toBe(`${FBEETS_BPT_RATIO * 2 + 1}`);
    expect(snapshotsFromDbAfterSync[2].farmBalance).toBe(`${FBEETS_BPT_RATIO * 2}`);
    expect(snapshotsFromDbAfterSync[2].totalBalance).toBe(`${FBEETS_BPT_RATIO * 2 + 1 + FBEETS_BPT_RATIO * 2}`);

    const poolSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: { poolId: fidelioPoolId },
    });

    // check if usd value, percent share of the pool and fees are correctly calculated based on poolsnapshots
    for (const userBalanceSnapshot of snapshotsFromDbAfterSync) {
        let foundPoolSnapshot = false;
        for (const poolSnapshot of poolSnapshots) {
            if (poolSnapshot.timestamp === userBalanceSnapshot.timestamp) {
                expect(userBalanceSnapshot.percentShare).toBe(
                    `${parseFloat(userBalanceSnapshot.totalBalance) / poolSnapshot.totalSharesNum}`,
                );
                expect(userBalanceSnapshot.totalValueUSD).toBe(
                    `${poolSnapshot.sharePrice * parseFloat(userBalanceSnapshot.totalBalance)}`,
                );
                expect(userBalanceSnapshot.fees24h).toBe(
                    `${
                        parseFloat(userBalanceSnapshot.percentShare) *
                        poolSnapshot.fees24h *
                        (1 - networkConfig.balancer.swapProtocolFeePercentage)
                    }`,
                );
                foundPoolSnapshot = true;
            }
        }
        //make sure we have a pool snapshot for each user snapshot
        expect(foundPoolSnapshot).toBe(true);
    }
});
