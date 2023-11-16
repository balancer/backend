import moment from 'moment';
import { Resolvers } from '../../schema';

const balancerResolvers: Resolvers = {
    Query: {
        balancerQueryTest: async (parent, {}, context) => {
            return `${moment().utc().valueOf()}`;
        },
    },
    Mutation: {
        balancerMutationTest: async (parent, {}, context) => {
            return 'test';
        },
    },
};

export default balancerResolvers;
