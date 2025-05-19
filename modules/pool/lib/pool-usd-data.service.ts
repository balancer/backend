import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { TokenService } from '../../token/token.service';
import { networkContext } from '../../network/network-context.service';

export class PoolUsdDataService {
    constructor(private readonly tokenService: TokenService) {}

    private get balancerSubgraphService() {
        return networkContext.services.balancerSubgraphService;
    }

    private get chain() {
        return networkContext.chain;
    }

    /**
     * This function depends on pools data to be up to date, so it should be called after
     * poolService.syncAllPoolsFromSubgraph or mutation poolSyncAllPoolsFromSubgraph
     */
    public async updateLifetimeValuesForAllPools() {
        let updates: any[] = [];
        const subgraphPools = await this.balancerSubgraphService.getAllPools({});
        const stakedUsers = await prisma.prismaUserStakedBalance.groupBy({
            by: ['poolId'],
            _count: { userAddress: true },
            where: { chain: this.chain, balanceNum: { gt: 0 } },
        });

        const subgraphPoolIds = subgraphPools.map((pool) => pool.id);

        const dbPools = await prisma.prismaPool.findMany({
            where: { id: { in: subgraphPoolIds }, chain: this.chain },
            include: {
                dynamicData: true,
            },
        });

        for (const pool of subgraphPools) {
            const staked = stakedUsers.find((stakedUser) => stakedUser.poolId === pool.id);
            const dbPool = dbPools.find((poolInDb) => poolInDb.id === pool.id);
            if (!dbPool) continue;

            // Limit numbers, as we have seen some pools with skewd values
            const max = 1e18;
            const lifetimeVolume = Math.min(parseFloat(pool.totalSwapVolume), max);
            const lifetimeSwapFees = Math.min(parseFloat(pool.totalSwapFee), max);
            const holdersCount = parseInt(pool.holdersCount) + (staked?._count.userAddress || 0);

            if (
                !dbPool.dynamicData ||
                dbPool.dynamicData.lifetimeVolume !== lifetimeVolume ||
                dbPool.dynamicData.lifetimeSwapFees !== lifetimeSwapFees ||
                dbPool.dynamicData.holdersCount !== holdersCount ||
                dbPool.dynamicData.swapsCount !== parseInt(pool.swapsCount)
            ) {
                updates.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: pool.id, chain: this.chain } },
                        data: {
                            lifetimeVolume: lifetimeVolume,
                            lifetimeSwapFees: lifetimeSwapFees,
                            holdersCount: holdersCount,
                            swapsCount: parseInt(pool.swapsCount),
                        },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(updates);
    }
}
