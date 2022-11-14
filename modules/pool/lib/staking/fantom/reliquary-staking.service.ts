import { isSameAddress } from '@balancer-labs/sdk';
import { PrismaPoolStakingType } from '@prisma/client';
import { prisma } from '../../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../../prisma/prisma-util';
import { ReliquarySubgraphService } from '../../../../subgraphs/reliquary-subgraph/reliquary.service';
import { PoolStakingService } from '../../../pool-types';

export class ReliquaryStakingService implements PoolStakingService {
    constructor(
        private readonly reliquaryAddress: string,
        private readonly reliquarySubgraphService: ReliquarySubgraphService,
    ) {}

    public async syncStakingForPools(): Promise<void> {
        const { reliquary } = await this.reliquarySubgraphService.getReliquary({ id: this.reliquaryAddress });
        if (!reliquary) {
            throw new Error(`Reliquary with id ${this.reliquaryAddress} not found in subgraph`);
        }
        const farms = await this.reliquarySubgraphService.getAllFarms({});
        const pools = await prisma.prismaPool.findMany({
            include: { staking: { include: { farm: { include: { rewarders: true } } } } },
        });
        const operations: any[] = [];

        for (const farm of farms) {
            const pool = pools.find((pool) => isSameAddress(pool.address, farm.poolTokenAddress));

            if (!pool) {
                console.warn(
                    `Missing pool for farm with id ${farm.pid} with pool token ${farm.poolTokenAddress}. Skipping...`,
                );
                continue;
            }

            const farmId = `${farm.pid}`;
            const beetsPerSecond = reliquary.emissionCurve.rewardPerSecond;

            if (!pool.staking) {
                operations.push(
                    prisma.prismaPoolStaking.create({
                        data: {
                            id: `reliquary-${farm.pid}`,
                            poolId: pool.id,
                            type: 'RELIQUARY',
                            address: this.reliquaryAddress,
                        },
                    }),
                );
            }

            operations.push(
                prisma.prismaPoolStakingReliquaryFarm.upsert({
                    where: { id: farmId },
                    create: {
                        id: farmId,
                        stakingId: `reliquary-${farmId}`,
                        name: farm.name,
                        beetsPerSecond: beetsPerSecond,
                    },
                    update: {
                        beetsPerSecond: beetsPerSecond,
                        name: farm.name,
                    },
                }),
            );

            for (let farmLevel of farm.levels) {
                const { allocationPoints, balance, level, requiredMaturity } = farmLevel;

                operations.push(
                    prisma.prismaPoolStakingReliquaryFarmLevel.upsert({
                        where: { id: `${farmId}-${level}` },
                        create: {
                            id: `${farmId}-${level}`,
                            farmId,
                            allocationPoints,
                            balance,
                            level,
                            requiredMaturity,
                            // apr will be updated by apr service
                            apr: 0,
                        },
                        update: {
                            balance,
                        },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations, true);
    }

    public async reloadStakingForAllPools(reloadStakingTypes: PrismaPoolStakingType[]) {
        if (reloadStakingTypes.includes('RELIQUARY')) {
            await prisma.prismaUserStakedBalance.deleteMany({ where: { staking: { type: 'RELIQUARY' } } });
            await prisma.prismaPoolStakingReliquaryFarmLevel.deleteMany({});
            await prisma.prismaPoolStakingReliquaryFarm.deleteMany({});
            await prisma.prismaPoolStaking.deleteMany({ where: { type: 'RELIQUARY' } });
            await this.syncStakingForPools();
        }
    }
}
