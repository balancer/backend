import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import { Context } from '../Context';
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';
import { schema } from '../../graphql_schema_generated';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeResolvers } from '@graphql-tools/merge';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import * as http from 'http';
import { Express } from 'express';

const context = ({ req }: ExpressContext): Context => {
    return req.context;
};

export function createApolloServer(app: Express) {
    const resolversArray = loadFilesSync(path.join(__dirname, '../../**/*.resolvers.*'));
    const httpServer = http.createServer(app);
    return new ApolloServer({
        typeDefs: schema,
        resolvers: mergeResolvers(resolversArray),
        context,
        introspection: true,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });
}
