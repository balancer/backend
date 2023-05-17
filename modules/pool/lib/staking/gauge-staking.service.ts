import { PoolStakingService } from '../../pool-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../../network/network-context.service';
import { GaugeSubgraphService } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { Interface, formatEther } from 'ethers/lib/utils';
import { getContractAt } from '../../../web3/contract'
import childChainGaugeAbi from './abi/ChildChainGauge.json';
import multicall3Abi from './abi/Multicall3.json';

interface ChildChainInfo {
    /** 1 for old gauges, 2 for gauges receiving cross chain BAL rewards */
    version: number;
    /** BAL per second received by the gauge */
    rate: string;
}

export class GaugeStakingService implements PoolStakingService {
    constructor(private readonly gaugeSubgraphService: GaugeSubgraphService) {}
    public async syncStakingForPools(): Promise<void> {
        const gauges = await this.gaugeSubgraphService.getAllGaugesWithStatus();

        // Get information about child chain gauges
        const childChainInfo = await this.getChildChainInfo(gauges.map(gauge => gauge.address));

        const pools = await prisma.prismaPool.findMany({
            where: { chain: networkContext.chain },
            include: {
                staking: { include: { gauge: { include: { rewards: true } } } },
            },
        });
        const operations: any[] = [];

        for (const gauge of gauges) {
            const pool = pools.find((pool) => pool.id === gauge.poolId);
            if (!pool) {
                continue;
            }
            operations.push(
                prisma.prismaPoolStaking.upsert({
                    where: { id_chain: { id: gauge.address, chain: networkContext.chain } },
                    create: {
                        id: gauge.address,
                        chain: networkContext.chain,
                        poolId: pool.id,
                        type: 'GAUGE',
                        address: gauge.address,
                    },
                    update: {},
                }),
            );

            operations.push(
                prisma.prismaPoolStakingGauge.upsert({
                    where: { id_chain: { id: gauge.address, chain: networkContext.chain } },
                    create: {
                        id: gauge.address,
                        stakingId: gauge.address,
                        gaugeAddress: gauge.address,
                        chain: networkContext.chain,
                        status: gauge.status,
                        version: childChainInfo[gauge.address] ? childChainInfo[gauge.address].version : 1,
                    },
                    update: {
                        status: gauge.status,
                    },
                }),
            );

            // Add BAL as a reward token
            if (childChainInfo[gauge.address]) {
                gauge.tokens.push({
                    id: `${networkContext.data.bal.address}-0`,
                    decimals: 18,
                    symbol: 'BAL',
                    rewardsPerSecond: childChainInfo[gauge.address].rate,
                });
            }

            for (let rewardToken of gauge.tokens) {
                const tokenAddress = rewardToken.id.split('-')[0].toLowerCase();
                const id = `${gauge.address}-${tokenAddress}`;
                operations.push(
                    prisma.prismaPoolStakingGaugeReward.upsert({
                        create: {
                            id,
                            chain: networkContext.chain,
                            gaugeId: gauge.address,
                            tokenAddress: tokenAddress,
                            rewardPerSecond: `${rewardToken.rewardsPerSecond}`,
                        },
                        update: {
                            rewardPerSecond: `${rewardToken.rewardsPerSecond}`,
                        },
                        where: { id_chain: { id, chain: networkContext.chain } },
                    }),
                );
            }
        }
        // operations.push(prisma.prismaPoolStakingGauge.createMany({ data: gaugeStakingEntities, skipDuplicates: true }));
        // operations.push(...gaugeStakingRewardOperations);

        await prismaBulkExecuteOperations(operations, true, undefined);
    }

    async getChildChainInfo(gaugeAddresses: string[]): Promise<{ [gaugeAddress: string]: ChildChainInfo }> {
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
        const mappedResults = results.map(([status, data]: [boolean, string], idx: number) => ([gaugeAddresses[idx], {
            version: status && 1 || 2,
            rate: status && formatEther(iChildChainGauge.decodeFunctionResult('inflation_rate', data)[0])
        }]))

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
