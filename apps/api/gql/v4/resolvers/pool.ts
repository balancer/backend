import { Resolvers } from '../generated-schema';
import { graphqlToPrismaQuery } from '../../helpers/gql-to-prisma';
import { prisma } from '../../../../../prisma/prisma-client';

const poolResolvers: Resolvers = {
    Query: {
        pool: async (_, { id, chain }, context, info) => {
            const dbQuery = graphqlToPrismaQuery(info);
            const data = await prisma.pools.findMany(dbQuery);
            const pool = data[0];
            return pool;
        },
        pools: async (_, args, context) => {
            return [];
        },
    },
};

export default poolResolvers;
