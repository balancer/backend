import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';
import { isAdminRoute } from '../auth/auth-context';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetFbeetsRatio: async (parent, {}, context) => {
            return beetsService.getFbeetsRatio();
        },
        beetsGetBeetsPrice: async (parent, {}, context) => {
            return beetsService.getBeetsPrice();
        },
    },
    Mutation: {
        beetsSyncFbeetsRatio: async (parent, {}, context) => {
            isAdminRoute(context);

            await beetsService.syncFbeetsRatio();

            return 'success';
        },
    },
};

export default balancerResolvers;
