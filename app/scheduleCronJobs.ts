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

export function scheduleCronJobs() {
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
            await beetsService.cacheBeetsFarms();
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
            await balancerService.cachePools();
        } catch (e) {}
    });

    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            await beetsService.cacheBeetsFarmUsers();
        } catch (e) {}
    });

    //every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        try {
            const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
            await balancerSubgraphService.cachePortfolioPoolsData(parseInt(previousBlock.number));
            await balancerService.cachePastPools();
            await beetsService.cacheProtocolData();
        } catch (e) {}
    });

    //once a day
    cron.schedule('5 0 * * *', async () => {
        try {
            const timestamp = moment.tz('GMT').startOf('day').unix();

            //retry loop in case of timeouts from the subgraph
            for (let i = 0; i < 10; i++) {
                try {
                    await portfolioService.cacheRawDataForTimestamp(timestamp);
                    break;
                } catch {
                    await sleep(5000);
                }
            }
        } catch (e) {}
    });

    tokenPriceService.cacheHistoricalTokenPrices().catch();
    console.log('scheduled cron jobs');
}
