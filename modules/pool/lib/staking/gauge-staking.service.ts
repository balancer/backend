/**
 * Supports calculation of BAL and token rewards sent to gauges.
 * Balancer has 3 types of gauges:
 *
 * 1. Mainnet gauges with working supply and relative weight
 * 2. Old L2 gauges with BAL rewards sent as a reward token
 * 3. New L2 gauges (aka child chain gauges) with direct BAL rewards through a streamer.
 *
 * Reward data is fetched onchain and stored in the DB as a token rate per second.
 */
import { PoolStakingService } from '../../pool-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { Chain, PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../../network/network-context.service';
import { GaugeSubgraphService, LiquidityGaugeStatus } from '../../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import type { LiquidityGauge } from '../../../subgraphs/gauge-subgraph/generated/gauge-subgraph-types';
import gaugeControllerAbi from '../../../vebal/abi/gaugeController.json';
import childChainGaugeV2Abi from './abi/ChildChainGaugeV2.json';
import childChainGaugeV1Abi from './abi/ChildChainGaugeV1.json';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import type { JsonFragment } from '@ethersproject/abi';
import { Multicaller3 } from '../../../web3/multicaller3';
import { getInflationRate } from '../../../vebal/balancer-token-admin.service';
import _ from 'lodash';

interface GaugeRate {
    /** 1 for old gauges, 2 for gauges receiving cross chain BAL rewards */
    version: number;
    /** BAL per second received by the gauge */
    rate: string;
    // Amount of tokens staked in the gauge
    totalSupply: string;
    // Effective total LP token amount after all deposits have been boosted
    workingSupply: string;
}

interface GaugeRewardData {
    [address: string]: {
        rewardData: {
            [address: string]: {
                period_finish?: BigNumber;
                rate?: BigNumber;
            };
        };
    };
}

interface GaugeBalDistributionData {
    [address: string]: {
        rate?: BigNumber;
        weight?: BigNumber;
        workingSupply?: BigNumber;
        totalSupply?: BigNumber;
    };
}

export class GaugeStakingService implements PoolStakingService {
    private balAddress: string;
    private balMulticaller: Multicaller3; // Used to query BAL rate and gauge data
    private rewardsMulticallerV1: Multicaller3; // Used to query rewards token data for v1 gauges
    private rewardsMulticallerV2: Multicaller3; // Used to query rewards token data for v2 gauges

    constructor(private readonly gaugeSubgraphService: GaugeSubgraphService, balAddress: string) {
        this.balAddress = balAddress.toLowerCase();

        this.balMulticaller = new Multicaller3([
            ...childChainGaugeV2Abi.filter((abi) => abi.name === 'totalSupply'),
            ...childChainGaugeV2Abi.filter((abi) => abi.name === 'working_supply'),
            ...childChainGaugeV2Abi.filter((abi) => abi.name === 'inflation_rate'),
            gaugeControllerAbi.find((abi) => abi.name === 'gauge_relative_weight'),
        ] as JsonFragment[]);

        this.rewardsMulticallerV1 = new Multicaller3([
            ...childChainGaugeV1Abi.filter((abi) => abi.name === 'reward_data'),
        ]);

        this.rewardsMulticallerV2 = new Multicaller3([
            ...childChainGaugeV2Abi.filter((abi) => abi.name === 'reward_data'),
        ]);
    }

    async syncStakingForPools(pools?: { id: string }[]): Promise<void> {
        // Getting data from the DB and subgraph
        const poolIds = (pools ?? await prisma.prismaPool.findMany({
            select: { id: true },
            where: { chain: networkContext.chain },
        })).map((pool) => pool.id);
        const { pools: subgraphPoolsWithGauges } = await this.gaugeSubgraphService.getPoolsWithGauges(poolIds);

        const subgraphGauges = subgraphPoolsWithGauges
            .map((pool) => pool.gauges)
            .flat()
            .filter((gauge): gauge is LiquidityGauge => !!gauge);

        const uniquePreferentialIds = subgraphPoolsWithGauges
            .filter((pool) => pool.preferentialGauge)
            .map((pool) => pool.preferentialGauge!.id);

        const dbGauges = subgraphGauges.map((gauge) => ({
            id: gauge.id,
            poolId: gauge.poolId!,
            // we need to set the status based on the preferentialGauge entity on the gaugePool. If it's set there, it's preferential, otherwise it's active (or killed)
            status: gauge.isKilled
                ? 'KILLED'
                : !uniquePreferentialIds.includes(gauge.id)
                ? 'ACTIVE'
                : ('PREFERRED' as LiquidityGaugeStatus),
            version: gauge.streamer || networkContext.chain == 'MAINNET' ? 1 : (2 as 1 | 2),
            tokens: gauge.tokens || [],
        }));

        // Get tokens used for all reward tokens including native BAL address, which might not be on the list of tokens stored in the gauge
        const prismaTokens = await prisma.prismaToken.findMany({
            where: {
                address: {
                    in: [
                        this.balAddress,
                        ...subgraphGauges
                            .map((gauge) => gauge.tokens?.map((token) => token.id.split('-')[0].toLowerCase()))
                            .flat()
                            .filter((address): address is string => !!address),
                    ],
                },
                chain: networkContext.chain,
            },
        });

        const onchainRates = await this.getOnchainRewardTokensData(dbGauges);

        // Prepare DB operations
        const operations: any[] = [];

        // DB operations for gauges
        for (const gauge of dbGauges) {
            operations.push(
                prisma.prismaPoolStaking.upsert({
                    where: { id_chain: { id: gauge.id, chain: networkContext.chain } },
                    create: {
                        id: gauge.id,
                        chain: networkContext.chain,
                        poolId: gauge.poolId,
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
                        status: gauge.status,
                        version: gauge.version,
                        workingSupply: onchainRates.find(({ id }) => `${gauge.id}-${this.balAddress}` === id)
                            ?.workingSupply,
                        totalSupply: onchainRates.find(({ id }) => id.includes(gauge.id))?.totalSupply,
                    },
                    update: {
                        status: gauge.status,
                        version: gauge.version,
                        workingSupply: onchainRates.find(({ id }) => `${gauge.id}-${this.balAddress}` === id)
                            ?.workingSupply,
                        totalSupply: onchainRates.find(({ id }) => id.includes(gauge.id))?.totalSupply,
                    },
                }),
            );
        }

        // DB operations for gauge reward tokens
        for (const { id, rewardPerSecond } of onchainRates) {
            const [gaugeId, tokenAddress] = id.toLowerCase().split('-');
            const token = prismaTokens.find((token) => token.address === tokenAddress);
            if (!token) {
                const poolId = subgraphGauges.find((gauge) => gauge.id === gaugeId)?.poolId;
                console.error(
                    `Could not find reward token (${tokenAddress}) in DB for gauge ${gaugeId} of pool ${poolId}`,
                );
                continue;
            }

            operations.push(
                prisma.prismaPoolStakingGaugeReward.upsert({
                    create: {
                        id,
                        chain: networkContext.chain,
                        gaugeId,
                        tokenAddress,
                        rewardPerSecond,
                    },
                    update: {
                        rewardPerSecond,
                    },
                    where: { id_chain: { id, chain: networkContext.chain } },
                }),
            );
        }

        await prismaBulkExecuteOperations(operations, true, undefined);
    }

