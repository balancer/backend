import { GqlLatestSyncedBlocks, GqlProtocolMetrics, Resolvers } from '../../schema';
import { protocolService } from './protocol.service';

const protocolResolvers: Resolvers = {
    Query: {
        protocolMetrics: async (): Promise<GqlProtocolMetrics> => {
            return protocolService.getMetrics();
        },
        latestSyncedBlocks: async (): Promise<GqlLatestSyncedBlocks> => {
            return protocolService.getLatestSyncedBlocks();
        },
    },
    Mutation: {
        protocolCacheMetrics: async (): Promise<string> => {
            await protocolService.cacheProtocolMetrics();
            return 'success';
        },
    },
};

export default protocolResolvers;
