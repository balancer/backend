import { Resolvers } from '../../schema';
import { poolsService } from './pools.service';

const poolsResolvers: Resolvers = {
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
    },
};

export default poolsResolvers;
