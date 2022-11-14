import { PoolStakingService } from '../../../pool-types';
import { GaugeSerivce } from './gauge-service';
import { prisma } from '../../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../../prisma/prisma-util';
import { PrismaPoolStakingType } from '@prisma/client';

export class GaugeStakingService implements PoolStakingService {
    constructor(private readonly gaugeService: GaugeSerivce) {}
    public async syncStakingForPools(): Promise<void> {
        const gaugeStreamers = await this.gaugeService.getStreamers();

        const pools = await prisma.prismaPool.findMany({
            include: {
                staking: { include: { gauge: { include: { rewards: true } } } },
            },
        });
        const operations: any[] = [];

        const gaugeStakingEntities: any[] = [];
        const gaugeStakingRewardOperations: any[] = [];

        for (const gaugeStreamer of gaugeStreamers) {
            const pool = pools.find((pool) => pool.id === gaugeStreamer.poolId);
            if (!pool) {
                continue;
            }
            if (!pool.staking) {
                operations.push(
                    prisma.prismaPoolStaking.create({
                        data: {
                            id: gaugeStreamer.gaugeAddress,
                            poolId: pool.id,
                            type: 'GAUGE',
                            address: gaugeStreamer.gaugeAddress,
                        },
                    }),
                );
            }
            gaugeStakingEntities.push({
                id: gaugeStreamer.gaugeAddress,
                stakingId: gaugeStreamer.gaugeAddress,
                gaugeAddress: gaugeStreamer.gaugeAddress,
            });
            for (let rewardToken of gaugeStreamer.rewardTokens) {
                const id = `${gaugeStreamer.gaugeAddress}-${rewardToken.address}`;
                gaugeStakingRewardOperations.push(
                    prisma.prismaPoolStakingGaugeReward.upsert({
                        create: {
                            id,
                            gaugeId: gaugeStreamer.gaugeAddress,
                            tokenAddress: rewardToken.address,
                            rewardPerSecond: `${rewardToken.rewardsPerSecond}`,
                        },
                        update: {
                            rewardPerSecond: `${rewardToken.rewardsPerSecond}`,
                        },
                        where: { id },
                    }),
                );
            }
        }
        operations.push(prisma.prismaPoolStakingGauge.createMany({ data: gaugeStakingEntities, skipDuplicates: true }));
        operations.push(...gaugeStakingRewardOperations);

        await prismaBulkExecuteOperations(operations, true, undefined);
    }
    public async reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (stakingTypes.includes('GAUGE')) {
            await prisma.prismaUserStakedBalance.deleteMany({ where: { staking: { type: 'GAUGE' } } });
            await prisma.prismaPoolStakingGaugeReward.deleteMany({});
            await prisma.prismaPoolStakingGauge.deleteMany({});
            await prisma.prismaPoolStaking.deleteMany({});
            await this.syncStakingForPools();
        }
    }
}
