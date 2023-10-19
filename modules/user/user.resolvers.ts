import { Resolvers } from '../../schema';
import { userService } from './user.service';
import { getRequiredAccountAddress, isAdminRoute } from '../auth/auth-context';
import { tokenService } from '../token/token.service';
import { headerChain } from '../context/header-chain';

const resolvers: Resolvers = {
    Query: {
        userGetPoolBalances: async (parent, { chains, address }, context) => {
            const currentChain = headerChain()
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                chains = [];
            }
            const accountAddress = address || getRequiredAccountAddress(context);
            const tokenPrices = await tokenService.getTokenPricesForChains(chains);
            const balances = await userService.getUserPoolBalances(accountAddress, chains);

            return balances.map((balance) => ({
                ...balance,
                tokenPrice: tokenService.getPriceForToken(tokenPrices[balance.chain] || [], balance.tokenAddress),
            }));
        },
        userGetPoolJoinExits: async (parent, { first, skip, poolId }, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            return userService.getUserPoolInvestments(accountAddress, poolId, first, skip);
        },
        userGetSwaps: async (parent, { first, skip, poolId }, context) => {
            const accountAddress = getRequiredAccountAddress(context);
            return userService.getUserSwaps(accountAddress, poolId, first, skip);
        },
        userGetStaking: async (parent, {}, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            return userService.getUserStaking(accountAddress);
        },
    },
    Mutation: {
        userSyncChangedWalletBalancesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.syncChangedWalletBalancesForAllPools();

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
        userInitStakedBalances: async (parent, { stakingTypes }, context) => {
            isAdminRoute(context);

            await userService.initStakedBalances(stakingTypes);

            return 'success';
        },
        userSyncChangedStakedBalances: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.syncChangedStakedBalances();

            return 'success';
        },
        userSyncBalance: async (parent, { poolId }, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            await userService.syncUserBalance(accountAddress, poolId);

            return 'success';
        },
        userSyncBalanceAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            const accountAddress = getRequiredAccountAddress(context);

            await userService.syncUserBalanceAllPools(accountAddress);

            return 'success';
        },
    },
};

export default resolvers;
