import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';
import { blocksSubgraphService } from '../modules/subgraphs/blocks-subgraph/blocks-subgraph.service';
import { balancerSubgraphService } from '../modules/subgraphs/balancer-subgraph/balancer-subgraph.service';
import { balancerService } from '../modules/balancer/balancer.service';
import { beetsService } from '../modules/beets/beets.service';
import { beetsBarService } from '../modules/subgraphs/beets-bar-subgraph/beets-bar.service';
import { portfolioService } from '../modules/portfolio/portfolio.service';
import moment from 'moment-timezone';
import { sleep } from '../modules/util/promise';
import { tokenService } from '../modules/token/token.service';
import { beetsFarmService } from '../modules/beets/beets-farm.service';
import { balancerSdk } from '../modules/balancer-sdk/src/balancer-sdk';
import { env } from './env';
import { runWithMinimumInterval } from '../modules/util/scheduling';
import { poolService } from '../modules/pool/pool.service';

function scheduleJob(
    cronExpression: string,
    taskName: string,
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
            await func();
            console.log(`${taskName} done`);
            console.timeEnd(taskName);
        } catch (e) {
            console.log(`Error ${taskName}`, e);
        }

        running = false;
    });
}

export function scheduleWorkerTasks() {
    //every 20 seconds
    scheduleJob('*/20 * * * * *', 'loadTokenPrices', async () => {
        //await tokenPriceService.cacheTokenPrices();

        await tokenService.loadTokenPrices();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'cacheBeetsPrice', async () => {
        await tokenPriceService.cacheBeetsPrice();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'poolUpdateLiquidityValuesForAllPools', async () => {
        await poolService.updateLiquidityValuesForAllPools();
        await poolService.updatePoolAprs();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'loadOnChainDataForPoolsWithActiveUpdates', async () => {
        await poolService.loadOnChainDataForPoolsWithActiveUpdates();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'syncNewPoolsFromSubgraph', async () => {
        await poolService.syncNewPoolsFromSubgraph();
    });

    //every 3 minutes
    scheduleJob('*/3 * * * *', 'poolSyncSanityPoolData', async () => {
        await poolService.syncSanityPoolData();
    });

    //every 5 minutes
    scheduleJob('*/5 * * * *', 'syncTokensFromPoolTokens', async () => {
        await tokenService.syncSanityData();
    });

    scheduleJob(
        '*/5 * * * *',
        'cacheAverageBlockTime',
        async () => {
            await blocksSubgraphService.cacheAverageBlockTime();
        },
        true,
    );

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
    scheduleJob('*!/5 * * * * *', 'cache-balancer-pools', async () => {
        await balancerService.cachePools();
    });

    //every 5 seconds
    scheduleJob('*!/5 * * * * *', 'cache-beets-farms', async () => {
        await beetsFarmService.cacheBeetsFarms();
    });

    scheduleJob('*!/30 * * * * *', 'cache-beets-farms', async () => {
        await beetsFarmService.cacheBeetsFarms();
    });

    //once a minute
    scheduleJob('* * * * *', 'sor-reload-graph', async () => {
        await balancerSdk.sor.reloadGraph();
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

    scheduleJob('*!/30 * * * * *', 'cache-protocol-data', async () => {
        await beetsService.cacheProtocolData();
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
}
