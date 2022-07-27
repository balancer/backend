import createExpressApp from 'express';
import * as Sentry from '@sentry/node';
import { env } from './app/env';
import * as Tracing from '@sentry/tracing';
import { prisma } from './modules/util/prisma-client';
import { addWorkerRoutes } from './app/scheduleWorkerTasks';

export function startWorker() {
    const app = createExpressApp();

    Sentry.init({
        dsn: env.SENTRY_DSN,
        tracesSampleRate: 1,
        environment: env.NODE_ENV,
        enabled: env.NODE_ENV === 'production',
        integrations: [
            new Tracing.Integrations.Prisma({ client: prisma }),
            new Tracing.Integrations.Express({ app }),
            new Sentry.Integrations.Http({ tracing: true }),
        ],
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());

    addWorkerRoutes(app);
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
