import { env } from '../env';
import config from '../../config';
import { sleep } from '../../modules/common/promise';
import { scheduleJobs } from './job-queue';
import { createAlerts } from './create-alerts';
// import { createMonitors } from './create-monitors';

let chainIds = Object.values(config).map((c) => String(c.chain.id));

export async function startSchedulerServer() {
    try {
        const SEPOLIA_ID = '11155111';

        if (env.DEPLOYMENT_ENV === 'main') {
            // use all chains, remove sepolia
            chainIds = chainIds.filter((chainId) => chainId !== SEPOLIA_ID);
        }

        for (const chainId of chainIds) {
            scheduleJobs(chainId);
            if (process.env.AWS_ALERTS === 'true') {
                // start up time will be a bit slower
                await createAlerts(chainId);
            }
            // await createMonitors(chainId);
            // delay to accomodate for aws rate limits
            await sleep(5000);
        }
    } catch (e) {
        console.error(`Fatal error happened during cron scheduling.`, e);
    }
}
