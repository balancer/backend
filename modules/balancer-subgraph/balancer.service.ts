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
    BalancerUserQuery,
    BalancerUserQueryVariables,
    getSdk,
    OrderDirection,
    TokenPrice_OrderBy,
} from './generated/balancer-subgraph-types';
import { env } from '../../app/env';
import _ from 'lodash';
import { fiveMinutesInSeconds, getDailyTimestampRanges, getHourlyTimestamps } from '../util/time';

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

    public async getAllTokenPrices(args: BalancerTokenPricesQueryVariables): Promise<BalancerTokenPriceFragment[]> {
        let allTokenPrices: BalancerTokenPriceFragment[] = [];
        const limit = 1000;
        let skip = 0;
        let hasMore = true;

        while (hasMore) {
            const { tokenPrices } = await this.getTokenPrices({
                ...args,
                first: limit,
                skip,
            });

            allTokenPrices = [...allTokenPrices, ...tokenPrices];
            skip += limit;
            hasMore = tokenPrices.length === limit;
        }

        return allTokenPrices;
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

    private get sdk() {
        return getSdk(this.client);
    }
}

export const balancerService = new BalancerSubgraphService();
