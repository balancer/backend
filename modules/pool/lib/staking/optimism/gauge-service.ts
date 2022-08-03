import moment from 'moment-timezone';
import { Provider } from '@ethersproject/providers';
import { GaugeSubgraphService } from '../../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { Multicaller } from '../../../../web3/multicaller';
import { scaleDown } from '../../../../big-number/big-number';
import { networkConfig } from '../../../../config/network-config';
import ChildChainStreamerAbi from './abi/ChildChainStreamer.json';
import { jsonRpcProvider } from '../../../../web3/contract';
import {
    GaugeLiquidityGaugesQueryVariables,
    GaugeSharesQueryVariables,
} from '../../../../subgraphs/gauge-subgraph/generated/gauge-subgraph-types';

export type GaugeRewardToken = { address: string; name: string; decimals: number; symbol: string };
export type GaugeRewardTokenWithEmissions = GaugeRewardToken & { rewardsPerSecond: number };

export type GaugeShare = {
    id: string;
    balance: string;
    gauge: { id: string; poolId: string; poolAddress: string };
    user: { id: string };
};

export type GaugeStreamer = {
    address: string;
    gaugeAddress: string;
    totalSupply: string;
    poolId: string;
    rewardTokens: GaugeRewardTokenWithEmissions[];
};

export type GaugeUserShare = {
    gaugeAddress: string;
    poolId: string;
    amount: string;
    tokens: GaugeRewardToken[];
};

export class GaugeSerivce {
    constructor(private readonly provider: Provider, private readonly gaugeSubgraphService: GaugeSubgraphService) {}

    public async getStreamers(): Promise<GaugeStreamer[]> {
        const streamers = await this.gaugeSubgraphService.getStreamers();

        const multiCaller = new Multicaller(networkConfig.multicall, this.provider, ChildChainStreamerAbi);

        for (let streamer of streamers) {
            streamer.rewardTokens?.forEach((rewardToken) => {
                multiCaller.call(streamer.id + rewardToken.address, streamer.id, 'reward_data', [rewardToken.address]);
            });
        }

        const rewardDataResult = (await multiCaller.execute()) as Record<
            string,
            { rate: string; period_finish: string }
        >;

        const gaugeStreamers: GaugeStreamer[] = [];
        for (let streamer of streamers) {
            const rewardTokens: GaugeRewardTokenWithEmissions[] = [];
            streamer.rewardTokens?.forEach((rewardToken) => {
                const rewardData = rewardDataResult[streamer.id + rewardToken.address];
                const isActive = moment.unix(parseInt(rewardData.period_finish)).isAfter(moment());
                rewardTokens.push({
                    ...rewardToken,
                    rewardsPerSecond: isActive ? scaleDown(rewardData.rate, rewardToken.decimals).toNumber() : 0,
                });
            });
            gaugeStreamers.push({
                address: streamer.id,
                gaugeAddress: streamer.gauge.id,
                totalSupply: streamer.gauge.totalSupply,
                poolId: streamer.gauge.poolId,
                rewardTokens,
            });
        }
        return gaugeStreamers;
    }

    public async getAllGaugeAddresses(): Promise<string[]> {
        return await this.gaugeSubgraphService.getAllGaugeAddresses();
    }

    public async getAllGauges(args: GaugeLiquidityGaugesQueryVariables) {
        const gauges = await this.gaugeSubgraphService.getAllGauges(args);

        return gauges.map(({ id, poolId, totalSupply, shares, tokens }) => ({
            id,
            address: id,
            poolId,
            totalSupply,
            shares:
                shares?.map((share) => ({
                    userAddress: share.user.id,
                    amount: share.balance,
                })) ?? [],
            tokens: tokens,
        }));
    }
    public async getAllUserShares(userAddress: string): Promise<GaugeUserShare[]> {
        const userGauges = await this.gaugeSubgraphService.getUserGauges(userAddress);
        return (
            userGauges?.gaugeShares?.map((share) => ({
                gaugeAddress: share.gauge.id,
                poolId: share.gauge.poolId,
                amount: share.balance,
                tokens: share.gauge.tokens ?? [],
            })) ?? []
        );
    }

    public async getAllGaugeShares(args: GaugeSharesQueryVariables): Promise<GaugeShare[]> {
        return await this.gaugeSubgraphService.getAllGaugeShares(args);
    }

    public async getMetadata() {
        return this.gaugeSubgraphService.getMetadata();
    }
}

export const gaugeSerivce = new GaugeSerivce(jsonRpcProvider, new GaugeSubgraphService());
