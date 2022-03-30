import { GraphQLClient } from 'graphql-request';
import {
    Balancer,
    BalancerJoinExitFragment,
    BalancerJoinExitsQuery,
    BalancerJoinExitsQueryVariables,
    BalancerLatestPriceFragment,
    BalancerLatestPricesQuery,
    BalancerLatestPricesQueryVariables,
    BalancerPoolFragment,
    BalancerPoolQuery,
    BalancerPoolQueryVariables,
    BalancerPoolShareFragment,
    BalancerPoolSharesQuery,
    BalancerPoolSharesQueryVariables,
    BalancerPoolSnapshotFragment,
    BalancerPoolSnapshotsQuery,
    BalancerPoolSnapshotsQueryVariables,
    BalancerPoolsQuery,
    BalancerPoolsQueryVariables,
    BalancerPortfolioDataQuery,
    BalancerPortfolioPoolsDataQuery,
    BalancerProtocolDataQueryVariables,
    BalancerSwapFragment,
    BalancerSwapsQuery,
    BalancerSwapsQueryVariables,
    BalancerTokenPriceFragment,
    BalancerTokenPricesQuery,
    BalancerTokenPricesQueryVariables,
    BalancerTradePairSnapshotsQuery,
    BalancerTradePairSnapshotsQueryVariables,
    BalancerUserFragment,
    BalancerUsersQueryVariables,
    getSdk,
} from './generated/balancer-subgraph-types';
import { env } from '../../app/env';
import _ from 'lodash';
import { subgraphLoadAll, subgraphPurgeCacheKeyAtBlock } from '../util/subgraph-util';
import { Cache, CacheClass } from 'memory-cache';
import { fiveMinutesInMs, fiveMinutesInSeconds, twentyFourHoursInMs } from '../util/time';
import { cache } from '../cache/cache';
import { BalancerUserPoolShare } from './balancer-subgraph-types';

const ALL_USERS_CACHE_KEY = 'balance-subgraph_all-users';
const ALL_POOLS_CACHE_KEY = 'balance-subgraph_all-pools';
const ALL_JOIN_EXITS_CACHE_KEY = 'balance-subgraph_all-join-exits';
const PORTFOLIO_POOLS_CACHE_KEY = 'balance-subgraph_portfolio-pools';
const USER_CACHE_KEY_PREFIX = 'balance-subgraph_user:';

export class BalancerSubgraphService {
    private cache: CacheClass<string, any>;
    private readonly client: GraphQLClient;

    constructor() {
        this.cache = new Cache<string, any>();
        this.client = new GraphQLClient(env.BALANCER_SUBGRAPH);
    }

    public async getProtocolData(args: BalancerProtocolDataQueryVariables): Promise<Balancer> {
        const { balancers } = await this.sdk.BalancerProtocolData(args);

        if (balancers.length === 0) {
            throw new Error('Missing protocol data');
        }

        //There is only ever one
        return balancers[0] as Balancer;
    }

    public async getTokenPrices(args: BalancerTokenPricesQueryVariables): Promise<BalancerTokenPricesQuery> {
        return this.sdk.BalancerTokenPrices(args);
    }

    public async getPoolSnapshots(args: BalancerPoolSnapshotsQueryVariables): Promise<BalancerPoolSnapshotsQuery> {
        return this.sdk.BalancerPoolSnapshots(args);
    }

    public async getAllPoolSnapshots(
        args: BalancerPoolSnapshotsQueryVariables,
    ): Promise<BalancerPoolSnapshotFragment[]> {
        return subgraphLoadAll<BalancerPoolSnapshotFragment>(this.sdk.BalancerPoolSnapshots, 'poolSnapshots', args);
    }

    public async getPools(args: BalancerPoolsQueryVariables): Promise<BalancerPoolsQuery> {
        return this.sdk.BalancerPools(args);
    }

    public async getSwaps(args: BalancerSwapsQueryVariables): Promise<BalancerSwapsQuery> {
        return this.sdk.BalancerSwaps(args);
    }

    public async getAllSwaps(args: BalancerSwapsQueryVariables): Promise<BalancerSwapFragment[]> {
        return subgraphLoadAll<BalancerSwapFragment>(this.sdk.BalancerSwaps, 'swaps', args);
    }

    public async getPool(args: BalancerPoolQueryVariables): Promise<BalancerPoolQuery> {
        return this.sdk.BalancerPool(args);
    }

    public async getPortfolioData(id: string, previousBlockNumber: number): Promise<BalancerPortfolioDataQuery> {
        return this.sdk.BalancerPortfolioData({ id, previousBlockNumber });
    }

    public async getUser(userAddress: string): Promise<BalancerUserFragment | null> {
        const { users } = await this.sdk.BalancerUsers({ where: { id: userAddress.toLowerCase() }, first: 1 });

        if (users.length === 0) {
            return null;
        }

        return this.normalizeBalancerUser(users[0]);
    }

    public async getAllUsers(args: BalancerUsersQueryVariables): Promise<BalancerUserFragment[]> {
        const users = await subgraphLoadAll<BalancerUserFragment>(this.sdk.BalancerUsers, 'users', args);

        return users.map((user) => this.normalizeBalancerUser(user));
    }

