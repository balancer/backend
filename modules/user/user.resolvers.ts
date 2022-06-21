import { Resolvers } from '../../schema';
import { userService } from './user.service';
import { isAdminRoute } from '../util/resolver-util';

const resolvers: Resolvers = {
    Mutation: {
        userSyncWalletBalancesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.initWalletBalancesForAllPools();

            return 'success';
        },
        userInitWalletBalancesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.initWalletBalancesForAllPools();

            return 'success';
        },
        userInitWalletBalancesForPool: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            await userService.initWalletBalancesForPool(poolId);

            return 'success';
        },
        userInitStakedBalances: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.initStakedBalances();

            return 'success';
        },
        userSyncStakedBalances: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.syncStakedBalances();

            return 'success';
        },
    },
};

export default resolvers;
