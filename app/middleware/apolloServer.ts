import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import { Context } from '../Context';
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';
import { generatedGraphQlSchema } from '../../graphql_schema_generated';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeResolvers } from '@graphql-tools/merge';

const context = ({ req }: ExpressContext): Context => {
    //@ts-ignore
    return req.context;
};

export function createApolloServer() {
    const resolversArray = loadFilesSync(path.join(__dirname, '../../**/*.resolvers.*'));

    return new ApolloServer({
        typeDefs: generatedGraphQlSchema,
        //@ts-ignore
        resolvers: mergeResolvers(resolversArray),
        context,
        introspection: true,
        playground: true,
    });
}
