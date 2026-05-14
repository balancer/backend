import { Resolvers } from '../generated-schema';
import { protocolService } from '../../../../modules/protocol/protocol.service';
import { isAdminRoute } from '../../../../modules/auth/auth-context';

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
            isAdminRoute(context);

            await protocolService.cacheProtocolMetrics(chain);
            return 'success';
        },
    },
};

export default protocolResolvers;
