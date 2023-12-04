import express from 'express';
import * as Sentry from '@sentry/node';
import { env } from '../app/env';
import { configureWorkerRoutes } from './job-handlers';

export async function startWorker() {
    const app = express();

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: `multichain-worker-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        integrations: [
            // new Tracing.Integrations.Express({ app }),
            new Sentry.Integrations.Http({ tracing: true }),
        ],
        tracesSampleRate: env.DEPLOYMENT_ENV === 'main' ? 0.2 : 1.0,
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
