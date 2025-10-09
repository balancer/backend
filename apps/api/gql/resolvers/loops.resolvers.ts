import { Resolvers } from '../generated-schema';
import { LoopsService } from '../../../../modules/loops/service';

const resolvers: Resolvers = {
    Query: {
        loopsGetData: async (parent, {}, context) => {
            return new LoopsService().getLoopsData();
        },
    },
};

export default resolvers;
