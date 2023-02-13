import express from 'express';
import * as Sentry from '@sentry/node';
import { env } from '../app/env';
import * as Tracing from '@sentry/tracing';
import { prisma } from '../prisma/prisma-client';
import { configureWorkerRoutes } from './job-handlers';
import { createAlerts, scheduleJobs as scheduleJobs } from './manual-jobs';
import { AllNetworkConfigs } from '../modules/network/network-config';

export function startWorker() {
    const app = express();

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: `multichain-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        integrations: [
            new Tracing.Integrations.Prisma({ client: prisma }),
            // new Tracing.Integrations.Express({ app }),
            new Sentry.Integrations.Http({ tracing: true }),
        ],
        sampleRate: 1,
    });

    app.use(Sentry.Handlers.requestHandler());
    // starting a manual transaction in the job-handler, no need for this
    // app.use(Sentry.Handlers.tracingHandler());
    app.use(express.json());

    configureWorkerRoutes(app);
    app.use(
        Sentry.Handlers.errorHandler({
            shouldHandleError(): boolean {
                return true;
            },
        }),
    );

    if (env.NODE_ENV !== 'local') {
        const supportedNetworks = process.env.SUPPORTED_NETWORKS?.split(',') ?? Object.keys(AllNetworkConfigs);

        try {
            for (const chainId of supportedNetworks) {
                scheduleJobs(chainId);
                createAlerts(chainId);
            }
        } catch (e) {
            console.log(`Fatal error happened during cron scheduling.`, e);
        }
    }

    app.listen(env.PORT, () => {
        console.log(`Worker listening on port ${env.PORT}`);
    });
}
