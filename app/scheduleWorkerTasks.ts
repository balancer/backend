import * as Sentry from '@sentry/node';
import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';
import { blocksSubgraphService } from '../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
import { tokenService } from '../modules/token/token.service';
import { balancerSdk } from '../modules/balancer-sdk/src/balancer-sdk';
import { env } from './env';
import { runWithMinimumInterval } from '../modules/util/scheduling';
import { poolService } from '../modules/pool/pool.service';
import { beetsService } from '../modules/beets/beets.service';
import { jsonRpcProvider } from '../modules/util/ethers';
import { userService } from '../modules/user/user.service';
import _ from 'lodash';
import createExpressApp, { Express } from 'express';
import { prisma } from '../modules/util/prisma-client';

const ONE_MINUTE_IN_MS = 60000;
const TWO_MINUTES_IN_MS = 120000;
const FIVE_MINUTES_IN_MS = 300000;
const TEN_MINUTES_IN_MS = 600000;

const asyncCallWithTimeout = async (fn: () => Promise<any>, timeLimit: number) => {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise((_resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Call timed out!')), timeLimit);
    });

    return Promise.race([fn(), timeoutPromise]).then((result) => {
        clearTimeout(timeoutHandle);
        return result;
    });
};

function scheduleJob(
    cronExpression: string,
    taskName: string,
    timeout: number,
    func: () => Promise<void>,
    runOnStartup: boolean = false,
) {
    if (runOnStartup) {
        func().catch((error) => {
            Sentry.captureException(error, (scope) => scope.setContext(taskName, { isStartup: true }));
            console.log(`error on initial run ${taskName}`);
        });
    }

    let running = false;
    cron.schedule(cronExpression, async () => {
        if (running) {
            console.log(`${taskName} already running, skipping call...`);
            return;
        }

        const transaction = Sentry.startTransaction({ name: taskName });
        Sentry.configureScope((scope) => scope.setSpan(transaction));
        // Sentry.withScope((scope) => {
        //     scope.setSpan(transaction);
        //     running = true;
        //     console.log(`Start ${taskName}...`);
        //     console.time(taskName);
        asyncCallWithTimeout(func, timeout)
            .catch((error) => {
                console.log(`Error ${taskName}`, error);
                Sentry.captureException(error);
            })
            .finally(() => {
                running = false;
                transaction.finish();
                console.timeEnd(taskName);
                console.log(`${taskName} done`);
            });
        // });
    });
}

function addRpcListener(taskName: string, eventType: string, timeout: number, listener: () => Promise<void>) {
    let running = false;

    jsonRpcProvider.on(
        eventType,
        _.debounce(async () => {
            if (running) {
                console.log(`${taskName} already running, skipping call...`);
                return;
            }
            const transaction = Sentry.startTransaction({ name: taskName });
            Sentry.withScope((scope) => {
                scope.setSpan(transaction);

                running = true;
                console.log(`Start ${taskName}...`);
                console.time(taskName);
                asyncCallWithTimeout(listener, timeout)
                    .catch((error) => {
                        console.log(`Error ${taskName}`, error);
                        Sentry.captureException(error);
                    })
                    .finally(() => {
                        transaction.finish();
                        running = false;
                        console.timeEnd(taskName);
                    });
            });
        }, 250),
    );
}

