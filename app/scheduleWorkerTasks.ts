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
            await tokenPriceService.cacheTokenPrices();
        } catch (e) {}
    });

    //every five minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            await tokenPriceService.cacheHistoricalTokenPrices();
        } catch (e) {}
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            await tokenPriceService.cacheHistoricalNestedBptPrices();
        } catch (e) {}
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            await tokenService.cacheTokens();
        } catch (e) {}
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            await beetsBarService.cacheFbeetsApr();
        } catch (e) {}
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            await blocksSubgraphService.cacheAverageBlockTime();
        } catch (e) {}
    });

    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            await blocksSubgraphService.cacheBlockFrom24HoursAgo();
        } catch (e) {}
    });

    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            await balancerService.cachePools();
            await beetsFarmService.cacheBeetsFarms();

            await balancerSdk.sor.fetchPools();
        } catch (e) {}
    });

    //every 10 seconds
    cron.schedule('*/10 * * * * *', async () => {
        try {
            await balancerService.cacheUserPoolShares();
        } catch (e) {}
    });

    //once a minute
    cron.schedule('* * * * *', async () => {
        await balancerSdk.sor.reloadGraph();
    });

    //every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        try {
            await beetsFarmService.cacheBeetsFarms();
        } catch (e) {}
    });

    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            await beetsFarmService.cacheBeetsFarmUsers();
        } catch (e) {}
    });

    //every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        try {
            await tokenPriceService.cacheBeetsPrice();
            const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
            await balancerSubgraphService.cachePortfolioPoolsData(parseInt(previousBlock.number));
            await balancerService.cachePastPools();
            await beetsService.cacheProtocolData();
        } catch (e) {}
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

    tokenPriceService.cacheHistoricalTokenPrices().catch();
    tokenPriceService
        .cacheBeetsPrice()
        .then(() => beetsService.cacheProtocolData().catch())
        .catch();

    console.log('scheduled cron jobs');
}
