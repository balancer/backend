import { StakedSonicController } from '../../../../modules/sts/sts-controller';
import { Resolvers } from '../generated-schema';

const resolvers: Resolvers = {
    Query: {
        stsGetGqlStakedSonicData: async (parent, {}, context) => {
            return StakedSonicController().getStakingData();
        },
        stsGetStakedSonicSnapshots: async (parent, { range }, context) => {
            return StakedSonicController().getStakingSnapshots(range);
        },
    },
};

export default resolvers;
