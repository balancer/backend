import {
    GaugeFragment,
    GaugeLiquidityGaugesQueryVariables,
    GaugeShareFragment,
    GaugeSharesQueryVariables,
    GaugeShare_OrderBy,
    getSdk,
    LiquidityGauge_OrderBy,
    OrderDirection,
} from './generated/gauge-subgraph-types';
import { GraphQLClient } from 'graphql-request';
import { networkContext } from '../../network/network-context.service';
import moment from 'moment';

export type GaugeRewardToken = { id: string; decimals: number; symbol: string; rewardsPerSecond: string };

export type LiquidityGaugeWithStatus = {
    address: string;
    streamerAddress: string;
    totalSupply: string;
    poolId: string;
    tokens: GaugeRewardToken[];
    status: LiquidityGaugeStatus;
};

export type LiquidityGaugeStatus = 'KILLED' | 'ACTIVE' | 'PREFERRED';

export type GaugeUserShare = {
    gaugeAddress: string;
    poolId: string;
    amount: string;
    tokens: GaugeRewardToken[];
};

export class GaugeSubgraphService {
    constructor() {}

    public async getGauges(args: GaugeLiquidityGaugesQueryVariables) {
        const gaugesQuery = await this.sdk.GaugeLiquidityGauges(args);
        return gaugesQuery.liquidityGauges;
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

    public async getAllGaugesWithStatus(): Promise<LiquidityGaugeWithStatus[]> {
        const subgraphLiquidityGauges = await this.getAllGauges();

        const gauges: LiquidityGaugeWithStatus[] = [];
        const tokens: GaugeRewardToken[] = [];
        for (let liquidityGauge of subgraphLiquidityGauges) {
            liquidityGauge.tokens?.forEach((rewardToken) => {
                const isActive = moment.unix(parseInt(rewardToken.periodFinish || '0')).isAfter(moment());
                tokens.push({
                    ...rewardToken,
                    rewardsPerSecond: isActive ? rewardToken.rate || '0' : '0',
                });
            });

            const gaugesForSamePool = subgraphLiquidityGauges.filter(
                (gauge) => gauge.poolId === liquidityGauge.poolId && gauge.id !== liquidityGauge.id,
            );
            let gaugeStatus: LiquidityGaugeStatus = 'PREFERRED';

            if (liquidityGauge.isKilled) {
                gaugeStatus = 'KILLED';
            } else if (gaugesForSamePool.length > 0 && !liquidityGauge.isPreferentialGauge) {
                gaugeStatus = 'ACTIVE';
            }

            gauges.push({
                address: liquidityGauge.id,
                streamerAddress: liquidityGauge.streamer || '',
                totalSupply: liquidityGauge.totalSupply,
                poolId: liquidityGauge.poolId || '',
                tokens,
                status: gaugeStatus,
            });
        }
        return gauges;
    }

    public async getAllGaugeAddresses(): Promise<string[]> {
        const allGauges = await this.getAllGauges();
        return allGauges.map((gauge) => gauge.id);
    }

    public async getAllUserShares(userAddress: string): Promise<GaugeUserShare[]> {
        const userGauges = await this.getUserGauges(userAddress);
        return (
            userGauges?.gaugeShares?.map((share) => ({
                gaugeAddress: share.gauge.id,
                poolId: share.gauge.poolId || '',
                amount: share.balance,
                tokens:
                    share.gauge.tokens?.map((token) => ({
                        ...token,
                        rewardsPerSecond: token.rate || '',
                    })) || [],
            })) ?? []
        );
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
