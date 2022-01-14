import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';
import { getRequiredAccountAddress } from '../util/resolver-util';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetProtocolData: async (parent, {}, context) => {
            const protocolData = await beetsService.getProtocolData();

            return protocolData;
        },
        beetsGetBeetsFarms: async (parent, {}, context) => {
            return beetsService.getBeetsFarms();
        },
        beetsGetUserDataForFarm: async (parent, { farmId }, context) => {
            const address = getRequiredAccountAddress(context);

            return beetsService.getBeetsFarmUser(farmId, address);
        },
        beetsGetUserDataForAllFarms: async (parent, {}, context) => {
            const address = getRequiredAccountAddress(context);

            return beetsService.getBeetsFarmsForUser(address);
        },
        beetsGetConfig: async (parent, {}, context) => {
            return beetsService.getConfig();
        },
    },
};

export default balancerResolvers;