    public async getPoolShares(args: BalancerPoolSharesQueryVariables): Promise<BalancerUserPoolShare[]> {
        const { poolShares } = await this.sdk.BalancerPoolShares(args);

        return poolShares.map((shares) => ({
            ...shares,
            //ensure the user balance isn't negative, unsure how the subgraph ever allows this to happen
            balance: parseFloat(shares.balance) < 0 ? '0' : shares.balance,
            poolAddress: shares.id.split('-')[0],
            userAddress: shares.id.split('-')[1],
        }));
    }

    public async getAllPoolShares(args: BalancerPoolSharesQueryVariables): Promise<BalancerUserPoolShare[]> {
        const poolShares = await subgraphLoadAll<BalancerPoolShareFragment>(
            this.sdk.BalancerPoolShares,
            'poolShares',
            args,
        );

        return poolShares.map((shares) => ({
            ...shares,
            //ensure the user balance isn't negative, unsure how the subgraph ever allows this to happen
            balance: parseFloat(shares.balance) < 0 ? '0' : shares.balance,
            poolAddress: shares.id.split('-')[0],
            userAddress: shares.id.split('-')[1],
        }));
    }

    public async getLatestPrices(args: BalancerLatestPricesQueryVariables): Promise<BalancerLatestPricesQuery> {
        return this.sdk.BalancerLatestPrices(args);
    }

    public async getLatestPrice(id: string): Promise<BalancerLatestPriceFragment | null> {
        const { latestPrice } = await this.sdk.BalancerLatestPrice({ id });

        return latestPrice || null;
    }

    public async getAllTokenPrices(args: BalancerTokenPricesQueryVariables): Promise<BalancerTokenPriceFragment[]> {
        return subgraphLoadAll<BalancerTokenPriceFragment>(this.sdk.BalancerTokenPrices, 'tokenPrices', args);
    }

    public async getAllPools(args: BalancerPoolsQueryVariables): Promise<BalancerPoolFragment[]> {
        return subgraphLoadAll<BalancerPoolFragment>(this.sdk.BalancerPools, 'pools', args);
    }

    public async getPoolJoinExits(args: BalancerJoinExitsQueryVariables): Promise<BalancerJoinExitsQuery> {
        return this.sdk.BalancerJoinExits(args);
    }

    public async cachePortfolioPoolsData(previousBlockNumber: number): Promise<BalancerPortfolioPoolsDataQuery> {
        const response = await this.sdk.BalancerPortfolioPoolsData({ previousBlockNumber });

        await cache.putObjectValue(PORTFOLIO_POOLS_CACHE_KEY, response, 5);

        return response;
    }

    public async getPortfolioPoolsData(previousBlockNumber: number): Promise<BalancerPortfolioPoolsDataQuery> {
        const memCached = this.cache.get(PORTFOLIO_POOLS_CACHE_KEY) as BalancerPortfolioPoolsDataQuery | null;

        if (memCached) {
            return memCached;
        }

        const cached = await cache.getObjectValue<BalancerPortfolioPoolsDataQuery>(PORTFOLIO_POOLS_CACHE_KEY);

        if (cached) {
            this.cache.put(PORTFOLIO_POOLS_CACHE_KEY, cached, fiveMinutesInMs);

            return cached;
        }

        return this.cachePortfolioPoolsData(previousBlockNumber);
    }

    public async getAllPoolsAtBlock(block: number): Promise<BalancerPoolFragment[]> {
        const cached = this.cache.get(`${ALL_POOLS_CACHE_KEY}:${block}`) as BalancerPoolFragment[] | null;

        if (cached) {
            return cached;
        }

        const { pools } = await this.sdk.BalancerPools({
            first: 1000,
            where: { totalShares_gt: '0' },
            block: { number: block },
        });

        this.cache.put(`${ALL_POOLS_CACHE_KEY}:${block}`, pools, twentyFourHoursInMs);

        return pools;
    }

    public async getTradePairSnapshots(
        args: BalancerTradePairSnapshotsQueryVariables,
    ): Promise<BalancerTradePairSnapshotsQuery> {
        return this.sdk.BalancerTradePairSnapshots(args);
    }

    public async clearCacheAtBlock(block: number) {
        await subgraphPurgeCacheKeyAtBlock(ALL_USERS_CACHE_KEY, block);
        await subgraphPurgeCacheKeyAtBlock(ALL_POOLS_CACHE_KEY, block);
        await subgraphPurgeCacheKeyAtBlock(ALL_JOIN_EXITS_CACHE_KEY, block);
    }

    public async clearPoolsAtBlock(block: number) {
        await subgraphPurgeCacheKeyAtBlock(ALL_POOLS_CACHE_KEY, block);
    }

    private get sdk() {
        return getSdk(this.client);
    }

    private normalizeBalancerUser(user: BalancerUserFragment): BalancerUserFragment {
        return {
            ...user,
            sharesOwned: user.sharesOwned?.map((shares) => ({
                ...shares,
                //ensure the user balance isn't negative, unsure how the subgraph ever allows this to happen
                balance: parseFloat(shares.balance) < 0 ? '0' : shares.balance,
            })),
        };
    }
}

export const balancerSubgraphService = new BalancerSubgraphService();
