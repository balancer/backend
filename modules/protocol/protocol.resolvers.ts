import { GqlLatestSyncedBlocks, Resolvers } from '../../schema';
import { protocolService } from './protocol.service';
import { networkContext } from '../network/network-context.service';

const protocolResolvers: Resolvers = {
    Query: {
        protocolMetricsChain: async (parent, args, context) => {
            return protocolService.getMetrics(networkContext.chainId);
        },
        protocolMetricsAggregated: async (parent, { chainIds }, context) => {
            return protocolService.getAggregatedMetrics(chainIds);
        },
        latestSyncedBlocks: async (): Promise<GqlLatestSyncedBlocks> => {
            return protocolService.getLatestSyncedBlocks();
        },
    },
    Mutation: {
        protocolCacheMetrics: async (): Promise<string> => {
            await protocolService.cacheProtocolMetrics(networkContext.chainId, networkContext.chain);
            return 'success';
        },
    },
};

export default protocolResolvers;
