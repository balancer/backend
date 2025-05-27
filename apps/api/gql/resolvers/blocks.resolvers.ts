import { Resolvers } from '../generated-schema';

const balancerResolvers: Resolvers = {
    Query: {
        blocksGetAverageBlockTime: async (parent, {}, context) => {
            return 1;
        },
        blocksGetBlocksPerSecond: async (parent, {}, context) => {
            return 1;
        },
        blocksGetBlocksPerDay: async (parent, {}, context) => {
            return 300;
        },
        blocksGetBlocksPerYear: async (parent, {}, context) => {
            return 3000;
        },
    },
};

export default balancerResolvers;
