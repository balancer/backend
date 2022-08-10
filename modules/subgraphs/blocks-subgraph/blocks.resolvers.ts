import { Resolvers } from '../../../schema';
import { blocksSubgraphService } from './blocks-subgraph.service';

const balancerResolvers: Resolvers = {
    Query: {
        blocksGetAverageBlockTime: async (parent, {}, context) => {
            return blocksSubgraphService.getAverageBlockTime();
        },
        blocksGetBlocksPerSecond: async (parent, {}, context) => {
            const avgBlockTime = await blocksSubgraphService.getAverageBlockTime();
            return 1 / avgBlockTime;
        },
        blocksGetBlocksPerDay: async (parent, {}, context) => {
            return blocksSubgraphService.getBlocksPerDay();
        },
        blocksGetBlocksPerYear: async (parent, {}, context) => {
            return blocksSubgraphService.getBlocksPerYear();
        },
    },
};

export default balancerResolvers;
