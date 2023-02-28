import {
    GaugeLiquidityGaugesQueryVariables,
    GaugeSharesQueryVariables,
    getSdk,
} from './generated/gauge-subgraph-types';
import { GraphQLClient } from 'graphql-request';
import { networkContext } from '../../network/network-context.service';

export class GaugeSubgraphService {
    constructor() {}

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

    public async getGauges() {
        const gaugesQuery = await this.sdk.GaugeLiquidityGauges();
        return gaugesQuery.liquidityGauges;
    }

    public async getMetadata() {
        const { meta } = await this.sdk.GaugeGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }
        return meta;
    }

    public get sdk() {
        const client = new GraphQLClient(networkContext.data.subgraphs.gauge ?? '');

        return getSdk(client);
    }
}

export const gaugeSubgraphService = new GaugeSubgraphService();
