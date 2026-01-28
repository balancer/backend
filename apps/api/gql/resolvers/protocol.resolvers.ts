import { Resolvers } from '../generated-schema';
import { protocolService } from '../../../../modules/protocol/protocol.service';

const protocolResolvers: Resolvers = {
    Query: {
        protocolMetricsChain: async (parent, { chain }, context) => {
            return protocolService.getMetrics(chain);
        },
        protocolMetricsAggregated: async (parent, { chains }, context) => {
            return protocolService.getAggregatedMetrics(chains);
        },
    },
    Mutation: {
        protocolCacheMetrics: async (parent, { chain }, context): Promise<string> => {
            await protocolService.cacheProtocolMetrics(chain);
            return 'success';
        },
    },
};

export default protocolResolvers;
