import cron from 'node-cron';
import { tokenPriceService } from '../modules/token-price/token-price.service';

export function scheduleCronJobs() {
    //every two minutes
    cron.schedule('*/5 * * * * *', () => {
        tokenPriceService.cacheTokenPrices().catch();
    });

    //every fifteen minutes
    cron.schedule('*/5 * * * *', () => {
        tokenPriceService.cacheHistoricalTokenPrices().catch();
    });
}
