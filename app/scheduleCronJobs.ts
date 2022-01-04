import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';
import { blocksSubgraphService } from '../modules/blocks-subgraph/blocks-subgraph.service';
import { balancerSubgraphService } from '../modules/balancer-subgraph/balancer-subgraph.service';
import { balancerService } from '../modules/balancer/balancer.service';
import { beetsService } from '../modules/beets/beets.service';
import { beetsBarService } from '../modules/beets-bar-subgraph/beets-bar.service';

export function scheduleCronJobs() {
    //every 20 seconds
    cron.schedule('*/45 * * * * *', async () => {
        try {
            await tokenPriceService.cacheTokenPrices();
        } catch (e) {}
    });

    //every five minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            await tokenPriceService.cacheHistoricalTokenPrices();
            await beetsService.cacheBeetsFarms();
            await beetsBarService.cacheFbeetsApr();
            await blocksSubgraphService.cacheAverageBlockTime();
        } catch (e) {}
    });

    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            await balancerService.cachePools();
        } catch (e) {}
    });

    //every 3 seconds
    cron.schedule('*/3 * * * * *', async () => {
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

    tokenPriceService.cacheHistoricalTokenPrices().catch();
    console.log('scheduled cron jobs');
}