export function scheduleWorkerTasks() {
    //every 20 seconds
    scheduleJob('*/20 * * * * *', 'loadTokenPrices', ONE_MINUTE_IN_MS, async () => {
        //await tokenPriceService.cacheTokenPrices();

        await tokenService.loadTokenPrices();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'cacheBeetsPrice', TWO_MINUTES_IN_MS, async () => {
        await tokenPriceService.cacheBeetsPrice();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'poolUpdateLiquidityValuesForAllPools', TWO_MINUTES_IN_MS, async () => {
        await poolService.updateLiquidityValuesForAllPools();
        await poolService.updatePoolAprs();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'loadOnChainDataForPoolsWithActiveUpdates', TWO_MINUTES_IN_MS, async () => {
        await poolService.loadOnChainDataForPoolsWithActiveUpdates();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'syncNewPoolsFromSubgraph', TWO_MINUTES_IN_MS, async () => {
        await poolService.syncNewPoolsFromSubgraph();
    });

    //every 3 minutes
    scheduleJob('*/3 * * * *', 'poolSyncSanityPoolData', FIVE_MINUTES_IN_MS, async () => {
        await poolService.syncSanityPoolData();
    });

    //every 5 minutes
    scheduleJob('*/5 * * * *', 'syncTokensFromPoolTokens', TEN_MINUTES_IN_MS, async () => {
        await tokenService.syncSanityData();
    });

    //every 5 minutes
    scheduleJob('*/5 * * * *', 'updateLiquidity24hAgoForAllPools', TEN_MINUTES_IN_MS, async () => {
        await poolService.updateLiquidity24hAgoForAllPools();
    });

    scheduleJob('*/5 * * * *', 'syncFbeetsRatio', ONE_MINUTE_IN_MS, async () => {
        await beetsService.syncFbeetsRatio();
    });

    scheduleJob(
        '*/5 * * * *',
        'cacheAverageBlockTime',
        TEN_MINUTES_IN_MS,
        async () => {
            await blocksSubgraphService.cacheAverageBlockTime();
        },
        true,
    );

    //once a minute
    scheduleJob('* * * * *', 'sor-reload-graph', TWO_MINUTES_IN_MS, async () => {
        await balancerSdk.sor.reloadGraph();
    });

    //every minute
    scheduleJob('*/1 * * * *', 'syncTokenDynamicData', TEN_MINUTES_IN_MS, async () => {
        await tokenService.syncTokenDynamicData();
    });

    //every 5 minutes
    scheduleJob('*/5 * * * *', 'syncStakingForPools', ONE_MINUTE_IN_MS, async () => {
        await poolService.syncStakingForPools();
    });

    scheduleJob('*/30 * * * * *', 'cache-protocol-data', TWO_MINUTES_IN_MS, async () => {
        await beetsService.cacheProtocolData();
    });

    //once an hour at minute 1
    scheduleJob('1 * * * *', 'syncLatestSnapshotsForAllPools', TEN_MINUTES_IN_MS, async () => {
        await poolService.syncLatestSnapshotsForAllPools();
    });

    //every 20 minutes
    scheduleJob('*/20 * * * *', 'updateLifetimeValuesForAllPools', TEN_MINUTES_IN_MS, async () => {
        await poolService.updateLifetimeValuesForAllPools();
    });

    /*
    //every five minutes
    scheduleJob(
        '*!/5 * * * *',
        'cache-historical-token-price',
        async () => {
            await tokenPriceService.cacheHistoricalTokenPrices();
        },
        true,
    );

    scheduleJob('*!/5 * * * *', 'cache-historical-nested-bpt-prices', async () => {
        await tokenPriceService.cacheHistoricalNestedBptPrices();
    });


    scheduleJob('*!/5 * * * *', 'cache-fbeets-apr', async () => {
        await beetsBarService.cacheFbeetsApr();
    });

    scheduleJob('*!/5 * * * *', 'cache-tokens', async () => {
        await tokenService.cacheTokenDefinitions();
    });

    //every 5 seconds
    scheduleJob('*!/5 * * * * *', 'cache-beets-farms', async () => {
        await beetsFarmService.cacheBeetsFarms();
    });

    scheduleJob('*!/30 * * * * *', 'cache-beets-farms', async () => {
        await beetsFarmService.cacheBeetsFarms();
    });

    //every 10 seconds
    scheduleJob('*!/10 * * * * *', 'cache-user-pool-shares', async () => {
        await balancerService.cacheUserPoolShares();
    });

    //every 30 seconds
    scheduleJob('*!/30 * * * * *', 'cache-beets-price', async () => {
        await tokenPriceService.cacheBeetsPrice();
    });

    scheduleJob('*!/10 * * * * *', 'cache-beets-farm-users', async () => {
        await beetsFarmService.cacheBeetsFarmUsers();
    });

    scheduleJob('*!/30 * * * * *', 'cache-past-pools', async () => {
        await balancerService.cachePastPools();
    });

    scheduleJob('*!/30 * * * * *', 'cache-portfolio-pools-data', async () => {
        const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
        await balancerSubgraphService.cachePortfolioPoolsData(parseInt(previousBlock.number));
    });

    scheduleJob('5 0 * * *', 'cache-daily-data', async () => {
        console.log('Starting new cron to cache daily data.');
        const timestamp = moment.tz('GMT').startOf('day').unix();

        //retry loop in case of timeouts from the subgraph
        for (let i = 0; i < 10; i++) {
            try {
                await portfolioService.cacheRawDataForTimestamp(timestamp);
                console.log('Finished cron to cache daily data.');
                break;
            } catch (e) {
                console.log(
                    `Error happened during daily caching <${timestamp}>. Running again for the ${i}th time.`,
                    e,
                );
                await sleep(5000);
            }
        }
    });

    tokenPriceService
        .cacheBeetsPrice()
        .then(() =>
            beetsService
                .cacheProtocolData()
                .catch((error) => console.log('Error caching initial protocol data', error)),
        )
        .catch();
    beetsFarmService
        .cacheBeetsFarmUsers(true)
        .catch((error) => console.log('Error caching initial beets farm users', error));
*/
    console.log('scheduled cron jobs');

    console.log('start pool sync');

    runWithMinimumInterval('syncChangedPools', Number(env.POOL_SYNC_INTERVAL_MS), async () => {
        await poolService.syncChangedPools();
    }).catch((error) => console.log('Error starting syncChangedPools...', error));

    addRpcListener('userSyncWalletBalancesForAllPools', 'block', ONE_MINUTE_IN_MS, async () => {
        await userService.syncWalletBalancesForAllPools();
    });

    addRpcListener('userSyncStakedBalances', 'block', ONE_MINUTE_IN_MS, async () => {
        await userService.syncStakedBalances();
    });
}

export function addWorkerRoutes(app: Express) {
    app.post('/load-token-prices', async (req, res, next) => {
        try {
            console.log('Load token prices');
            await tokenService.loadTokenPrices();
            console.log('Load token prices done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });

    app.post('/load-beets-price', async (req, res, next) => {
        try {
            console.log('Load beets price');
            await tokenPriceService.cacheBeetsPrice();
            console.log('Load beets price done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/update-liquidity-for-all-pools', async (req, res, next) => {
        try {
            console.log('Update liquidity for all pools');
            await poolService.updateLiquidityValuesForAllPools();
            console.log('Update liquidity for all pools done');
            res.sendStatus(200);
        } catch (error) {
            console.log(error);
            next(error);
        }
    });
    app.post('/update-pool-apr', async (req, res, next) => {
        try {
            console.log('Update pool apr');
            await poolService.updatePoolAprs();
            console.log('Update pool apr done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/load-on-chain-data-for-pools-with-active-updates', async (req, res, next) => {
        try {
            console.log('Load on chain data for pools with active updates');
            await poolService.loadOnChainDataForPoolsWithActiveUpdates();
            console.log('Load on chain data for pools with active updates done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-new-pools-from-subgraph', async (req, res, next) => {
        try {
            console.log('Sync new pools from subgraph');
            await poolService.syncNewPoolsFromSubgraph();
            console.log('Sync new pools from subgraph done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-sanity-pool-data', async (req, res, next) => {
        try {
            console.log('Sync sanity pool data');
            await poolService.syncSanityPoolData();
            console.log('Sync sanity pool data done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-tokens-from-pool-tokens', async (req, res, next) => {
        try {
            console.log('Sync tokens from pool tokens');
            await tokenService.syncSanityData();
            console.log('Sync tokens from pool tokens done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/update-liquidity-24h-ago-for-all-pools', async (req, res, next) => {
        try {
            console.log('Update liquidity 24h ago for all pools');
            await poolService.updateLiquidity24hAgoForAllPools();
            console.log('Update liquidity 24h ago for all pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-fbeets-ratio', async (req, res, next) => {
        try {
            console.log('Sync fbeets ratio');
            await beetsService.syncFbeetsRatio();
            console.log('Sync fbeets ratio done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/cache-average-block-time', async (req, res, next) => {
        try {
            console.log('Cache average block time');
            await blocksSubgraphService.cacheAverageBlockTime();
            console.log('Cache average block time done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sor-reload-graph', async (req, res, next) => {
        try {
            console.log('SOR reload graph');
            await balancerSdk.sor.reloadGraph();
            console.log('SOR reload graph done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-token-dynamic-data', async (req, res, next) => {
        try {
            console.log('Sync token dynamic data');
            await tokenService.syncTokenDynamicData();
            console.log('Sync token dynamic data done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-staking-for-pools', async (req, res, next) => {
        try {
            console.log('Sync staking for pools');
            await poolService.syncStakingForPools();
            console.log('Sync staking for pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/cache-protocol-data', async (req, res, next) => {
        try {
            console.log('Cache protocol data');
            await beetsService.cacheProtocolData();
            console.log('Cache protocol data done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-latest-snapshots-for-all-pools', async (req, res, next) => {
        try {
            console.log('Sync latest snapshots for all pools');
            await poolService.syncLatestSnapshotsForAllPools();
            console.log('Sync latest snapshots for all pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/update-lifetime-values-for-all-pools', async (req, res, next) => {
        try {
            console.log('Update lifetime values for all pools');
            await poolService.updateLifetimeValuesForAllPools();
            console.log('Update lifetime values for all pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/sync-changed-pools', async (req, res, next) => {
        try {
            console.log('Sync changed pools');
            await poolService.syncChangedPools();
            console.log('Sync changed pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/user-sync-wallet-balances-for-all-pools', async (req, res, next) => {
        try {
            console.log('User sync wallet balances for all pools');
            await userService.syncWalletBalancesForAllPools();
            console.log('User sync wallet balances for all pools done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
    app.post('/user-sync-staked-balances', async (req, res, next) => {
        try {
            console.log('User sync staked balances');
            await userService.syncStakedBalances();
            console.log('User sync staked balances done');
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    });
}
