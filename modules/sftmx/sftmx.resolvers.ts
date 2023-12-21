import { Resolvers } from '../../schema';
import { isAdminRoute } from '../auth/auth-context';
import { sftmxService } from './sftmx.service';

const resolvers: Resolvers = {
    Query: {
        sftmxGetWithdrawalRequests: async (parent, { user }, context) => {
            return sftmxService.getWithdrawalRequests(user);
        },
        sftmxGetStakingData: async (parent, {}, context) => {
            return sftmxService.getStakingData();
        },
    },
    Mutation: {
        sftmxSyncWithdrawalRequests: async (parent, {}, context) => {
            isAdminRoute(context);

            await sftmxService.syncWithdrawalRequests();

            return 'success';
        },
        sftmxSyncStakingData: async (parent, {}, context) => {
            isAdminRoute(context);

            await sftmxService.syncStakingData();

            return 'success';
        },
    },
};

export default resolvers;
