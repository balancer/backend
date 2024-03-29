import { isSameAddress } from '@balancer-labs/sdk';
import { PrismaPoolStakingType } from '@prisma/client';
import _, { create } from 'lodash';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { ReliquarySubgraphService } from '../../../subgraphs/reliquary-subgraph/reliquary.service';
import { PoolStakingService } from '../../pool-types';
import { networkContext } from '../../../network/network-context.service';

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
        const filteredFarms = farms.filter(
            (farm) => !networkContext.data.reliquary!.excludedFarmIds.includes(farm.pid.toString()),
        );
        const pools = await prisma.prismaPool.findMany({
            where: { chain: networkContext.chain },
            include: { staking: { include: { farm: { include: { rewarders: true } } } } },
        });
        const operations: any[] = [];

        for (const farm of filteredFarms) {
            const pool = pools.find((pool) => isSameAddress(pool.address, farm.poolTokenAddress));

            if (!pool) {
                console.warn(
                    `Missing pool for farm with id ${farm.pid} with pool token ${farm.poolTokenAddress}. Skipping...`,
                );
                continue;
            }

            const farmId = `${farm.pid}`;
            const stakingId = `reliquary-${farm.pid}`;
            const farmAllocationPoints = farm.allocPoint;
            const reliquaryTotalAllocationPoints = reliquary.totalAllocPoint;

            const beetsPerSecond = (
                parseFloat(reliquary.emissionCurve.rewardPerSecond) *
                (farmAllocationPoints / reliquaryTotalAllocationPoints)
            ).toString();

            operations.push(
                prisma.prismaPoolStaking.upsert({
                    where: { id_chain: { id: stakingId, chain: networkContext.chain } },
                    create: {
                        id: stakingId,
                        chain: networkContext.chain,
                        poolId: pool.id,
                        type: 'RELIQUARY',
                        address: this.reliquaryAddress,
                    },
                    update: {},
                }),
            );

            let totalBalance = `0`;
            let totalWeightedBalance = `0`;

            const levelOperations = [];
            for (let farmLevel of farm.levels) {
                const { allocationPoints, balance, level, requiredMaturity } = farmLevel;

                totalBalance = `${parseFloat(totalBalance) + parseFloat(balance)}`;
                totalWeightedBalance = `${parseFloat(totalWeightedBalance) + parseFloat(balance) * allocationPoints}`;

                levelOperations.push(
                    prisma.prismaPoolStakingReliquaryFarmLevel.upsert({
                        where: { id_chain: { id: `${farmId}-${level}`, chain: networkContext.chain } },
                        create: {
                            id: `${farmId}-${level}`,
                            chain: networkContext.chain,
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
            operations.push(
                prisma.prismaPoolStakingReliquaryFarm.upsert({
                    where: { id_chain: { id: farmId, chain: networkContext.chain } },
                    create: {
                        id: farmId,
                        chain: networkContext.chain,
                        stakingId: stakingId,
                        name: farm.name,
                        beetsPerSecond: beetsPerSecond,
                        totalBalance: totalBalance.toString(),
                        totalWeightedBalance: totalWeightedBalance.toString(),
                    },
                    update: {
                        beetsPerSecond: beetsPerSecond,
                        totalBalance: totalBalance.toString(),
                        totalWeightedBalance: totalWeightedBalance.toString(),
                        name: farm.name,
                    },
                }),
            );
            operations.push(...levelOperations);
        }

        await prismaBulkExecuteOperations(operations, true);
    }

    public async reloadStakingForAllPools(reloadStakingTypes: PrismaPoolStakingType[]) {
        if (reloadStakingTypes.includes('RELIQUARY')) {
            await prisma.prismaUserStakedBalance.deleteMany({
                where: { staking: { type: 'RELIQUARY' }, chain: networkContext.chain },
            });
            // need to remove snapshots as well as they have a FK in reliquary staking
            await prisma.prismaReliquaryTokenBalanceSnapshot.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaReliquaryLevelSnapshot.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaReliquaryLevelSnapshot.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaReliquaryFarmSnapshot.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaUserRelicSnapshot.deleteMany({});

            await prisma.prismaPoolStakingReliquaryFarmLevel.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaPoolStakingReliquaryFarm.deleteMany({ where: { chain: networkContext.chain } });
            await prisma.prismaPoolStaking.deleteMany({ where: { type: 'RELIQUARY', chain: networkContext.chain } });
            await this.syncStakingForPools();
        }
    }
}
