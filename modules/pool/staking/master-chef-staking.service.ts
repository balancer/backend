import { PoolStakingService } from '../pool-types';
import { MasterchefSubgraphService } from '../../subgraphs/masterchef-subgraph/masterchef.service';
import { prisma } from '../../util/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { networkConfig } from '../../config/network-config';
import { oldBnum } from '../../util/old-big-number';
import { formatFixed } from '@ethersproject/bignumber';

export class MasterChefStakingService implements PoolStakingService {
    constructor(private readonly masterChefSubgraphService: MasterchefSubgraphService) {}

    public async syncStakingForPools(): Promise<void> {
        const farms = await this.masterChefSubgraphService.getAllFarms({});
        const pools = await prisma.prismaPool.findMany({
            include: {
                staking: { include: { farm: { include: { rewarders: true } } } },
            },
        });
        const operations: any[] = [];

        for (const farm of farms) {
            const pool = pools.find((pool) => pool.address === farm.pair);

            if (!pool) {
                continue;
            }

            const isFbeetsPool = pool.id === networkConfig.fbeets.poolId;
            const farmId = isFbeetsPool ? networkConfig.fbeets.farmId : farm.id;
            const beetsPerBlock = formatFixed(
                oldBnum(farm.masterChef.beetsPerBlock)
                    .times(farm.allocPoint)
                    .div(farm.masterChef.totalAllocPoint)
                    .toFixed(0),
                18,
            );

            if (!pool.staking) {
                operations.push(
                    prisma.prismaPoolStaking.create({
                        data: {
                            id: farmId,
                            poolId: pool.id,
                            type: isFbeetsPool ? 'FRESH_BEETS' : 'MASTER_CHEF',
                            address: networkConfig.fbeets.address,
                        },
                    }),
                );
            }

            operations.push(
                prisma.prismaPoolStakingMasterChefFarm.upsert({
                    where: { id: farmId },
                    create: { id: farmId, stakingId: farmId, beetsPerBlock },
                    update: { beetsPerBlock },
                }),
            );

            if (farm.rewarder) {
                for (const rewardToken of farm.rewarder.rewardTokens || []) {
                    const id = `${farmId}-${farm.rewarder.id}-${rewardToken.token}`;
                    const rewardPerSecond = formatFixed(rewardToken.rewardPerSecond, rewardToken.decimals);

                    operations.push(
                        prisma.prismaPoolStakingMasterChefFarmRewarder.upsert({
                            where: { id },
                            create: {
                                id,
                                farmId,
                                tokenAddress: rewardToken.token,
                                address: farm.rewarder.id,
                                rewardPerSecond,
                            },
                            update: { rewardPerSecond },
                        }),
                    );
                }
            }
        }

        await prismaBulkExecuteOperations(operations);
    }

    public async reloadStakingForAllPools() {
        await prisma.prismaPoolStakingMasterChefFarmRewarder.deleteMany({});
        await prisma.prismaPoolStakingMasterChefFarm.deleteMany({});
        await prisma.prismaPoolStaking.deleteMany({});
        await this.syncStakingForPools();
    }
}
