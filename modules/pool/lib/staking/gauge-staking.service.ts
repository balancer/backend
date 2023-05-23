import { PoolStakingService } from '../../pool-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../../network/network-context.service';
import { GaugeSubgraphService, LiquidityGaugeStatus } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { Interface, formatEther } from 'ethers/lib/utils';
import { getContractAt } from '../../../web3/contract';
import childChainGaugeAbi from './abi/ChildChainGauge.json';
import multicall3Abi from './abi/Multicall3.json';
import moment from 'moment';

interface ChildChainInfo {
    /** 1 for old gauges, 2 for gauges receiving cross chain BAL rewards */
    version: number;
    /** BAL per second received by the gauge */
    rate: string;
}

export class GaugeStakingService implements PoolStakingService {
    constructor(private readonly gaugeSubgraphService: GaugeSubgraphService) {}
    public async syncStakingForPools(): Promise<void> {
        const pools = await prisma.prismaPool.findMany({
            where: { chain: networkContext.chain },
        });
        const poolIds = pools.map((pool) => pool.id);

        const { pools: subgraphPoolsWithGauges } = await this.gaugeSubgraphService.getPoolsWithGauges(poolIds);

        const operations: any[] = [];

        const allGaugeAddresses = subgraphPoolsWithGauges.map((pool) => pool.gaugesList).flat();

        const childChainGaugeInfo = await this.getChildChainGaugeInfo(allGaugeAddresses);

        for (const gaugePool of subgraphPoolsWithGauges) {
            const pool = pools.find((pool) => pool.id === gaugePool.poolId);
            if (!pool) {
                continue;
            }
            if (gaugePool.gauges) {
                for (const gauge of gaugePool.gauges) {
                    // we need to set the status based on the preferentialGauge entity on the gaugePool. If it's set there, it's preferential, otherwise it's active (or killed)
                    let gaugeStatus: LiquidityGaugeStatus = 'PREFERRED';
                    if (gauge.isKilled) {
                        gaugeStatus = 'KILLED';
                    } else if (gaugePool.preferentialGauge?.id !== gauge.id) {
                        gaugeStatus = 'ACTIVE';
                    }

                    operations.push(
                        prisma.prismaPoolStaking.upsert({
                            where: { id_chain: { id: gauge.id, chain: networkContext.chain } },
                            create: {
                                id: gauge.id,
                                chain: networkContext.chain,
                                poolId: pool.id,
                                type: 'GAUGE',
                                address: gauge.id,
                            },
                            update: {},
                        }),
                    );

                    operations.push(
                        prisma.prismaPoolStakingGauge.upsert({
                            where: { id_chain: { id: gauge.id, chain: networkContext.chain } },
                            create: {
                                id: gauge.id,
                                stakingId: gauge.id,
                                gaugeAddress: gauge.id,
                                chain: networkContext.chain,
                                status: gaugeStatus,
                                version: childChainGaugeInfo[gauge.id] ? childChainGaugeInfo[gauge.id].version : 1,
                            },
                            update: {
                                status: gaugeStatus,
                            },
                        }),
                    );

                    // Add BAL as a reward token for the v2 gauge
                    // need to add '-0' to the ID because it get's split by that further down.
                    if (childChainGaugeInfo[gauge.id].version === 2) {
                        if (gauge.tokens) {
                            gauge.tokens.push({
                                id: `${networkContext.data.bal.address}-0`,
                                decimals: 18,
                                symbol: 'BAL',
                                rate: childChainGaugeInfo[gauge.id].rate,
                            });
                        } else {
                            gauge.tokens = [
                                {
                                    id: `${networkContext.data.bal.address}-0`,
                                    decimals: 18,
                                    symbol: 'BAL',
                                    rate: childChainGaugeInfo[gauge.id].rate,
                                },
                            ];
                        }
                    }
                    if (gauge.tokens) {
                        for (let rewardToken of gauge.tokens) {
                            const tokenAddress = rewardToken.id.split('-')[0].toLowerCase();
                            const id = `${gauge.id}-${tokenAddress}`;

                            // the rate of the token is still set although period is finished, we reset it here
                            if (rewardToken.periodFinish) {
                                if (parseFloat(rewardToken.periodFinish) < moment().unix()) {
                                    rewardToken.rate = '0';
                                }
                            }

                            operations.push(
                                prisma.prismaPoolStakingGaugeReward.upsert({
                                    create: {
                                        id,
                                        chain: networkContext.chain,
                                        gaugeId: gauge.id,
                                        tokenAddress: tokenAddress,
                                        rewardPerSecond: `${rewardToken.rate}`,
                                    },
                                    update: {
                                        rewardPerSecond: `${rewardToken.rate}`,
                                    },
                                    where: { id_chain: { id, chain: networkContext.chain } },
                                }),
                            );
                        }
                    }
                }
            }
        }

        await prismaBulkExecuteOperations(operations, true, undefined);
    }

    async getChildChainGaugeInfo(gaugeAddresses: string[]): Promise<{ [gaugeAddress: string]: ChildChainInfo }> {
        const iChildChainGauge = new Interface(childChainGaugeAbi);
        const multicall = getContractAt(networkContext.data.multicall3, multicall3Abi);

        const currentWeek = Math.floor(Date.now() / 1000 / 604800);
        const calls = gaugeAddresses.map((address) => [
            address,
            true, // allow failures
            iChildChainGauge.encodeFunctionData('inflation_rate', [currentWeek]),
        ]);
        const results = await multicall.callStatic.aggregate3(calls);

        // Transforms results into an array of gauges addresses with corresponding version and the inflation rate as float
        const mappedResults = results.map(([success, data]: [boolean, string], idx: number) => [
            gaugeAddresses[idx],
            {
                version: success ? 2 : 1,
                rate: success ? formatEther(iChildChainGauge.decodeFunctionResult('inflation_rate', data)[0]) : '0',
            },
        ]);

        return Object.fromEntries(mappedResults);
    }

    public async reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (stakingTypes.includes('GAUGE')) {
            await prisma.prismaUserStakedBalance.deleteMany({
                where: { staking: { type: 'GAUGE', chain: networkContext.chain } },
            });
            await prisma.prismaPoolStakingGaugeReward.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaPoolStakingGauge.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaPoolStaking.deleteMany({ where: { chain: networkContext.chain } });
            await this.syncStakingForPools();
        }
    }
}
