import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetFbeetsRatio: async (parent, {}, context) => {
            return beetsService.getFbeetsRatio();
        },
    },
};

export default balancerResolvers;
