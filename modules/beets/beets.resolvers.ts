import { Resolvers } from '../../schema';
import { beetsService } from './beets.service';
import { getRequiredAccountAddress } from '../util/resolver-util';
import { beetsPoolService } from './beets-pool.service';

const balancerResolvers: Resolvers = {
    Query: {
        beetsGetProtocolData: async (parent, {}, context) => {
            const protocolData = await beetsService.getProtocolData();

            return protocolData;
        },
        beetsGetBeetsFarms: async (parent, {}, context) => {
            return [];
        },
        beetsGetUserDataForFarm: async (parent, { farmId }, context) => {
            const address = getRequiredAccountAddress(context);
            return null;
        },
        beetsGetUserDataForAllFarms: async (parent, {}, context) => {
            const address = getRequiredAccountAddress(context);
            return [];
        },
        beetsGetConfig: async (parent, {}, context) => {
            return beetsService.getConfig();
        },
        beetsGetUserPoolData: async (parent, {}, context) => {
            const address = getRequiredAccountAddress(context);

            return beetsPoolService.getUserPoolData(address);
        },
        beetsGetUserPendingRewards: async (parent, {}, context) => {
            const address = getRequiredAccountAddress(context);

            return {
                farm: {
                    tokens: [],
                    totalBalanceUSD: `0`,
                    numFarms: `0`,
                    farmIds: [],
                    farms: [],
                },
            };
        },
    },
};

export default balancerResolvers;
