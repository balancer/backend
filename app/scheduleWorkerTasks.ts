import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';
import { blocksSubgraphService } from '../modules/blocks-subgraph/blocks-subgraph.service';
import { balancerSubgraphService } from '../modules/balancer-subgraph/balancer-subgraph.service';
import { balancerService } from '../modules/balancer/balancer.service';
import { beetsService } from '../modules/beets/beets.service';
import { beetsBarService } from '../modules/beets-bar-subgraph/beets-bar.service';
import { portfolioService } from '../modules/portfolio/portfolio.service';
import moment from 'moment-timezone';
import { sleep } from '../modules/util/promise';
import { tokenService } from '../modules/token/token.service';
// import { beetsFarmService } from '../modules/beets/beets-farm.service';
import { balancerSdk } from '../modules/balancer-sdk/src/balancer-sdk';
import { env } from './env';

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
    scheduleJob('*/20 * * * * *', 'cache-token-prices', async () => {
        await tokenPriceService.cacheTokenPrices();
    });

    //every five minutes
    scheduleJob(
        '*/5 * * * *',
        'cache-historical-token-price',
        async () => {
            await tokenPriceService.cacheHistoricalTokenPrices();
        },
        true,
    );

    //every five minutes
    scheduleJob('*/5 * * * *', 'cache-historical-nested-bpt-prices', async () => {
        await tokenPriceService.cacheHistoricalNestedBptPrices();
    });

    //every five minutes
    scheduleJob('*/5 * * * *', 'cache-average-block-time', async () => {
        await blocksSubgraphService.cacheAverageBlockTime();
    });

    //every five minutes
    scheduleJob('*/5 * * * *', 'cache-tokens', async () => {
        await tokenService.cacheTokens();
    });

    //every 5 seconds
    scheduleJob('*/5 * * * * *', 'cache-balancer-pools', async () => {
        await balancerService.cachePools();
    });

    //once a minute
    scheduleJob('* * * * *', 'sor-reload-graph', async () => {
        await balancerSdk.sor.reloadGraph();
    });

    //every 10 seconds
    scheduleJob('*/10 * * * * *', 'cache-user-pool-shares', async () => {
        await balancerService.cacheUserPoolShares();
    });

    //every 30 seconds
    scheduleJob('*/30 * * * * *', 'cache-past-pools', async () => {
        await balancerService.cachePastPools();
    });

    //do not run these crons on OP
    // if (env.CHAIN_ID !== '10') {
    //     //every five minutes
    //     scheduleJob('*/5 * * * *', 'cache-fbeets-apr', async () => {
    //         await beetsBarService.cacheFbeetsApr();
    //     });

    //     //every 5 seconds
    //     scheduleJob('*/5 * * * * *', 'cache-beets-farms', async () => {
    //         await beetsFarmService.cacheBeetsFarms();
    //     });

    //     //every 30 seconds
    //     scheduleJob('*/30 * * * * *', 'cache-beets-price', async () => {
    //         await tokenPriceService.cacheBeetsPrice();
    //     });

    //     //every 10 seconds
    //     scheduleJob('*/10 * * * * *', 'cache-beets-farm-users', async () => {
    //         await beetsFarmService.cacheBeetsFarmUsers();
    //     });

    //     //every 30 seconds
    //     //TODO uses beets price
    //     scheduleJob('*/30 * * * * *', 'cache-protocol-data', async () => {
    //         await beetsService.cacheProtocolData();
    //     });

    //     //every 30 seconds
    //     scheduleJob('*/30 * * * * *', 'cache-portfolio-pools-data', async () => {
    //         const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
    //         await balancerSubgraphService.cachePortfolioPoolsData(parseInt(previousBlock.number));
    //     });

    //     scheduleJob('5 0 * * *', 'cache-daily-data', async () => {
    //         console.log('Starting new cron to cache daily data.');
    //         const timestamp = moment.tz('GMT').startOf('day').unix();

    //         //retry loop in case of timeouts from the subgraph
    //         for (let i = 0; i < 10; i++) {
    //             try {
    //                 await portfolioService.cacheRawDataForTimestamp(timestamp);
    //                 console.log('Finished cron to cache daily data.');
    //                 break;
    //             } catch (e) {
    //                 console.log(
    //                     `Error happened during daily caching <${timestamp}>. Running again for the ${i}th time.`,
    //                     e,
    //                 );
    //                 await sleep(5000);
    //             }
    //         }
    //     });

    //     tokenPriceService
    //         .cacheBeetsPrice()
    //         .then(() =>
    //             beetsService
    //                 .cacheProtocolData()
    //                 .catch((error) => console.log('Error caching initial protocol data', error)),
    //         )
    //         .catch();

    //     beetsFarmService
    //         .cacheBeetsFarmUsers(true)
    //         .catch((error) => console.log('Error caching initial beets farm users', error));
    // }

    console.log('scheduled cron jobs');
}
