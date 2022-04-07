import { Resolvers } from '../../schema';
import { balancerService } from './balancer.service';
import { v4 as uuidv4 } from 'uuid';

const balancerResolvers: Resolvers = {
    Query: {
        pool: async (parent, { id }, context) => {
            const pool = await balancerService.getPool(id);

            return {
                ...pool,
                __typename: 'GqlBalancerPool',
                tokens: (pool.tokens || []).map((token) => ({
                    ...token,
                    __typename: 'GqlBalancerPoolToken',
                })),
            };
        },
        pools: async (parent, {}, context) => {
            const id = uuidv4();
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
        poolsJSON: async (parent, {}, context) => {
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
                symbol: pool.symbol || '',
                __typename: 'GqlBalancerPool',
                tokens: (pool.tokens || []).map((token) => ({
                    ...token,
                    __typename: 'GqlBalancerPoolToken',
                })),
                apr: { total: '0', items: [], hasRewardApr: false, swapApr: '0', beetsApr: '0', thirdPartyApr: '0' },
                volume24h: '',
                fees24h: '',
                farmTotalLiquidity: '',
                composition: {
                    tokens: [],
                },
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
        balancerGetTopTradingPairs: async (parent, {}, context) => {
            const tradePairSnapshots = await balancerService.getTopTradingPairs();

            return tradePairSnapshots.map((snapshot) => ({
                ...snapshot,
                __typename: 'GqlBalancerTradePairSnapshot',
                pair: {
                    ...snapshot.pair,
                    __typename: 'GqlBalancerTradePair',
                    token0: {
                        ...snapshot.pair.token0,
                        __typename: 'GqlBalancerTradePairToken',
                        symbol: snapshot.pair.token0.symbol || '',
                    },
                    token1: {
                        ...snapshot.pair.token1,
                        __typename: 'GqlBalancerTradePairToken',
                        symbol: snapshot.pair.token1.symbol || '',
                    },
                },
            }));
        },
        poolGet24hData: async (parent, { poolId }, context) => {
            if (poolId === '') {
                throw new Error('invalid pool id');
            }

            return balancerService.poolGet24hData(poolId);
        },
        balancerGetPoolActivities: async (parent, { input }, context) => {
            return balancerService.getPoolActivities(input);
        },
    },
};

export default balancerResolvers;
