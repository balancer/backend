import { GraphQLClient } from 'graphql-request';
import { env } from '../../app/env';
import { getSdk } from './generated/gauge-subgraph-types';

class GaugeSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(env.GAUGE_SUBGRAPH);
    }
    public async getAllGauges() {
        const gaugesQuery = await this.sdk.LiquidityGauges();
        return gaugesQuery.liquidityGauges;
    }

    public async getUserGauges(userAddress: string) {
        const userGaugesQuery = await this.sdk.UserGauges({ userAddress });
        return userGaugesQuery.user;
    }
    public async getStreamers() {
        const streamersQuery = await this.sdk.Streamers();
        return streamersQuery.streamers;
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const gaugeSubgraphService = new GaugeSubgraphService();
