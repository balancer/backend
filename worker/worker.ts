import express from 'express';
import * as Sentry from '@sentry/node';
import { env } from '../app/env';
import * as Tracing from '@sentry/tracing';
import { prisma } from '../prisma/prisma-client';
import { AllNetworkConfigs } from '../modules/network/network-config';
import { createAlerts } from './create-alerts';
import { scheduleJobs } from './job-handlers';

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
    app.use(express.json());

    app.use(
        Sentry.Handlers.errorHandler({
            shouldHandleError(): boolean {
                return true;
            },
        }),
    );

    const supportedNetworks = process.env.SUPPORTED_NETWORKS?.split(',') ?? Object.keys(AllNetworkConfigs);

    try {
        for (const chainId of supportedNetworks) {
            scheduleJobs(chainId);
            if (process.env.AWS_ALERTS === 'true') {
                createAlerts(chainId);
            }
        }
    } catch (e) {
        console.log(`Fatal error happened during cron scheduling.`, e);
    }
}
