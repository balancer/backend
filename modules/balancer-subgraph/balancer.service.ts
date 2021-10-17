import { GraphQLClient } from 'graphql-request';
import {
    Balancer,
    BalancerPoolFragment,
    BalancerPoolQuery,
    BalancerPoolQueryVariables,
    BalancerPoolSnapshotsQuery,
    BalancerPoolSnapshotsQueryVariables,
    BalancerPoolsQuery,
    BalancerPoolsQueryVariables,
    BalancerProtocolDataQueryVariables,
    BalancerTokenPriceFragment,
    BalancerTokenPricesQuery,
    BalancerTokenPricesQueryVariables,
    BalancerUserFragment,
    BalancerUserQuery,
    BalancerUserQueryVariables,
    BalancerUsersQueryVariables,
    getSdk,
} from './generated/balancer-subgraph-types';
import { env } from '../../app/env';
import _ from 'lodash';
import { subgraphLoadAll, subgraphLoadAllAtBlock } from '../util/subgraph-util';
import { cache } from '../cache/cache';
import { thirtyDaysInSeconds } from '../util/time';

const ALL_USERS_CACHE_KEY = 'balance-subgraph_all-users';
const ALL_POOLS_CACHE_KEY = 'balance-subgraph_all-pools';

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
        return balancers[0];
    }

    public async getUser(args: BalancerUserQueryVariables): Promise<BalancerUserQuery> {
        return this.sdk.BalancerUser(args);
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

    public getUniqueTokenAddressesFromPools(pools: BalancerPoolFragment[]): string[] {
        return _.uniq(_.flatten(pools.map((pool) => (pool.tokens || []).map((token) => token.address))));
    }

    public async getAllUsers(args: BalancerUsersQueryVariables): Promise<BalancerUserFragment[]> {
        return subgraphLoadAll<BalancerUserFragment>(this.sdk.BalancerUsers, 'users', args);
    }

    public async getAllTokenPrices(args: BalancerTokenPricesQueryVariables): Promise<BalancerTokenPriceFragment[]> {
        return subgraphLoadAll<BalancerTokenPriceFragment>(this.sdk.BalancerTokenPrices, 'tokenPrices', args);
    }

    public async getAllPools(args: BalancerPoolsQueryVariables): Promise<BalancerPoolFragment[]> {
        return subgraphLoadAll<BalancerPoolFragment>(this.sdk.BalancerPools, 'pools', args);
    }

    public async getAllUsersAtBlock(block: number): Promise<BalancerUserFragment[]> {
        return subgraphLoadAllAtBlock<BalancerUserFragment>(
            this.sdk.BalancerUsers,
            'users',
            block,
            ALL_USERS_CACHE_KEY,
        );
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

    private get sdk() {
        return getSdk(this.client);
    }
}

export const balancerService = new BalancerSubgraphService();
