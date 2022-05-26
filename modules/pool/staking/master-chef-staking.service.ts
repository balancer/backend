import { PoolStakingService } from '../pool-types';
import { MasterchefSubgraphService } from '../../subgraphs/masterchef-subgraph/masterchef.service';
import { prisma } from '../../util/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { networkConfig } from '../../config/network-config';

export class MasterChefStakingService implements PoolStakingService {
    constructor(private readonly masterChefSubgraphService: MasterchefSubgraphService) {}

    public async syncStakingForPools(): Promise<void> {
        const farms = await this.masterChefSubgraphService.getAllFarms({});
        const pools = await prisma.prismaPool.findMany({ include: { staking: true } });
        const operations: any[] = [];

        for (const farm of farms) {
            const pool = pools.find((pool) => pool.address === farm.pair);

            if (pool && !pool.staking) {
                if (pool.id === networkConfig.fbeets.poolId) {
                    operations.push(
                        prisma.prismaPoolStaking.create({
                            data: {
                                id: networkConfig.fbeets.farmId,
                                poolId: pool.id,
                                type: 'FRESH_BEETS',
                                address: networkConfig.fbeets.address,
                            },
                        }),
                    );
                } else {
                    operations.push(
                        prisma.prismaPoolStaking.create({
                            data: {
                                id: farm.id,
                                poolId: pool.id,
                                type: 'MASTER_CHEF',
                                address: farm.masterChef.id,
                            },
                        }),
                    );
                }
            }
        }

        await prismaBulkExecuteOperations(operations);
    }

    public async reloadStakingForAllPools() {
        await prisma.prismaPoolStaking.deleteMany({});
        await this.syncStakingForPools();
    }
}
