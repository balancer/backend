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
import { beetsFarmService } from '../modules/beets/beets-farm.service';
import { balancerSdk } from '../modules/balancer-sdk/src/balancer-sdk';

export function scheduleWorkerTasks() {
    //every 20 seconds
    cron.schedule('*/20 * * * * *', async () => {
        try {
            console.log('Start caching token prices...');
            console.time('token-price-cache');
            await tokenPriceService.cacheTokenPrices();
            console.log('Caching token prices done');
            console.timeEnd('token-price-cache');
        } catch (e) {
            console.log('Error caching token prices', e);
        }
    });

    //every five minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('Cache historycal token prices...');
            console.time('history-token-price-cache');
            await tokenPriceService.cacheHistoricalTokenPrices();
            console.log('Caching historycal token prices done');
            console.timeEnd('history-token-price-cache');
        } catch (e) {
            console.log('Error caching historycal token prices', e);
        }
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('Cache historical nested bpt prices...');
            console.time('cache-historical-nested-bpt-prices');
            await tokenPriceService.cacheHistoricalNestedBptPrices();
            console.log('Cache historical nested bpt prices done');
            console.timeEnd('cache-historical-nested-bpt-prices');
        } catch (e) {
            console.log('Error caching historical nested bpt prices', e);
        }
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('Cache tokens...');
            console.time('cache-tokens');
            await tokenService.cacheTokens();
            console.log('Cache tokens done');
            console.timeEnd('cache-tokens');
        } catch (e) {
            console.log('Error caching tokens', e);
        }
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            await beetsBarService.cacheFbeetsApr();
        } catch (e) {}
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('Cache average block time...');
            console.time('cache-average-block-time');
            await blocksSubgraphService.cacheAverageBlockTime();
            console.log('Cache average block time done');
            console.timeEnd('cache-average-block-time');
        } catch (e) {
            console.log('Error caching average block time', e);
        }
    });
    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            console.log('Cache beets farms');
            const label = `cache-beets-farms-${moment().format('YYYY-MM-DD-HH-mm-ss')}`;
            console.time(label);
            await beetsFarmService.cacheBeetsFarms();
            console.log('Cache beets farms done');
            console.timeEnd(label);
        } catch (e) {
            console.log('Error caching beets farms', e);
        }
    });

    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            console.log('Cache pools...');
            const label = `cache-pools-${moment().format('YYYY-MM-DD-HH-mm-ss')}}`;
            console.time(label);
            await balancerService.cachePools();
            console.log('Cache pools done');
            console.timeEnd(label);
        } catch (e) {
            console.log('Error caching pools, farms & sor pools', e);
        }
    });

    //every 10 seconds
    cron.schedule('*/10 * * * * *', async () => {
        try {
            console.log('Cache user pool shares...');
            const label = `cache-user-pool-shares-${moment().format('YYYY-MM-DD-HH-mm-ss')}}`;
            console.time(label);
            await balancerService.cacheUserPoolShares();
            console.log('Cache user pool share done');
            console.timeEnd(label);
        } catch (e) {
            console.log('Error caching user pool shares', e);
        }
    });

    //once a minute
    cron.schedule('* * * * *', async () => {
        console.log('SOR Reload graph');
        console.time('sor-reload-graph');
        await balancerSdk.sor.reloadGraph();
        console.log('SOR Reload graph done');
        console.timeEnd('sor-reload-graph');
    });

    //every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        try {
            console.log('Cache beets farms...');
            console.time('cache-beets-farms');
            await beetsFarmService.cacheBeetsFarms();
            console.log('Cache beets farms done');
            console.timeEnd('cache-beets-farms');
        } catch (e) {
            console.log('Error caching beets farms', e);
        }
    });

    //every 10 seconds
    cron.schedule('*/10 * * * * *', async () => {
        try {
            console.log('Cache beets farm users...');
            const label = `cache-beets-farm-users-${moment().format('YYYY-MM-DD-HH-mm-ss')}`;
            console.time('Cache beets farm users...');
            await beetsFarmService.cacheBeetsFarmUsers();
            console.log('Cache beets farm users done');
            console.timeEnd('Cache beets farm users...');
        } catch (e) {
            console.log('Error caching beets farm users', e);
        }
    });

    //every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        try {
            console.log('Cache beets price...');
            console.time('cache-beets-price');
            await tokenPriceService.cacheBeetsPrice();
            console.log('Cache beets price done');
            console.timeEnd('cache-beets-price');
        } catch (e) {
            console.log('Error caching beets price', e);
        }
        try {
            console.log('Cache portfolio pools data...');
            console.time('cache-portfolio-pools-data');
            const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
            await balancerSubgraphService.cachePortfolioPoolsData(parseInt(previousBlock.number));
            console.log('Cache portfolio pools data done');
            console.timeEnd('cache-portfolio-pools-data');
        } catch (e) {
            console.log('Error caching portfolio pools data', e);
        }

        try {
            console.log('Cache past pools...');
            console.time('cache-past-pools');
            await balancerService.cachePastPools();
            console.log('Cache past pools done');
            console.timeEnd('cache-past-pools');
        } catch (e) {
            console.log('Error caching past pools', e);
        }

        try {
            console.log('Cache protocol data...');
            console.time('cache-protocol-data');
            await beetsService.cacheProtocolData();
            console.log('Cache protocol data done');
            console.timeEnd('cache-protocol-data');
        } catch (e) {
            console.log('Error caching protocol data', e);
        }
    });

    //once a day
    cron.schedule('5 0 * * *', async () => {
        console.log('Starting new cron to cache daily data.');
        try {
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
        } catch (e) {
            console.log(`Fatal error happened during daily caching.`, e);
        }
    });

    tokenPriceService
        .cacheHistoricalTokenPrices()
        .catch((error) => console.log('Error caching initial token prices', error));
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

    console.log('scheduled cron jobs');
}
