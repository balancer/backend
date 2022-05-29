import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetFbeetsRatio: async (parent, {}, context) => {
            return beetsService.getFbeetsRatio();
        },
        beetsGetProtocolData: async (parent, {}, context) => {
            return beetsService.getProtocolData();
        },
        beetsGetConfig: async (parent, {}, context) => {
            return beetsService.getConfig();
        },
    },
};

export default balancerResolvers;
