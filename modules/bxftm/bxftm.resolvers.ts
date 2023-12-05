import { Resolvers } from '../../schema';
import { isAdminRoute } from '../auth/auth-context';
import { bxFtmService } from './bxftm.service';

const resolvers: Resolvers = {
    Query: {
        bxftmGetWithdrawalRequests: async (parent, { user }, context) => {
            return bxFtmService.getWithdrawalRequests(user);
        },
        bxFtmGetStakingData: async (parent, {}, context) => {
            return bxFtmService.getStakingData();
        },
    },
    Mutation: {
        bxFtmSyncWithdrawalRequests: async (parent, {}, context) => {
            isAdminRoute(context);

            await bxFtmService.syncWithdrawalRequests();

            return 'success';
        },
        bxFtmSyncStakingData: async (parent, {}, context) => {
            isAdminRoute(context);

            await bxFtmService.syncStakingData();

            return 'success';
        },
    },
};

export default resolvers;
