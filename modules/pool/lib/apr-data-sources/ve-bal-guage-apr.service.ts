import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { PoolAprService } from '../../pool-types';
import { TokenService } from '../../../token/token.service';
import { secondsPerYear } from '../../../common/time';
import { PrismaPoolAprItem } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { networkContext } from '../../../network/network-context.service';
import { GaugeSubgraphService } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';

export class GaugeAprService implements PoolAprService {
    constructor(
        private readonly gaugeSubgraphService: GaugeSubgraphService,
        private readonly tokenService: TokenService,
        private readonly primaryTokens: string[],
    ) {}

    public getAprServiceName(): string {
        return 'GaugeAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const operations: any[] = [];
        const gauges = await this.gaugeSubgraphService.getAllGaugesWithStatus();
        const tokenPrices = await this.tokenService.getTokenPrices();
        for (const pool of pools) {
            let gauge;
            for (const stake of pool.staking) {
                gauge = gauges.find(
                    (subgraphGauge) =>
                        subgraphGauge.address === stake.gauge?.gaugeAddress && stake.gauge?.status === 'PREFERRED',
                );
            }
            if (!gauge || !pool.dynamicData) {
                continue;
            }
            const totalShares = parseFloat(pool.dynamicData.totalShares);
            const gaugeTvl =
                totalShares > 0 ? (parseFloat(gauge.totalSupply) / totalShares) * pool.dynamicData.totalLiquidity : 0;

            let thirdPartyApr = 0;
            for (let rewardToken of gauge.tokens) {
                const tokenAddress = rewardToken.id.split('-')[0].toLowerCase();
                const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, tokenAddress) || 0.1;
                const rewardTokenPerYear = parseFloat(rewardToken.rewardsPerSecond) * secondsPerYear;
                const rewardTokenValuePerYear = tokenPrice * rewardTokenPerYear;
                let rewardApr = gaugeTvl > 0 ? rewardTokenValuePerYear / gaugeTvl : 0;

                const isThirdPartyApr = !this.primaryTokens.includes(tokenAddress);
                if (isThirdPartyApr) {
                    thirdPartyApr += rewardApr;
                }

                const item: PrismaPoolAprItem = {
                    id: `${pool.id}-${rewardToken.symbol}-apr`,
                    chain: networkContext.chain,
                    poolId: pool.id,
                    title: `${rewardToken.symbol} reward APR`,
                    apr: rewardApr,
                    type: isThirdPartyApr ? 'THIRD_PARTY_REWARD' : 'NATIVE_REWARD',
                    group: null,
                };

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: item.id, chain: networkContext.chain } },
                        update: item,
                        create: item,
                    }),
                );
            }
        }
        await prismaBulkExecuteOperations(operations);
    }
}
