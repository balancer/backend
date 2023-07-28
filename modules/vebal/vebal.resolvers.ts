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
        veBalGetTotalSupply: async (parent, {}, context) => {
            return veBalService.getVeBalTotalSupply();
        },
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
