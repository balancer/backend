import { Resolvers } from '../../schema';
import { getRequiredAccountAddress, isAdminRoute } from '../auth/auth-context';
import { veBalService } from './vebal.service';
import { veBalVotingListService } from './vebal-voting-list.service';
import { headerChain } from '../context/header-chain';

const resolvers: Resolvers = {
    Query: {
        veBalGetUserBalance: async (parent, { chain, address }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('veBalGetUserBalance error: Provide "chains" param');
            }

            const accountAddress = address || getRequiredAccountAddress(context);
            return veBalService.getVeBalUserBalance(chain, accountAddress);
        },
        veBalGetUser: async (parent, { chain, address }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('veBalGetUser error: Provide "chains" param');
            }

            const accountAddress = address || getRequiredAccountAddress(context);
            return veBalService.getVeBalUserData(chain, accountAddress);
        },
        veBalGetTotalSupply: async (parent, { chain }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('veBalGetTotalSupply error: Provide "chains" param');
            }
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
