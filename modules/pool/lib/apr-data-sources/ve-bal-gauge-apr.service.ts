import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { PoolAprService } from '../../pool-types';
import { TokenService } from '../../../token/token.service';
import { secondsPerYear } from '../../../common/time';
import { PrismaPoolAprItem, PrismaPoolAprRange, PrismaPoolAprType } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { networkContext } from '../../../network/network-context.service';
import { GaugeSubgraphService } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';

export class GaugeAprService implements PoolAprService {
    private readonly MAX_VEBAL_BOOST = 2.5;

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
            let preferredStaking;
            for (const stake of pool.staking) {
                if (stake.gauge?.status === 'PREFERRED') {
                    preferredStaking = stake;
                    gauge = gauges.find(
                        (subgraphGauge) =>
                            subgraphGauge.address === stake.gauge?.gaugeAddress && stake.gauge?.status === 'PREFERRED',
                    );
                }
            }
            if (!gauge || !pool.dynamicData || !preferredStaking?.gauge) {
                continue;
            }
            const totalShares = parseFloat(pool.dynamicData.totalShares);
            const gaugeTvl =
                totalShares > 0 ? (parseFloat(gauge.totalSupply) / totalShares) * pool.dynamicData.totalLiquidity : 0;

            let thirdPartyApr = 0;

            for (let rewardToken of preferredStaking.gauge.rewards) {
                const tokenAddress = rewardToken.tokenAddress;
                let rewardTokenDefinition;
                try {
                    rewardTokenDefinition = await prisma.prismaToken.findUniqueOrThrow({
                        where: { address_chain: { address: tokenAddress, chain: networkContext.chain } },
                    });
                } catch (e) {
                    //we don't have the reward token added as a token, only happens for testing tokens
                    continue;
                }
                const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, tokenAddress) || 0.1;
                const rewardTokenPerYear = parseFloat(rewardToken.rewardPerSecond) * secondsPerYear;
                const rewardTokenValuePerYear = tokenPrice * rewardTokenPerYear;
                let rewardApr = gaugeTvl > 0 ? rewardTokenValuePerYear / gaugeTvl : 0;

                const isThirdPartyApr = !this.primaryTokens.includes(tokenAddress);
                if (isThirdPartyApr) {
                    thirdPartyApr += rewardApr;
                }

                // apply vebal boost for BAL rewards on v2 gauges
                if (
                    rewardToken.tokenAddress === networkContext.data.bal!.address &&
                    preferredStaking.gauge.version === 2
                ) {
                    const aprItemId = `${pool.id}-${rewardTokenDefinition.symbol}-apr`;
                    const aprRangeId = `${pool.id}-bal-apr-range`;

                    // we need to create/update the range item first, as APRs can change from total to range types
                    // if we try to update apritem and nested range item in the same upsert, range item does not yet exist.
                    operations.push(
                        prisma.prismaPoolAprRange.upsert({
                            where: {
                                id_chain: { id: aprRangeId, chain: networkContext.chain },
                            },
                            update: {
                                min: rewardApr,
                                max: rewardApr * this.MAX_VEBAL_BOOST,
                            },
                            create: {
                                id: aprRangeId,
                                chain: networkContext.chain,
                                aprItemId: aprItemId,
                                min: rewardApr,
                                max: rewardApr,
                            },
                        }),
                    );

                    operations.push(
                        prisma.prismaPoolAprItem.upsert({
                            where: {
                                id_chain: {
                                    id: aprItemId,
                                    chain: networkContext.chain,
                                },
                            },
                            update: {
                                apr: 0,
                            },
                            create: {
                                id: aprItemId,
                                chain: networkContext.chain,
                                poolId: pool.id,
                                title: `${rewardTokenDefinition.symbol} reward APR`,
                                apr: 0,
                                type: PrismaPoolAprType.NATIVE_REWARD,
                                group: null,
                            },
                        }),
                    );
                } else {
                    const item: PrismaPoolAprItem = {
                        id: `${pool.id}-${rewardTokenDefinition.symbol}-apr`,
                        chain: networkContext.chain,
                        poolId: pool.id,
                        title: `${rewardTokenDefinition.symbol} reward APR`,
                        apr: rewardApr,
                        type: isThirdPartyApr ? PrismaPoolAprType.THIRD_PARTY_REWARD : PrismaPoolAprType.NATIVE_REWARD,
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
        }
        await prismaBulkExecuteOperations(operations);
    }
}
