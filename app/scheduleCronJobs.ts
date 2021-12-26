import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';
import { blocksSubgraphService } from '../modules/blocks-subgraph/blocks-subgraph.service';
import { balancerService } from '../modules/balancer-subgraph/balancer.service';
import { poolsService } from '../modules/pools/pools.service';

export function scheduleCronJobs() {
    //every 20 seconds
    cron.schedule('*/20 * * * * *', async () => {
        //console.log('triggering cacheTokenPrices');
        try {
            await tokenPriceService.cacheTokenPrices();
            //console.log('cacheTokenPrices success');
        } catch (e) {
            //console.log('cacheTokenPrices error', e.message);
        }
    });

    //every five minutes
    cron.schedule('*/5 * * * *', async () => {
        //console.log('triggering cacheHistoricalTokenPrices');
        try {
            await tokenPriceService.cacheHistoricalTokenPrices();
            //console.log('cacheHistoricalTokenPrices success');
        } catch (e) {
            //console.log('cacheHistoricalTokenPrices error', e.message);
        }
    });

    //every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        //console.log('triggering cacheHistoricalTokenPrices');
        try {
            const previousBlock = await blocksSubgraphService.getBlockFrom24HoursAgo();
            await balancerService.cachePortfolioPoolsData(parseInt(previousBlock.number));

            await poolsService.cachePools();
        } catch (e) {
            //console.log('cacheHistoricalTokenPrices error', e.message);
        }
    });

    tokenPriceService.cacheHistoricalTokenPrices().catch();
    console.log('scheduled cron jobs');
}
