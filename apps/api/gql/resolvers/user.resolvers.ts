import { Resolvers } from '../generated-schema';
import { getRequiredAccountAddress, isAdminRoute } from '../../../../modules/auth/auth-context';
import { tokenService } from '../../../../modules/token/token.service';
import { headerChain } from '../../../../modules/context/header-chain';
import { GraphQLError } from 'graphql';
import { UserBalancesController } from '../../../../modules/user/user-balances-controller';

const resolvers: Resolvers = {
    Query: {
        userGetPoolBalances: async (parent, { chains, address }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new GraphQLError('Provide "chains" param', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }
            const accountAddress = address || getRequiredAccountAddress(context);
            const tokenPrices = await tokenService.getTokenPricesForChains(chains);
            const balances = await UserBalancesController().getUserPoolBalances(accountAddress, chains);

            return balances.map((balance) => ({
                ...balance,
                tokenPrice: tokenService.getPriceForToken(
                    tokenPrices[balance.chain] || [],
                    balance.tokenAddress,
                    balance.chain,
                ),
            }));
        },
        userGetStaking: async (parent, { chains, address }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new GraphQLError('Provide "chains" param', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }
            const accountAddress = address || getRequiredAccountAddress(context);

            return UserBalancesController().getUserStaking(accountAddress, chains);
        },
    },
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
