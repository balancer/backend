import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';
import { blocksSubgraphService } from '../modules/blocks-subgraph/blocks-subgraph.service';
import { balancerService } from '../modules/balancer-subgraph/balancer.service';
import { poolsService } from '../modules/balancer/balancer.service';

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

    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            await poolsService.cachePools();
        } catch (e) {}
    });

    //every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        try {
            const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
            await balancerService.cachePortfolioPoolsData(parseInt(previousBlock.number));

            await poolsService.cachePastPools();
        } catch (e) {}
    });

    tokenPriceService.cacheHistoricalTokenPrices().catch();
    console.log('scheduled cron jobs');
}
