import { Resolvers } from '../../schema';
import { getRequiredAccountAddress, isAdminRoute } from '../auth/auth-context';
import { veBalService } from './vebal.service';
import { veBalVotingListService } from './vebal-voting-list.service';

const resolvers: Resolvers = {
    Query: {
        veBalGetUserBalance: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);
            return veBalService.getVeBalUserBalance(accountAddress);
        },
        veBalGetUser: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);
            return veBalService.getVeBalUserData(accountAddress);
        },
        veBalGetTotalSupply: async (parent, {}, context) => {
            return veBalService.getVeBalTotalSupply();
        },

        /*
            This endpoint is consumed by some partners

            - Aura (contact: ask solarcurve or alberto)
            - Paladin (contact: ask solarcurve or alberto)
            - DeFilytica and Aura analytics(contact: ask Xeonus)
            - Maybe more (TBD)

            Schema changes would affect those partners so, in case we need it, it would be better to keep the current schema and create a new endpoint with a
            new schema that we consume from our FEs
         */
        veBalGetVotingList: async (parent, {}, context) => {
            return veBalVotingListService.getVotingListWithHardcodedPools();
        },
    },
    Mutation: {
        veBalSyncAllUserBalances: async (parent, {}, context) => {
            isAdminRoute(context);

            await veBalService.syncVeBalBalances();

            return 'success';
        },
        veBalSyncTotalSupply: async (parent, {}, context) => {
            isAdminRoute(context);

            await veBalService.syncVeBalTotalSupply();

            return 'success';
        },
    },
};

export default resolvers;
