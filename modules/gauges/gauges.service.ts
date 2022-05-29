import { gaugeSubgraphService } from '../gauge-subgraph/gauge-subgraph.service';

export type GaugeStreamer = {
    address: string;
    gaugeAddress: string;
    gaugeTvl: string;
    poolId: string;
    rewardTokens: { address: string; decimals: number; symbol: string }[];
};

class GaugesService {
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

    public async getUserShares(userAddress: string) {
        const userGauges = await gaugeSubgraphService.getUserGauges(userAddress);
        return (
            userGauges?.gaugeShares?.map((share) => ({
                gaugeAddress: share.gauge.id,
                poolId: share.gauge.poolId,
                amount: share.balance,
            })) ?? []
        );
    }

    public async getStreamers(): Promise<GaugeStreamer[]> {
        const streamers = await gaugeSubgraphService.getStreamers();
        return streamers.map((streamer) => ({
            address: streamer.id,
            gaugeAddress: streamer.gauge.id,
            gaugeTvl: streamer.gauge.totalSupply,
            poolId: streamer.gauge.poolId,
            rewardTokens: streamer.rewardTokens ?? [],
        }));
    }
}

export const gaugesService = new GaugesService();
