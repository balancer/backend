import { GraphQLClient } from 'graphql-request';
import {
    Balancer,
    BalancerAmpUpdateFragment,
    BalancerAmpUpdatesQueryVariables,
    BalancerGradualWeightUpdateFragment,
    BalancerGradualWeightUpdatesQuery,
    BalancerGradualWeightUpdatesQueryVariables,
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
import { env } from '../../../app/env';
import _ from 'lodash';
import { subgraphLoadAll } from '../subgraph-util';
import { Cache, CacheClass } from 'memory-cache';
import { fiveMinutesInMs, fiveMinutesInSeconds, twentyFourHoursInMs } from '../../common/time';
import { BalancerUserPoolShare } from './balancer-subgraph-types';
import { networkConfig } from '../../config/network-config';

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
        this.client = new GraphQLClient(networkConfig.subgraphs.balancer);
    }

    public async getMetadata() {
        const { meta } = await this.sdk.BalancerGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }

        return meta;
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

    public async getAllGradualWeightUpdates(
        args: BalancerGradualWeightUpdatesQueryVariables,
    ): Promise<BalancerGradualWeightUpdateFragment[]> {
        return subgraphLoadAll<BalancerGradualWeightUpdateFragment>(
            this.sdk.BalancerGradualWeightUpdates,
            'gradualWeightUpdates',
            args,
        );
    }

    public async getAllAmpUpdates(args: BalancerAmpUpdatesQueryVariables): Promise<BalancerAmpUpdateFragment[]> {
        return subgraphLoadAll<BalancerAmpUpdateFragment>(this.sdk.BalancerAmpUpdates, 'ampUpdates', args);
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

    public async getAllPools(
        args: BalancerPoolsQueryVariables,
        applyTotalSharesFilter = true,
    ): Promise<BalancerPoolFragment[]> {
        return subgraphLoadAll<BalancerPoolFragment>(this.sdk.BalancerPools, 'pools', {
            ...args,
            where: {
                totalShares_not: applyTotalSharesFilter ? '0.00000000001' : undefined,
                ...args.where,
            },
        });
    }

    public async getPoolJoinExits(args: BalancerJoinExitsQueryVariables): Promise<BalancerJoinExitsQuery> {
        return this.sdk.BalancerJoinExits(args);
    }

    public async getPortfolioPoolsData(previousBlockNumber: number): Promise<BalancerPortfolioPoolsDataQuery> {
        const cached = this.cache.get(PORTFOLIO_POOLS_CACHE_KEY) as BalancerPortfolioPoolsDataQuery | null;

        if (cached) {
            return cached;
        }

        const portfolioPools = await this.sdk.BalancerPortfolioPoolsData({ previousBlockNumber });

        this.cache.put(PORTFOLIO_POOLS_CACHE_KEY, portfolioPools, fiveMinutesInMs);

        return portfolioPools;
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

    public async getPoolsWithActiveUpdates(timestamp: number): Promise<string[]> {
        const { ampUpdates, gradualWeightUpdates } = await this.sdk.BalancerGetPoolsWithActiveUpdates({ timestamp });

        return [...ampUpdates, ...gradualWeightUpdates].map((item) => item.poolId.id);
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
