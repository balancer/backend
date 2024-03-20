import { Resolvers } from '../../../schema';
import { SftmxQueryController } from '../../controllers/sftmx-query-controller';

const resolvers: Resolvers = {
    Query: {
        sftmxGetWithdrawalRequests: async (parent, { user }, context) => {
            return SftmxQueryController().getWithdrawalRequests(user);
        },
        sftmxGetStakingData: async (parent, {}, context) => {
            return SftmxQueryController().getStakingData();
        },
        sftmxGetStakingSnapshots: async (parent, { range }, context) => {
            return SftmxQueryController().getStakingSnapshots(range);
        },
    },
};

export default resolvers;
