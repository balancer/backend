import { gaugeSubgraphService } from '../gauge-subgraph/gauge-subgraph.service';
import { Multicaller } from '../util/multicaller';
import { BALANCER_NETWORK_CONFIG } from '../balancer/src/contracts';
import { env } from '../../app/env';
import ChildChainStreamerAbi from './abi/ChildChainStreamer.json';
import { providers } from 'ethers';
import { decimal } from '../util/numbers';
import moment from 'moment-timezone';
import { balancerService } from '../balancer/balancer.service';

type GaugeRewardToken = { address: string; name: string; decimals: number; symbol: string };
type GaugeRewardTokenWithEmissions = GaugeRewardToken & { rewardsPerSecond: number };

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
    amountUSD: string;
    tokens: GaugeRewardToken[];
};

class GaugesService {
    provider = new providers.JsonRpcProvider(env.RPC_URL);

    public async getAllGauges() {
        const gauges = await gaugeSubgraphService.getAllGauges();
        // console.log(gauges);

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
            tokens: tokens?.map(({ __typename, ...rest }) => rest) ?? [],
        }));
    }

    public async getAllUserShares(userAddress: string): Promise<GaugeUserShare[]> {
        const pools = await balancerService.getPools();
        const userGauges = await gaugeSubgraphService.getUserGauges(userAddress);
        return (
            userGauges?.gaugeShares?.map((share) => {
                const pool = pools.find((pool) => pool.id === share.gauge.poolId);
                const amountUSD =
                    pool != null
                        ? (parseFloat(share.balance) / parseFloat(pool.totalShares)) * parseFloat(pool.totalLiquidity)
                        : 0;
                return {
                    gaugeAddress: share.gauge.id,
                    poolId: share.gauge.poolId,
                    amount: share.balance,
                    amountUSD: `${amountUSD}`,
                    tokens: share.gauge.tokens ?? [],
                };
            }) ?? []
        );
    }
    public async getUserSharesForPool(userAddress: string, poolId: string) {
        const userShares = await this.getAllUserShares(userAddress);
        return userShares.find((share) => share.poolId === poolId);
    }

    public async getStreamers(): Promise<GaugeStreamer[]> {
        const streamers = await gaugeSubgraphService.getStreamers();

        const multiCaller = new Multicaller(
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].multicall,
            this.provider,
            ChildChainStreamerAbi,
        );

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
                    rewardsPerSecond: isActive
                        ? decimal(rewardData.rate).div(decimal(10).pow(rewardToken.decimals)).toNumber()
                        : 0,
                });
                gaugeStreamers.push({
                    address: streamer.id,
                    gaugeAddress: streamer.gauge.id,
                    totalSupply: streamer.gauge.totalSupply,
                    poolId: streamer.gauge.poolId,
                    rewardTokens,
                });
            });
        }
        return gaugeStreamers;
    }
}

export const gaugesService = new GaugesService();
