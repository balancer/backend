import { Resolvers } from '../generated-schema';
import { isAdminRoute } from '../../../../modules/auth/auth-context';
import { headerChain } from '../../../../modules/context/header-chain';
import { GraphQLError } from 'graphql';
import { UserBalancesController } from '../../../../modules/user/user-balances-controller';

const resolvers: Resolvers = {
    Query: {},
    Mutation: {
        userSyncChangedWalletBalancesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            const chain = headerChain();
            if (!chain) {
                throw new GraphQLError('Provide "chainId" param', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }

            await UserBalancesController().syncBalances(chain);

            return 'success';
        },
        userInitWalletBalancesForAllPools: async (parent, { chain }, context) => {
            isAdminRoute(context);

            if (!chain) {
                throw new GraphQLError('Provide "chain" param', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }

            await UserBalancesController().syncBalances(chain);

            return 'success';
        },
        userInitStakedBalances: async (parent, { stakingTypes }, context) => {
            isAdminRoute(context);
            const chain = headerChain() || 'MAINNET';

            await UserBalancesController().initStakedBalances(stakingTypes, chain);

            return 'success';
        },
        userSyncChangedStakedBalances: async (parent, {}, context) => {
            isAdminRoute(context);
            const chain = headerChain() || 'MAINNET';

            await UserBalancesController().syncChangedStakedBalances(chain);

            return 'success';
        },
    },
};

export default resolvers;
