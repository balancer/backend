import { loadRestRoutesBeethoven } from './modules/beethoven/loadRestRoutes';
import { loadRestRoutesBalancer } from './modules/balancer/loadRestRoutes';
import { env } from './app/env';
import createExpressApp from 'express';
import { corsMiddleware } from './app/middleware/corsMiddleware';
import { contextMiddleware } from './app/middleware/contextMiddleware';
import { sessionMiddleware } from './app/middleware/sessionMiddleware';
import * as http from 'http';
import { ApolloServer } from 'apollo-server-express';
import {
    ApolloServerPluginDrainHttpServer,
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginUsageReporting,
} from 'apollo-server-core';
import { beethovenSchema } from './graphql_schema_generated_beethoven';
import { balancerSchema } from './graphql_schema_generated_balancer';
import { balancerResolvers, beethovenResolvers } from './app/gql/resolvers';
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
        // tracesSampleRate: 0.005,
        environment: `multichain-${env.DEPLOYMENT_ENV}`,
        enabled: env.NODE_ENV === 'production',
        integrations: [
            // new Tracing.Integrations.Apollo(),
            // new Tracing.Integrations.GraphQL(),
            // new Tracing.Integrations.Prisma({ client: prisma }),
            // new Tracing.Integrations.Express({ app }),
            // new Sentry.Integrations.Http({ tracing: true }),
        ],
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
            return event;
        },
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
    app.use(sessionMiddleware);

    //startWorker(app);
    if (env.PROTOCOL === 'beethoven') {
        loadRestRoutesBeethoven(app);
    } else if (env.PROTOCOL === 'balancer') {
        loadRestRoutesBalancer(app);
    }

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
            ...(env.PROTOCOL === 'beethoven' ? beethovenResolvers : balancerResolvers),
        },
        typeDefs: env.PROTOCOL === 'beethoven' ? beethovenSchema : balancerSchema,
        introspection: true,
        plugins,
        context: ({ req }) => req.context,
    });
    await server.start();
    server.applyMiddleware({ app });

    await new Promise<void>((resolve) => httpServer.listen({ port: env.PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${env.PORT}${server.graphqlPath}`);
}

if (process.env.WORKER === 'true') {
    startWorker();
} else {
    startServer();
}
