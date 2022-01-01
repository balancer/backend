import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetProtocolData: async (parent, {}, context) => {
            const protocolData = await beetsService.getProtocolData();

            return protocolData;
        },
    },
};

export default balancerResolvers;
