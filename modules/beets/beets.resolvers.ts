import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';
import { isAdminRoute } from '../util/resolver-util';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetFbeetsRatio: async (parent, {}, context) => {
            return beetsService.getFbeetsRatio();
        },
        beetsGetProtocolData: async (parent, {}, context) => {
            return beetsService.getProtocolData();
        },
        beetsGetConfig: async (parent, {}, context) => {
            return beetsService.getConfig();
        },
    },
    Mutation: {
        beetsSyncFbeetsRatio: async (parent, {}, context) => {
            isAdminRoute(context);

            await beetsService.syncFbeetsRatio();

            return 'success';
        },
        beetsSyncProtocolData: async (parent, {}, context) => {
            isAdminRoute(context);

            await beetsService.cacheProtocolData();

            return 'success';
        },
    },
};

export default balancerResolvers;
