import * as Sentry from '@sentry/node';
import { env } from '../app/env';
import { AllNetworkConfigs } from '../modules/network/network-config';
import { createAlerts } from './create-alerts';
import { createMonitors } from './create-monitors';
import { sleep } from '../modules/common/promise';
import { scheduleJobs } from './job-queue';

export async function startScheduler() {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: `multichain-scheduler-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        sampleRate: 0,
    });

    try {
        const SEPOLIA_ID = '11155111';
        let chainIds = [];

        if (env.DEPLOYMENT_ENV === 'main') {
            // use all chains, remove sepolia
            chainIds = Object.keys(AllNetworkConfigs).filter((chainId) => chainId !== SEPOLIA_ID);
        } else {
            // if canary, also work sepolia
            chainIds = Object.keys(AllNetworkConfigs);
        }

        for (const chainId of chainIds) {
            scheduleJobs(chainId);
            if (process.env.AWS_ALERTS === 'true') {
                //start up time will be a bit slower
                await createAlerts(chainId);
            }
            // await createMonitors(chainId);
            // delay to accomodate for aws rate limits
            await sleep(5000);
        }
    } catch (e) {
        console.log(`Fatal error happened during cron scheduling.`, e);
    }
}
