import moment from 'moment-timezone';
import { GaugeSubgraphService } from '../../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { Multicaller } from '../../../../web3/multicaller';
import { scaleDown } from '../../../../big-number/big-number';
import ChildChainStreamerAbi from './abi/ChildChainStreamer.json';
import {
    GaugeLiquidityGaugesQueryVariables,
    GaugeSharesQueryVariables,
} from '../../../../subgraphs/gauge-subgraph/generated/gauge-subgraph-types';
import { networkContext } from '../../../../network/network-context.service';

export type GaugeRewardToken = { id: string; decimals: number; symbol: string; rewardsPerSecond: string };
// export type GaugeRewardTokenWithEmissions = GaugeRewardToken & { rewardsPerSecond: number };

export type GaugeShare = {
    id: string;
    balance: string;
    gauge: { id: string; poolId?: string; poolAddress: string };
    user: { id: string };
};

// export type GaugeStreamer = {
//     address: string;
//     streamerAddress: string;
//     totalSupply: string;
//     poolId: string;
//     rewardTokens: GaugeRewardToken[];
// };

export type LiquidityGauge = {
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

export class GaugeSerivce {
    constructor(private readonly gaugeSubgraphService: GaugeSubgraphService) {}

    public async getAllGauges(): Promise<LiquidityGauge[]> {
        const subgraphLiquidityGauges = await this.gaugeSubgraphService.getAllGauges();

        const gauges: LiquidityGauge[] = [];
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
        return allGauges.map((gauge) => gauge.address);
    }

    public async getAllUserShares(userAddress: string): Promise<GaugeUserShare[]> {
        const userGauges = await this.gaugeSubgraphService.getUserGauges(userAddress);
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

    public async getAllGaugeShares(): Promise<GaugeShare[]> {
        const allShares = await this.gaugeSubgraphService.getAllGaugeShares();
        return allShares.map(({ id, balance, gauge, user }) => ({
            id,
            balance,
            gauge: {
                id: gauge.id,
                poolAddress: gauge.poolAddress,
                poolId: gauge.poolId || '',
            },
            user,
        }));
    }

    public async getGaugeShares(args: GaugeSharesQueryVariables): Promise<GaugeShare[]> {
        const allShares = await this.gaugeSubgraphService.getGaugeShares(args);
        return allShares.map(({ id, balance, gauge, user }) => ({
            id,
            balance,
            gauge: {
                id: gauge.id,
                poolAddress: gauge.poolAddress,
                poolId: gauge.poolId || '',
            },
            user,
        }));
    }

    public async getMetadata() {
        return this.gaugeSubgraphService.getMetadata();
    }
}

export const gaugeSerivce = new GaugeSerivce(new GaugeSubgraphService());
