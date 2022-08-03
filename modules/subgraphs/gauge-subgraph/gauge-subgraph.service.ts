import { GraphQLClient } from 'graphql-request';
import {
    GaugeLiquidityGaugesQueryVariables,
    GaugeSharesQueryVariables,
    GaugeUserGaugesQueryVariables,
    getSdk,
} from './generated/gauge-subgraph-types';
import { networkConfig } from '../../config/network-config';

export class GaugeSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(networkConfig.subgraphs.gauge);
    }
    public async getAllGauges(args: GaugeLiquidityGaugesQueryVariables) {
        const gaugesQuery = await this.sdk.GaugeLiquidityGauges(args);
        return gaugesQuery.liquidityGauges;
    }

    public async getAllGaugeAddresses(): Promise<string[]> {
        const addressesQuery = await this.sdk.GaugeLiquidityGaugeAddresses();
        return addressesQuery.liquidityGauges.map((gauge) => gauge.id);
    }

    public async getUserGauges(userAddress: string) {
        const userGaugesQuery = await this.sdk.GaugeUserGauges({ userAddress });
        return userGaugesQuery.user;
    }

    public async getAllGaugeShares(args: GaugeSharesQueryVariables) {
        const sharesQuery = await this.sdk.GaugeShares(args);
        return sharesQuery.gaugeShares;
    }

    public async getStreamers() {
        const streamersQuery = await this.sdk.GaugeStreamers();
        return streamersQuery.streamers;
    }

    public async getMetadata() {
        const { meta } = await this.sdk.GaugeGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }
        return meta;
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const gaugeSubgraphService = new GaugeSubgraphService();
