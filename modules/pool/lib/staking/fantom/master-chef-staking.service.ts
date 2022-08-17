import { PoolStakingService } from '../../../pool-types';
import { MasterchefSubgraphService } from '../../../../subgraphs/masterchef-subgraph/masterchef.service';
import { prisma } from '../../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../../prisma/prisma-util';
import { networkConfig } from '../../../../config/network-config';
import { oldBnum } from '../../../../big-number/old-big-number';
import { formatFixed } from '@ethersproject/bignumber';

const FARM_EMISSIONS_PERCENT = 0.872;

export class MasterChefStakingService implements PoolStakingService {
    constructor(private readonly masterChefSubgraphService: MasterchefSubgraphService) {}

    public async syncStakingForPools(): Promise<void> {
        const farms = await this.masterChefSubgraphService.getAllFarms({});
        const filteredFarms = farms.filter((farm) => !networkConfig.masterchef.excludedFarmIds.includes(farm.id));
        const pools = await prisma.prismaPool.findMany({
            include: { staking: { include: { farm: { include: { rewarders: true } } } } },
        });
        const operations: any[] = [];

        for (const farm of filteredFarms) {
            const isFbeetsFarm = farm.id === networkConfig.fbeets.farmId;
            const pool = pools.find((pool) =>
                isFbeetsFarm ? pool.id === networkConfig.fbeets.poolId : pool.address === farm.pair,
            );

            if (!pool) {
                continue;
            }

            const farmId = farm.id;
            const beetsPerBlock = formatFixed(
                oldBnum(farm.masterChef.beetsPerBlock)
                    .times(FARM_EMISSIONS_PERCENT)
                    .times(farm.allocPoint)
                    .div(farm.masterChef.totalAllocPoint)
                    .toFixed(0),
                18,
            );

            if (!pool.staking) {
                operations.push(
                    prisma.prismaPoolStaking.create({
                        data: {
                            id: farm.id,
                            poolId: pool.id,
                            type: isFbeetsFarm ? 'FRESH_BEETS' : 'MASTER_CHEF',
                            address: isFbeetsFarm ? networkConfig.fbeets.address : farm.masterChef.id,
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

        await prismaBulkExecuteOperations(operations, true);
    }

    public async reloadStakingForAllPools() {
        await prisma.prismaPoolStakingMasterChefFarmRewarder.deleteMany({});
        await prisma.prismaPoolStakingMasterChefFarm.deleteMany({});
        await prisma.prismaPoolStaking.deleteMany({});
        await this.syncStakingForPools();
    }
}
