import { SftmxController } from '../../../../modules/sftmx/sftmx-controller';
import { Resolvers } from '../generated-schema';

const resolvers: Resolvers = {
    Query: {
        sftmxGetWithdrawalRequests: async (parent, { user }, context) => {
            return SftmxController().getWithdrawalRequests(user);
        },
        sftmxGetStakingData: async (parent, {}, context) => {
            return SftmxController().getStakingData();
        },
        sftmxGetStakingSnapshots: async (parent, { range }, context) => {
            return SftmxController().getStakingSnapshots(range);
        },
    },
};

export default resolvers;
