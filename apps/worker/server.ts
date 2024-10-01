import * as Sentry from '@sentry/node';
import express from 'express';
import { env } from '../env';
import { configureWorkerRoutes } from './job-handlers';

export async function startWorkerServer() {
    const app = express();

    app.use(express.json());

    configureWorkerRoutes(app);

    Sentry.setupExpressErrorHandler(app);

    // Override default error handler, so we don't log errors twice in Sentry
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        return; // Do nothing
    });

    app.listen(env.PORT, () => {
        console.log(`Worker listening on port ${env.PORT}`);
    });
}
