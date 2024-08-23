import { loadRestRoutes } from './modules/common/loadRestRoutes';
import { env } from './app/env';
import createExpressApp from 'express';
import { corsMiddleware, contextMiddleware, sessionMiddleware, lowerCaseMiddleware } from './app/middleware';
import * as http from 'http';
import { ApolloServer } from 'apollo-server-express';
import {
    ApolloServerPluginDrainHttpServer,
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginUsageReporting,
} from 'apollo-server-core';
import { schema } from './graphql_schema_generated';
import { resolvers } from './app/gql/resolvers';
import helmet from 'helmet';
import GraphQLJSON from 'graphql-type-json';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { sentryPlugin } from './app/gql/sentry-apollo-plugin';
import { startWorker } from './worker/worker';
import { startScheduler } from './worker/scheduler';
async function startServer() {
    const app = createExpressApp();

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: `multichain-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        ignoreErrors: [/.*error: Provide.*chain.*param/],
        integrations: [
            // new Sentry.Integrations.Apollo(),
            // new Sentry.Integrations.GraphQL(),
            // new Sentry.Integrations.Prisma({ client: prisma }),
            new Sentry.Integrations.Express({ app }),
            new Sentry.Integrations.Http({ tracing: true }),
            new ProfilingIntegration(),
        ],
        tracesSampleRate: 0.005,
        profilesSampleRate: 0.1,
        beforeSend(event, hint) {
            const error = hint.originalException as string;
            if (error?.toString().includes('Unknown token:')) {
                console.log(`The following error occurred but was not sent to Sentry: ${error}`);
                return null;
            }
            if (
                error?.toString().includes('SOR: invalid swap amount input') &&
                event.request?.headers &&
                event.request.headers['user-agent'].includes('Python')
            ) {
                console.log(`The following error occurred but was not sent to Sentry: ${error}`);
                return null;
            }
            if (error?.toString().includes('No potential swap paths provided')) {
                console.log(`The following error occurred but was not sent to Sentry: ${error}`);
                return null;
            }

            return event;
        },
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
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
    app.use(sessionMiddleware);
    app.use(lowerCaseMiddleware);

    loadRestRoutes(app);

    const httpServer = http.createServer(app);

    const plugins = [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        ApolloServerPluginLandingPageGraphQLPlayground({
            settings: { 'schema.polling.interval': 20000 },
        }),
        sentryPlugin,
    ];

    if (process.env.APOLLO_SCHEMA_REPORTING && process.env.APOLLO_SCHEMA_REPORTING === 'true') {
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
        context: ({ req }) => ({ ...req.context, ip: req.ip }),
    });
    await server.start();
    server.applyMiddleware({ app });

    await new Promise<void>((resolve) => httpServer.listen({ port: env.PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${env.PORT}${server.graphqlPath}`);
}

if (process.env.WORKER === 'true') {
    startWorker();
} else if (process.env.SCHEDULER === 'true') {
    startScheduler();
} else {
    startServer();
}
