import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';

export function scheduleCronJobs() {
    //every 20 seconds
    cron.schedule('*/20 * * * * *', async () => {
        console.log('triggering cacheTokenPrices');
        try {
            await tokenPriceService.cacheTokenPrices();
            console.log('cacheTokenPrices success');
        } catch (e) {
            console.log('cacheTokenPrices error', e.message);
        }
    });

    //every five minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('triggering cacheHistoricalTokenPrices');
        try {
            await tokenPriceService.cacheHistoricalTokenPrices();
            console.log('cacheHistoricalTokenPrices success');
        } catch (e) {
            console.log('cacheHistoricalTokenPrices error', e.message);
        }
    });

    tokenPriceService.cacheHistoricalTokenPrices().catch();
}
