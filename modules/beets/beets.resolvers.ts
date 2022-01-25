import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';
import { getRequiredAccountAddress } from '../util/resolver-util';
import { beetsFarmService } from './beets-farm.service';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetProtocolData: async (parent, {}, context) => {
            const protocolData = await beetsService.getProtocolData();

            return protocolData;
        },
        beetsGetBeetsFarms: async (parent, {}, context) => {
            return beetsFarmService.getBeetsFarms();
        },
        beetsGetUserDataForFarm: async (parent, { farmId }, context) => {
            const address = getRequiredAccountAddress(context);

            return beetsFarmService.getBeetsFarmUser(farmId, address);
        },
        beetsGetUserDataForAllFarms: async (parent, {}, context) => {
            const address = getRequiredAccountAddress(context);

            return beetsFarmService.getBeetsFarmsForUser(address);
        },
        beetsGetConfig: async (parent, {}, context) => {
            return beetsService.getConfig();
        },
    },
};

export default balancerResolvers;
