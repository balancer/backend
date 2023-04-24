import { GqlLatestSyncedBlocks, GqlProtocolMetrics, Resolvers } from '../../schema';
import { protocolService } from './protocol.service';
import { networkContext } from '../network/network-context.service';

const protocolResolvers: Resolvers = {
    Query: {
        protocolMetrics: async (): Promise<GqlProtocolMetrics> => {
            return protocolService.getGlobalMetrics();
        },
        chainMetrics: async (): Promise<GqlProtocolMetrics> => {
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
