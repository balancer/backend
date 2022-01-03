import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';
import { blocksSubgraphService } from '../modules/blocks-subgraph/blocks-subgraph.service';
import { balancerSubgraphService } from '../modules/balancer-subgraph/balancer-subgraph.service';
import { balancerService } from '../modules/balancer/balancer.service';
import { beetsService } from '../modules/beets/beets.service';

export function scheduleCronJobs() {
    //every 20 seconds
    cron.schedule('*/45 * * * * *', async () => {
        try {
            console.time('cache token prices');
            await tokenPriceService.cacheTokenPrices();
            console.timeEnd('cache token prices');
        } catch (e) {}
    });

    //every five minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            console.time('cacheHistoricalTokenPrices');
            await tokenPriceService.cacheHistoricalTokenPrices();
            console.timeEnd('cacheHistoricalTokenPrices');
            console.time('cacheBeetsFarms');
            await beetsService.cacheBeetsFarms();
            console.timeEnd('cacheBeetsFarms');
        } catch (e) {}
    });

    //every 5 seconds
    cron.schedule('*/30 * * * * *', async () => {
        try {
            console.time('cachePools');
            await balancerService.cachePools();
            console.timeEnd('cachePools');
        } catch (e) {}
    });

    //every 3 seconds
    cron.schedule('*/15 * * * * *', async () => {
        try {
            console.time('cacheBeetsFarmUsers');
            await beetsService.cacheBeetsFarmUsers();
            console.timeEnd('cacheBeetsFarmUsers');
        } catch (e) {}
    });

    //every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        try {
            console.time('cachePortfolioPoolsData');
            const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
            await balancerSubgraphService.cachePortfolioPoolsData(parseInt(previousBlock.number));
            console.timeEnd('cachePortfolioPoolsData');

            console.time('cachePastPools');
            await balancerService.cachePastPools();
            console.timeEnd('cachePastPools');

            console.time('cacheProtocolData');
            await beetsService.cacheProtocolData();
            console.timeEnd('cacheProtocolData');
        } catch (e) {}
    });

    tokenPriceService.cacheHistoricalTokenPrices().catch();
    console.log('scheduled cron jobs');
}
