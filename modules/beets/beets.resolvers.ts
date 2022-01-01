import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetProtocolData: async (parent, {}, context) => {
            const protocolData = await beetsService.getProtocolData();

            console.log('protocolData', protocolData);

            return protocolData;
        },
    },
};

export default balancerResolvers;
