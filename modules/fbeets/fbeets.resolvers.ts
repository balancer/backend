import { Resolvers } from '../../schema';

const resolvers: Resolvers = {
    Query: {
        fbeetsGetApr: async (parent, {}, context) => {
            return { apr: 0 };
        },
    },
};

export default resolvers;
