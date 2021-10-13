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
    BalancerTokenPricesQuery,
    BalancerTokenPricesQueryVariables,
    BalancerUserQuery,
    BalancerUserQueryVariables,
    getSdk,
} from './generated/balancer-subgraph-types';
import { env } from '../../app/env';
import _ from 'lodash';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import { getHourlyTimestampRanges } from '../util/time';

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

    public async getHistoricalTokenPrices({
        address,
        poolId,
        pricingAsset,
        days,
    }: {
        address: string;
        poolId: string;
        pricingAsset: string;
        days: number;
    }) {
        const timestamps = getHourlyTimestampRanges(days).map((timestamp) => `${timestamp}`);
        const blocks = await blocksSubgraphService.getBlocks({ where: { timestamp_in: timestamps } });

        /*const prices = await this.getTokenPrices({
            where: {
                asset: address,
                poolId,
                timestamp_in: timestamps,
            },
        });*/

        console.log('blocks', JSON.stringify(blocks, null, 4));
    }

    private get sdk() {
        return getSdk(this.client);
    }
}

export const balancerService = new BalancerSubgraphService();
