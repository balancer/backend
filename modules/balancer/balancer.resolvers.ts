import { Resolvers } from '../../schema';
import { poolsService } from './balancer.service';

const balancerResolvers: Resolvers = {
    Query: {
        pools: async (parent, {}, context) => {
            const pools = await poolsService.getPools();

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
            const latestPrice = await poolsService.getLatestPrice(id);

            if (!latestPrice) {
                throw new Error('No price found for id');
            }

            return {
                ...latestPrice,
                __typename: 'GqlBalancerTokenLatestPrice',
            };
        },
    },
};

export default balancerResolvers;
