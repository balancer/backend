import { GraphQLClient } from 'graphql-request';
import {
    Balancer,
    BalancerJoinExitFragment,
    BalancerJoinExitsQueryVariables,
    BalancerLatestPriceFragment,
    BalancerPoolFragment,
    BalancerPoolQuery,
    BalancerPoolQueryVariables,
    BalancerPoolSnapshotsQuery,
    BalancerPoolSnapshotsQueryVariables,
    BalancerPoolsQuery,
    BalancerPoolsQueryVariables,
    BalancerPortfolioDataQuery,
    BalancerPortfolioPoolsDataQuery,
    BalancerProtocolDataQueryVariables,
    BalancerTokenPriceFragment,
    BalancerTokenPricesQuery,
    BalancerTokenPricesQueryVariables,
    BalancerUserFragment,
    BalancerUsersQueryVariables,
    getSdk,
} from './generated/balancer-subgraph-types';
import { env } from '../../app/env';
import _ from 'lodash';
import { subgraphLoadAll, subgraphLoadAllAtBlock, subgraphPurgeCacheKeyAtBlock } from '../util/subgraph-util';
import { cache } from '../cache/cache';

const ALL_USERS_CACHE_KEY = 'balance-subgraph_all-users';
const ALL_POOLS_CACHE_KEY = 'balance-subgraph_all-pools';
const ALL_JOIN_EXITS_CACHE_KEY = 'balance-subgraph_all-join-exits';
const PORTFOLIO_POOLS_CACHE_KEY = 'balance-subgraph_portfolio-pools';

export class BalancerSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
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

    public async getPools(args: BalancerPoolsQueryVariables): Promise<BalancerPoolsQuery> {
        return this.sdk.BalancerPools(args);
    }

    public async getPool(args: BalancerPoolQueryVariables): Promise<BalancerPoolQuery> {
        return this.sdk.BalancerPool(args);
    }

    public async getPortfolioData(id: string, previousBlockNumber: number): Promise<BalancerPortfolioDataQuery> {
        return this.sdk.BalancerPortfolioData({ id, previousBlockNumber });
    }

    public getUniqueTokenAddressesFromPools(pools: BalancerPoolFragment[]): string[] {
        return _.uniq(_.flatten(pools.map((pool) => (pool.tokens || []).map((token) => token.address))));
    }

    public async getAllUsers(args: BalancerUsersQueryVariables): Promise<BalancerUserFragment[]> {
        const users = await subgraphLoadAll<BalancerUserFragment>(this.sdk.BalancerUsers, 'users', args);

        return users.map((user) => this.normalizeBalancerUser(user));
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

    public async cachePortfolioPoolsData(previousBlockNumber: number): Promise<BalancerPortfolioPoolsDataQuery> {
        const response = await this.sdk.BalancerPortfolioPoolsData({ previousBlockNumber });

        await cache.putObjectValue(PORTFOLIO_POOLS_CACHE_KEY, response, 5);

        return response;
    }

    public async getPortfolioPoolsData(previousBlockNumber: number): Promise<BalancerPortfolioPoolsDataQuery> {
        const cachedData = await cache.getObjectValue<BalancerPortfolioPoolsDataQuery>(PORTFOLIO_POOLS_CACHE_KEY);

        if (cachedData) {
            return cachedData;
        }

        return this.cachePortfolioPoolsData(previousBlockNumber);
    }

    public async getAllUsersAtBlock(block: number): Promise<BalancerUserFragment[]> {
        const users = await subgraphLoadAllAtBlock<BalancerUserFragment>(
            this.sdk.BalancerUsers,
            'users',
            block,
            ALL_USERS_CACHE_KEY,
        );

        return users.map((user) => this.normalizeBalancerUser(user));
    }

    public async getAllPoolsAtBlock(block: number): Promise<BalancerPoolFragment[]> {
        return subgraphLoadAllAtBlock<BalancerPoolFragment>(
            this.sdk.BalancerPools,
            'pools',
            block,
            ALL_POOLS_CACHE_KEY,
            { where: { totalShares_gt: '0' } },
        );
    }

    public async getUserAtBlock(address: string, block: number): Promise<BalancerUserFragment | null> {
        const users = await this.getAllUsersAtBlock(block);

        return users.find((user) => user.id === address) || null;
    }

    public async getAllJoinExits(args: BalancerJoinExitsQueryVariables): Promise<BalancerJoinExitFragment[]> {
        return subgraphLoadAll<BalancerJoinExitFragment>(this.sdk.BalancerJoinExits, 'joinExits', args);
    }

    public async getAllJoinExitsAtBlock(block: number): Promise<BalancerJoinExitFragment[]> {
        return subgraphLoadAllAtBlock<BalancerJoinExitFragment>(
            this.sdk.BalancerJoinExits,
            'joinExits',
            block,
            ALL_JOIN_EXITS_CACHE_KEY,
        );
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

export const balancerService = new BalancerSubgraphService();
