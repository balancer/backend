import { Resolvers } from '../../schema';
import { balancerService } from './balancer.service';

const balancerResolvers: Resolvers = {
    Query: {
        pools: async (parent, {}, context) => {
            const pools = await balancerService.getPools();

            return pools.map((pool) => ({
                ...pool,
                __typename: 'GqlBalancerPool',
                tokens: (pool.tokens || []).map((token) => ({
                    ...token,
                    __typename: 'GqlBalancerPoolToken',
                })),
            }));
        },
        poolsPastPools: async (parent, {}, context) => {
            const pools = await balancerService.getPastPools();

            return pools.map((pool) => ({
                ...pool,
                __typename: 'GqlBalancerPool',
                tokens: (pool.tokens || []).map((token) => ({
                    ...token,
                    __typename: 'GqlBalancerPoolToken',
                })),
            }));
        },
        latestPrice: async (parent, { id }, context) => {
            const latestPrice = await balancerService.getLatestPrice(id);

            if (!latestPrice) {
                throw new Error('No price found for id');
            }

            return {
                ...latestPrice,
                __typename: 'GqlBalancerTokenLatestPrice',
            };
        },
        poolSnapshots: async (parent, { poolId }, context) => {
            if (poolId === '') {
                throw new Error('invalid pool id');
            }

            return balancerService.getPoolSnapshots(poolId);
        },
    },
};

export default balancerResolvers;
