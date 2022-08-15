import { loadRestRoutes } from './app/loadRestRoutes';
import { env } from './app/env';
import createExpressApp from 'express';
import { corsMiddleware } from './app/middleware/corsMiddleware';
import { contextMiddleware } from './app/middleware/contextMiddleware';
import { accountMiddleware } from './app/middleware/accountMiddleware';
import * as http from 'http';
import { ApolloServer } from 'apollo-server-express';
import {
    ApolloServerPluginDrainHttpServer,
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginUsageReporting,
} from 'apollo-server-core';
import { schema } from './graphql_schema_generated';
import { resolvers } from './app/gql/resolvers';
import { scheduleLocalWorkerTasks } from './worker/scheduleLocalWorkerTasks';
import helmet from 'helmet';
import GraphQLJSON from 'graphql-type-json';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { prisma } from './prisma/prisma-client';
import { sentryPlugin } from './app/gql/sentry-apollo-plugin';
import { startWorker } from './worker/worker';

async function startServer() {
    const app = createExpressApp();

    Sentry.init({
        dsn: env.SENTRY_DSN,
        tracesSampleRate: 0.01,
        environment: env.NODE_ENV,
        enabled: env.NODE_ENV === 'production',
        integrations: [
            new Tracing.Integrations.Apollo(),
            // new Tracing.Integrations.GraphQL(),
            new Tracing.Integrations.Prisma({ client: prisma }),
            // new Tracing.Integrations.Express({ app }),
            new Sentry.Integrations.Http({ tracing: true }),
        ],
    });

    app.use(Sentry.Handlers.requestHandler());
    // app.use(Sentry.Handlers.tracingHandler());
    // app.use(Sentry.Handlers.errorHandler());

    app.use(helmet.dnsPrefetchControl());
    app.use(helmet.expectCt());
    app.use(helmet.frameguard());
    app.use(helmet.hidePoweredBy());
    app.use(helmet.hsts());
    app.use(helmet.ieNoOpen());
    app.use(helmet.noSniff());
    app.use(helmet.originAgentCluster());
    app.use(helmet.permittedCrossDomainPolicies());
    app.use(helmet.referrerPolicy());
    app.use(helmet.xssFilter());

    app.use(corsMiddleware);
    app.use(contextMiddleware);
    app.use(accountMiddleware);

    //startWorker(app);
    loadRestRoutes(app);

    const httpServer = http.createServer(app);

    const plugins = [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        ApolloServerPluginLandingPageGraphQLPlayground({
            settings: { 'schema.polling.interval': 20000 },
        }),
        sentryPlugin,
    ];
    if (env.NODE_ENV === 'production') {
        plugins.push(
            ApolloServerPluginUsageReporting({
                sendVariableValues: { all: true },
                sendHeaders: { all: true },
            }),
        );
    }
    const server = new ApolloServer({
        resolvers: {
            JSON: GraphQLJSON,
            ...resolvers,
        },
        typeDefs: schema,
        introspection: true,
        plugins,
        context: ({ req }) => req.context,
    });
    await server.start();
    server.applyMiddleware({ app });

    await new Promise<void>((resolve) => httpServer.listen({ port: env.PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${env.PORT}${server.graphqlPath}`);

    if (process.env.NODE_ENV === 'local') {
        try {
            scheduleLocalWorkerTasks();
        } catch (e) {
            console.log(`Fatal error happened during cron scheduling.`, e);
        }
    }
}

if (process.env.WORKER === 'true') {
    startWorker();
} else {
    startServer();
}
