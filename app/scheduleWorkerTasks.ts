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
        func().catch(() => {
            console.log(`error on initial run ${taskName}`);
        });
    }

    let running = false;
    cron.schedule(cronExpression, async () => {
        if (running) {
            console.log(`${taskName} already running, skipping call...`);
            return;
        }

        try {
            running = true;
            console.log(`Start ${taskName}...`);
            console.time(taskName);
            await asyncCallWithTimeout(func, timeout);
            console.log(`${taskName} done`);
        } catch (e) {
            console.log(`Error ${taskName}`, e);
        } finally {
            console.timeEnd(taskName);
            running = false;
        }
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

            try {
                running = true;
                console.log(`Start ${taskName}...`);
                console.time(taskName);
                await asyncCallWithTimeout(listener, timeout);
                console.log(`${taskName} done`);
            } catch (e) {
                console.log(`Error ${taskName}`, e);
            } finally {
                console.timeEnd(taskName);
                running = false;
            }
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

    runWithMinimumInterval(Number(env.POOL_SYNC_INTERVAL_MS), async () => {
        await poolService.syncChangedPools();
    }).catch((error) => console.log('Error starting syncChangedPools...', error));

    addRpcListener('userSyncWalletBalancesForAllPools', 'block', ONE_MINUTE_IN_MS, async () => {
        await userService.syncWalletBalancesForAllPools();
    });

    addRpcListener('userSyncStakedBalances', 'block', ONE_MINUTE_IN_MS, async () => {
        await userService.syncStakedBalances();
    });
}
