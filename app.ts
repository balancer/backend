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
import { resolvers } from './app/resolvers';
import { scheduleWorkerTasks } from './app/scheduleWorkerTasks';
import { redis } from './modules/cache/redis';
import { scheduleMainTasks } from './app/scheduleMainTasks';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

async function startServer() {
    //need to open the redis connection prior to adding the rate limit middleware
    await redis.connect();

    const app = createExpressApp();
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

    app.use(
        rateLimit({
            windowMs: 10000, // 10 seconds
            max: 200, // Limit each IP to 100 requests per second
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers
            store: new RedisStore({
                sendCommand: async (...args: string[]) => redis.sendCommand(args),
            }),
        }),
    );

    app.use(corsMiddleware);
    app.use(contextMiddleware);
    app.use(accountMiddleware);

    //startWorker(app);
    loadRestRoutes(app);

    const httpServer = http.createServer(app);
    const server = new ApolloServer({
        resolvers: resolvers,
        typeDefs: schema,
        introspection: true,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            ApolloServerPluginLandingPageGraphQLPlayground(),
            ApolloServerPluginUsageReporting({
                sendVariableValues: { all: true },
                sendHeaders: { onlyNames: ['AccountAddress'] },
            }),
        ],
        context: ({ req }) => req.context,
    });
    await server.start();
    server.applyMiddleware({ app });

    await new Promise<void>((resolve) => httpServer.listen({ port: env.PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${env.PORT}${server.graphqlPath}`);

    if (process.env.WORKER === 'true') {
        try {
            scheduleWorkerTasks();
        } catch (e) {
            console.log(`Fatal error happened during cron scheduling.`, e);
        }
    } else {
        scheduleMainTasks();
    }
}

//
startServer().finally(async () => {
    //await prisma.$disconnect();
    //await redis.disconnect();
});
