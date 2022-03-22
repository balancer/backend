import cron from 'node-cron';
import { balancerSdk } from '../modules/balancer-sdk/src/balancer-sdk';

export function scheduleMainTasks() {
    //every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
        try {
            await balancerSdk.sor.fetchPools();
        } catch (e) {}
    });

    //once every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        await balancerSdk.sor.reloadGraph();
    });
}
