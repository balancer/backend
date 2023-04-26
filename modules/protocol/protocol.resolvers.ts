import { GqlLatestSyncedBlocks, GqlProtocolMetricsAggregated, GqlProtocolMetricsChain, Resolvers } from '../../schema';
import { protocolService } from './protocol.service';
import { networkContext } from '../network/network-context.service';

const protocolResolvers: Resolvers = {
    Query: {
        protocolMetrics: async (): Promise<GqlProtocolMetricsAggregated> => {
            return protocolService.getGlobalMetrics();
        },
        chainMetrics: async (): Promise<GqlProtocolMetricsChain> => {
            return protocolService.getMetrics(networkContext.chainId);
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
