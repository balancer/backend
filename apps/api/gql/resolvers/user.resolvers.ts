import { Resolvers } from '../generated-schema';
import { isAdminRoute } from '../../../../modules/auth/auth-context';
import { UserBalancesController } from '../../../../modules/user/user-balances-controller';

const resolvers: Resolvers = {
    Query: {},
    Mutation: {
        userSyncChangedWalletBalancesForAllPools: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await UserBalancesController().syncBalances(chain);

            return 'success';
        },
        userInitWalletBalancesForAllPools: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await UserBalancesController().syncBalances(chain);

            return 'success';
        },
        userInitStakedBalances: async (parent, { stakingTypes, chain }, context) => {
            isAdminRoute(context);

            await UserBalancesController().initStakedBalances(stakingTypes, chain);

            return 'success';
        },
        userSyncChangedStakedBalances: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await UserBalancesController().syncChangedStakedBalances(chain);

            return 'success';
        },
    },
};

export default resolvers;
