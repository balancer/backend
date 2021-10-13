import createExpressApp, { Express, json } from 'express';
import { accountMiddleware } from './middleware/accountMiddleware';
import { corsMiddleware } from './middleware/corsMiddleware';
import { createApolloServer } from './middleware/apolloServer';
import { contextMiddleware } from './middleware/contextMiddleware';
import { scheduleCronJobs } from './scheduleCronJobs';

export function createApp(): Express {
    const app = createExpressApp();

    app.use(json({ limit: '1mb' }));
    app.use(corsMiddleware);
    app.use(contextMiddleware);
    app.use(accountMiddleware);

    const server = createApolloServer();
    server.applyMiddleware({ app });

    scheduleCronJobs();

    return app;
}
