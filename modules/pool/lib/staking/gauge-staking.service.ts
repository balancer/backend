import { PoolStakingService } from '../../pool-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../../network/network-context.service';
import { GaugeSubgraphService } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { Interface, formatEther } from 'ethers/lib/utils';
import { getContractAt } from '../../../web3/contract'

export class GaugeStakingService implements PoolStakingService {
    constructor(private readonly gaugeSubgraphService: GaugeSubgraphService) {}
    public async syncStakingForPools(): Promise<void> {
        const gauges = await this.gaugeSubgraphService.getAllGaugesWithStatus();

        // Get BAL rewards
        const inflationRates = await this.getInflationRates(gauges.map(gauge => gauge.address));

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
                    },
                    update: {
                        status: gauge.status,
                    },
                }),
            );

            // Add BAL as a reward token
            if (inflationRates[gauge.address]) {
                gauge.tokens.push({
                    id: `${networkContext.data.bal.address}-0`,
                    decimals: 18,
                    symbol: 'BAL',
                    rewardsPerSecond: inflationRates[gauge.address],
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

    async getInflationRates(gaugeAddresses: string[]) {
        const abi = ['function inflation_rate(uint) view returns (uint256)'];
        const multicallAbi = ['function aggregate3(tuple(address, bool, bytes)[]) view returns (tuple(bool, bytes)[])'];
        const iChildChainGauge = new Interface(abi);
        const multicall = getContractAt('0xca11bde05977b3631167028862be2a173976ca11', multicallAbi);

        const currentWeek = Math.floor(Date.now() / 1000 / 604800);
        const calls = gaugeAddresses.map((address) => [
            address,
            true, // allow failures
            iChildChainGauge.encodeFunctionData('inflation_rate', [currentWeek]),
        ]);
        const results = await multicall.callStatic.aggregate3(calls);

        const mapResults = ([status, data]: [boolean, string], idx: number) => {
            const decoded = status && formatEther(iChildChainGauge.decodeFunctionResult('inflation_rate', data)[0]);
            return [gaugeAddresses[idx], [status, decoded]];
        };

        const mappedResults = results.map(mapResults);
        const childChainOnly = mappedResults
            .filter((result: [boolean, any]) => result[1][0])
            .map((result: [boolean, any]) => [result[0], result[1][1]]);

        return Object.fromEntries(childChainOnly);
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
