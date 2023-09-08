import { PoolStakingService } from '../../pool-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../../network/network-context.service';
import { GaugeSubgraphService, LiquidityGaugeStatus } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { formatUnits } from 'ethers/lib/utils';
import { getContractAt } from '../../../web3/contract';
import childChainGaugeV2Abi from './abi/ChildChainGaugeV2.json';
import childChainGaugeV1Abi from './abi/ChildChainGaugeV1.json';
import moment from 'moment';
import { formatFixed } from '@ethersproject/bignumber';
import { Multicaller3 } from '../../../web3/multicaller3';
import _ from 'lodash';

interface ChildChainInfo {
    /** 1 for old gauges, 2 for gauges receiving cross chain BAL rewards */
    version: number;
    /** BAL per second received by the gauge */
    rate: string;
}

export class GaugeStakingService implements PoolStakingService {
    private balAddress: string;
    constructor(private readonly gaugeSubgraphService: GaugeSubgraphService, balAddress: string) {
        this.balAddress = balAddress.toLowerCase();
    }
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

                    const gaugeVersion = childChainGaugeInfo[gauge.id] ? childChainGaugeInfo[gauge.id].version : 1;

                    operations.push(
                        prisma.prismaPoolStakingGauge.upsert({
                            where: { id_chain: { id: gauge.id, chain: networkContext.chain } },
                            create: {
                                id: gauge.id,
                                stakingId: gauge.id,
                                gaugeAddress: gauge.id,
                                chain: networkContext.chain,
                                status: gaugeStatus,
                                version: gaugeVersion,
                            },
                            update: {
                                status: gaugeStatus,
                                version: gaugeVersion,
                            },
                        }),
                    );

                    // Add BAL as a reward token for the v2 gauge
                    // need to add '-0' to the ID because it get's split by that further down.
                    if (gaugeVersion === 2) {
                        if (gauge.tokens) {
                            gauge.tokens.push({
                                id: `${this.balAddress}-0`,
                                decimals: 18,
                                symbol: 'BAL',
                                rate: childChainGaugeInfo[gauge.id].rate,
                            });
                        } else {
                            gauge.tokens = [
                                {
                                    id: `${this.balAddress}-0`,
                                    decimals: 18,
                                    symbol: 'BAL',
                                    rate: childChainGaugeInfo[gauge.id].rate,
                                },
                            ];
                        }
                    }
                    if (gauge.tokens) {
                        const rewardTokens = await prisma.prismaToken.findMany({
                            where: {
                                address: { in: gauge.tokens.map((token) => token.id.split('-')[0].toLowerCase()) },
                                chain: networkContext.chain,
                            },
                        });
                        for (let rewardToken of gauge.tokens) {
                            const tokenAddress = rewardToken.id.split('-')[0].toLowerCase();
                            const token = rewardTokens.find((token) => token.address === tokenAddress);
                            if (!token) {
                                console.error(
                                    `Could not find reward token (${tokenAddress}) in DB for gauge ${gauge.id} of pool ${pool.id}`,
                                );
                                continue;
                            }

                            const id = `${gauge.id}-${tokenAddress}`;

                            let rewardRate = '0.0';
                            let periodFinish: number;

                            if (gaugeVersion === 1) {
                                const gaugeV1 = getContractAt(gauge.id, childChainGaugeV1Abi);
                                const rewardData = await gaugeV1.reward_data(tokenAddress);

                                periodFinish = rewardData[2];
                                if (periodFinish > moment().unix()) {
                                    // period still running
                                    rewardRate = formatFixed(rewardData[3], token.decimals);
                                }
                            } else {
                                // we can't get BAL rate from the reward data but got it from the inflation_rate call which set the rewardToken.rate
                                if (tokenAddress === this.balAddress) {
                                    rewardRate = rewardToken.rate ? rewardToken.rate : '0.0';
                                } else {
                                    const gaugeV2 = getContractAt(gauge.id, childChainGaugeV2Abi);
                                    const rewardData = await gaugeV2.reward_data(tokenAddress);

                                    periodFinish = parseFloat(formatUnits(rewardData[1], 0));
                                    if (periodFinish > moment().unix()) {
                                        // period still running
                                        rewardRate = formatFixed(rewardData[2], token.decimals);
                                    }
                                }
                            }

                            operations.push(
                                prisma.prismaPoolStakingGaugeReward.upsert({
                                    create: {
                                        id,
                                        chain: networkContext.chain,
                                        gaugeId: gauge.id,
                                        tokenAddress: tokenAddress,
                                        rewardPerSecond: rewardRate,
                                    },
                                    update: {
                                        rewardPerSecond: rewardRate,
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
        const currentWeek = Math.floor(Date.now() / 1000 / 604800);
        const childChainAbi =
            networkContext.chain === 'MAINNET'
                ? 'function inflation_rate() view returns (uint256)'
                : 'function inflation_rate(uint256 week) view returns (uint256)';
        const multicall = new Multicaller3([childChainAbi]);

        let response: { [gaugeAddress: string]: ChildChainInfo } = {};

        gaugeAddresses.forEach((address) => {
            // Only L2 gauges have the inflation_rate with a week parameter
            if (networkContext.chain === 'MAINNET') {
                multicall.call(address, address, 'inflation_rate', [], true);
            } else {
                multicall.call(address, address, 'inflation_rate', [currentWeek], true);
            }
        });

        const childChainData = (await multicall.execute()) as Record<string, string | undefined>;

        for (const childChainGauge in childChainData) {
            if (childChainData[childChainGauge]) {
                response[childChainGauge] = {
                    version: 2,
                    rate: formatUnits(childChainData[childChainGauge]!, 18),
                };
            } else {
                response[childChainGauge] = {
                    version: 1,
                    rate: '0.0',
                };
            }
        }

        return response;
    }

    public async reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (stakingTypes.includes('GAUGE')) {
            await prisma.prismaUserStakedBalance.deleteMany({
                where: { staking: { type: 'GAUGE', chain: networkContext.chain } },
            });
            await prisma.prismaVotingGauge.deleteMany({
                where: { chain: networkContext.chain },
            });
            await prisma.prismaPoolStakingGaugeReward.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaPoolStakingGauge.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaPoolStaking.deleteMany({ where: { chain: networkContext.chain } });
            await this.syncStakingForPools();
        }
    }
}
