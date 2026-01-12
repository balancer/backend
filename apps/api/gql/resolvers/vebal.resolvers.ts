import { Resolvers } from '../generated-schema';
import { isAdminRoute } from '../../../../modules/auth/auth-context';
import { veBalService } from '../../../../modules/vebal/vebal.service';
import { veBalVotingListService } from '../../../../modules/vebal/vebal-voting-list.service';

const resolvers: Resolvers = {
    Query: {
        veBalGetUserBalance: async (parent, { chain, address }, context) => {
            return veBalService.getVeBalUserBalance(chain, address);
        },
        veBalGetUserBalances: async (parent, { chains, address }, context) => {
            return veBalService.readBalances(address, chains);
        },
        veBalGetUser: async (parent, { chain, address }, context) => {
            return veBalService.getVeBalUserData(chain, address);
        },
        veBalGetTotalSupply: async (parent, { chain }, context) => {
            return veBalService.getVeBalTotalSupply(chain);
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
        veBalGetVotingList: async (parent, { includeKilled }, context) => {
            return veBalVotingListService.getVotingListWithHardcodedPools(!!includeKilled);
        },
    },
    Mutation: {
        veBalSyncAllUserBalances: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await veBalService.syncVeBalBalances(chain);

            return 'success';
        },
        veBalSyncTotalSupply: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await veBalService.syncVeBalTotalSupply(chain);

            return 'success';
        },
    },
};

export default resolvers;
