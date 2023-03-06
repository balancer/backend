import {
    Gauge,
    GaugeFragment,
    GaugeLiquidityGaugesQueryVariables,
    GaugeShareFragment,
    GaugeSharesQueryVariables,
    GaugeShare_OrderBy,
    getSdk,
    LiquidityGauge,
    LiquidityGauge_OrderBy,
    OrderDirection,
} from './generated/gauge-subgraph-types';
import { GraphQLClient } from 'graphql-request';
import { networkContext } from '../../network/network-context.service';

export class GaugeSubgraphService {
    constructor() {}

    public async getGauges(args: GaugeLiquidityGaugesQueryVariables) {
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

    public async getGaugeShares(args: GaugeSharesQueryVariables) {
        const sharesQuery = await this.sdk.GaugeShares(args);
        return sharesQuery.gaugeShares;
    }

    public async getAllGaugeShares(): Promise<GaugeShareFragment[]> {
        const allGaugeShares: GaugeShareFragment[] = [];
        let hasMore = true;
        let id = `0`;
        const pageSize = 1000;

        while (hasMore) {
            const gauges = await this.sdk.GaugeShares({
                where: {
                    id_gt: id,
                },
                orderBy: GaugeShare_OrderBy.id,
                orderDirection: OrderDirection.asc,
                first: pageSize,
            });

            if (gauges.gaugeShares.length === 0) {
                break;
            }

            if (gauges.gaugeShares.length < pageSize) {
                hasMore = false;
            }

            allGaugeShares.push(...gauges.gaugeShares);
            id = gauges.gaugeShares[gauges.gaugeShares.length - 1].id;
        }
        return allGaugeShares;
    }

    public async getAllGauges(): Promise<GaugeFragment[]> {
        const allLiquidityGauges: GaugeFragment[] = [];
        let hasMore = true;
        let id = `0`;
        const pageSize = 1000;

        while (hasMore) {
            const gauges = await this.sdk.GaugeLiquidityGauges({
                where: {
                    id_gt: id,
                },
                orderBy: LiquidityGauge_OrderBy.id,
                orderDirection: OrderDirection.asc,
                first: pageSize,
            });

            if (gauges.liquidityGauges.length === 0) {
                break;
            }

            if (gauges.liquidityGauges.length < pageSize) {
                hasMore = false;
            }

            allLiquidityGauges.push(...gauges.liquidityGauges);
            id = gauges.liquidityGauges[gauges.liquidityGauges.length - 1].id;
        }

        return allLiquidityGauges;
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
