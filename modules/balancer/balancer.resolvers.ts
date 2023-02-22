import { Resolvers } from '../../schema';

const balancerResolvers: Resolvers = {
    Query: {
        balancerQueryTest: async (parent, {}, context) => {
            return 'test';
        },
    },
    Mutation: {
        balancerMutationTest: async (parent, {}, context) => {
            return 'test';
        },
    },
};

export default balancerResolvers;
