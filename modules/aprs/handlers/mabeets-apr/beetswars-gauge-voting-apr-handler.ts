import axios from 'axios';
import { networkContext } from '../../../network/network-context.service';
import { PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { AprHandler, PoolAPRData } from '../../types';

export class BeetswarsGaugeVotingAprHandler implements AprHandler {
    private readonly FRESH_BEETS_POOL_ID = '0x10ac2f9dae6539e77e372adb14b1bf8fbd16b3e8000200000000000000000005';

    public getAprServiceName(): string {
        return 'BeetswarsGaugeVotingAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        for (const pool of pools) {
            if (pool.id !== this.FRESH_BEETS_POOL_ID) {
                continue;
            }

            const response = await axios.get('https://www.beetswars.live/api/trpc/chart.chartdata');

            const raw: number[] = response.data.result.data.json.chartdata.votingApr;

            // Filter out non-numbers and infinity values
            const votingAprs = raw.filter((apr) => apr && isFinite(apr));

            const minApr = 0;
            const maxApr = votingAprs[votingAprs.length - 1] / 100;

            const itemId = `${this.FRESH_BEETS_POOL_ID}-voting-apr`;

            aprItems.push({
                id: itemId,
                chain: networkContext.chain,
                poolId: this.FRESH_BEETS_POOL_ID,
                title: 'Voting APR*',
                apr: minApr,
                type: PrismaPoolAprType.VOTING,
                rewardTokenAddress: null,
                rewardTokenSymbol: null,
            });

            aprItems.push({
                id: `${itemId}-boost`,
                chain: networkContext.chain,
                poolId: this.FRESH_BEETS_POOL_ID,
                title: 'Voting APR Boost',
                apr: maxApr,
                type: PrismaPoolAprType.STAKING_BOOST,
                group: null,
                rewardTokenAddress: null,
                rewardTokenSymbol: null,
            });
        }
        return aprItems;
    }
}