    private async getOnchainRewardTokensData(gauges: { id: string; version: 1 | 2; tokens: { id: string }[] }[]) {
        // Get onchain data for BAL rewards
        const currentWeek = Math.floor(Date.now() / 1000 / 604800);
        for (const gauge of gauges) {
            this.balMulticaller.call(`${gauge.id}.totalSupply`, gauge.id, 'totalSupply', [], true);
            if (gauge.version === 2) {
                this.balMulticaller.call(`${gauge.id}.rate`, gauge.id, 'inflation_rate', [currentWeek], true);
                this.balMulticaller.call(`${gauge.id}.workingSupply`, gauge.id, 'working_supply', [], true);
            } else if (networkContext.chain === Chain.MAINNET) {
                this.balMulticaller.call(
                    `${gauge.id}.weight`,
                    networkContext.data.gaugeControllerAddress!,
                    'gauge_relative_weight',
                    [gauge.id],
                    true,
                );
                this.balMulticaller.call(`${gauge.id}.workingSupply`, gauge.id, 'working_supply', [], true);
            }
        }
        const balData = (await this.balMulticaller.execute()) as GaugeBalDistributionData;

        // Get onchain data for reward tokens
        for (const gauge of gauges) {
            for (const token of gauge.tokens ?? []) {
                const [address] = token.id.toLowerCase().split('-');
                if (gauge.version === 1) {
                    this.rewardsMulticallerV1.call(
                        `${gauge.id}.rewardData.${address}`,
                        gauge.id,
                        'reward_data',
                        [address],
                        true,
                    );
                } else {
                    this.rewardsMulticallerV2.call(
                        `${gauge.id}.rewardData.${address}`,
                        gauge.id,
                        'reward_data',
                        [address],
                        true,
                    );
                }
            }
        }
        const rewardsDataV1 = (await this.rewardsMulticallerV1.execute()) as GaugeRewardData;
        const rewardsDataV2 = (await this.rewardsMulticallerV2.execute()) as GaugeRewardData;
        const rewardsData = { ...rewardsDataV1, ...rewardsDataV2 };

        const totalBalRate = parseFloat(formatUnits(await getInflationRate()));
        const now = Math.floor(Date.now() / 1000);

        // Format onchain rates for all the rewards
        const onchainRates = [
            ...Object.keys(balData).map((gaugeAddress) => {
                const id = `${gaugeAddress}-${this.balAddress}`.toLowerCase();
                const { rate, weight, workingSupply, totalSupply } = balData[gaugeAddress];
                const rewardPerSecond = rate
                    ? formatUnits(rate) // L2 V2 case
                    : weight
                    ? (parseFloat(formatUnits(weight!)) * totalBalRate).toFixed(18) // mainnet case
                    : '0';

                return {
                    id,
                    rewardPerSecond,
                    workingSupply: workingSupply ? formatUnits(workingSupply) : '0',
                    totalSupply: totalSupply ? formatUnits(totalSupply) : '0',
                };
            }),
            ...Object.keys(rewardsData)
                .map((gaugeAddress) => [
                    // L2 V1 case, includes tokens other than BAL
                    ...Object.keys(rewardsData[gaugeAddress].rewardData).map((tokenAddress) => {
                        const id = `${gaugeAddress}-${tokenAddress}`.toLowerCase();
                        const { rate, period_finish } = rewardsData[gaugeAddress].rewardData[tokenAddress];
                        const rewardPerSecond =
                            period_finish && period_finish.toNumber() > now ? formatUnits(rate!) : '0.0';
                        const { totalSupply } = balData[gaugeAddress];

                        return {
                            id,
                            rewardPerSecond,
                            workingSupply: '0',
                            totalSupply: totalSupply ? formatUnits(totalSupply) : '0',
                        };
                    }),
                ])
                .flat(),
        ] as {
            id: string;
            rewardPerSecond: string;
            workingSupply: string;
            totalSupply: string;
        }[];

        return onchainRates;
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
