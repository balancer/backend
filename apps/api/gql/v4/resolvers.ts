import poolResolver from './resolvers/pool';

export const v4Resolvers = {
    Query: {
        ...poolResolver.Query,
    },
    Mutation: {
        ...poolResolver.Mutation,
    },
};
