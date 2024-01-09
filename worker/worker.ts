import express from 'express';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { env } from '../app/env';
import { configureWorkerRoutes } from './job-handlers';
import { prisma } from '../prisma/prisma-client';

export async function startWorker() {
    const app = express();

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: `multichain-worker-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        integrations: [
            new Sentry.Integrations.Apollo(),
            new Sentry.Integrations.GraphQL(),
            new Sentry.Integrations.Prisma({ client: prisma }),
            new Sentry.Integrations.Express({ app }),
            new Sentry.Integrations.Http({ tracing: true }),
            new ProfilingIntegration(),
        ],
        tracesSampleRate: 0.005,
        profilesSampleRate: 0.005,
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(express.json());

    configureWorkerRoutes(app);
    app.use(
        Sentry.Handlers.errorHandler({
            shouldHandleError(): boolean {
                return true;
            },
        }),
    );

    app.listen(env.PORT, () => {
        console.log(`Worker listening on port ${env.PORT}`);
    });
}
