import { Resolvers } from '../../schema';
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
};

export default resolvers;
