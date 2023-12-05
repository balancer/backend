import { Resolvers } from '../../schema';
import { isAdminRoute } from '../auth/auth-context';
import { bxFtmService } from './bxftm.service';

const resolvers: Resolvers = {
    Query: {
        bxftmGetWithdrawalRequests: async (parent, { user }, context) => {
            return bxFtmService.getWithdrawalRequests(user);
        },
    },
    Mutation: {
        bxFtmSyncWithdrawalRequests: async (parent, {}, context) => {
            isAdminRoute(context);

            await bxFtmService.syncWithdrawalRequests();

            return 'success';
        },
    },
};

export default resolvers;
