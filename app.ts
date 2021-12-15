import { loadRestRoutes } from './app/loadRestRoutes';
import { env } from './app/env';
import createExpressApp, { json } from 'express';
import { corsMiddleware } from './app/middleware/corsMiddleware';
import { contextMiddleware } from './app/middleware/contextMiddleware';
import { accountMiddleware } from './app/middleware/accountMiddleware';
import * as http from 'http';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { schema } from './graphql_schema_generated';
import { resolvers } from './app/resolvers';
import { scheduleCronJobs } from './app/scheduleCronJobs';
import { prisma } from './modules/prisma/prisma-client';

async function startServer() {
    const app = createExpressApp();
    app.use(json({ limit: '1mb' }));
    app.use(corsMiddleware);
    app.use(contextMiddleware);
    app.use(accountMiddleware);

    loadRestRoutes(app);

    const httpServer = http.createServer(app);
    const server = new ApolloServer({
        resolvers: resolvers,
        typeDefs: schema,
        introspection: true,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), ApolloServerPluginLandingPageGraphQLPlayground()],
        context: ({ req }) => req.context,
    });
    await server.start();
    server.applyMiddleware({ app });

    scheduleCronJobs();

    await new Promise<void>((resolve) => httpServer.listen({ port: env.PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${env.PORT}${server.graphqlPath}`);
}

startServer().finally(async () => {
    await prisma.$disconnect();
});
