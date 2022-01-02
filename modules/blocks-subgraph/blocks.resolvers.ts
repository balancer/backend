import { Resolvers } from '../../schema';
import { blocksSubgraphService } from './blocks-subgraph.service';

const balancerResolvers: Resolvers = {
    Query: {
        blocksGetAverageBlockTime: async (parent, {}, context) => {
            return blocksSubgraphService.getAverageBlockTime();
        },
    },
};

export default balancerResolvers;
