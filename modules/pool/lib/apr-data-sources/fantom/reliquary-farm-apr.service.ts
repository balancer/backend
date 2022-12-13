import { isSameAddress } from '@balancer-labs/sdk';
import { PrismaPoolAprType } from '@prisma/client';
import { prisma } from '../../../../../prisma/prisma-client';
import { PrismaPoolWithExpandedNesting } from '../../../../../prisma/prisma-types';
import { prismaBulkExecuteOperations } from '../../../../../prisma/prisma-util';
import { secondsPerYear } from '../../../../common/time';
import { networkConfig } from '../../../../config/network-config';
import { reliquarySubgraphService } from '../../../../subgraphs/reliquary-subgraph/reliquary.service';
import { tokenService } from '../../../../token/token.service';
import { PoolAprService } from '../../../pool-types';

export class ReliquaryFarmAprService implements PoolAprService {
    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const farms = await reliquarySubgraphService.getAllFarms({});

        const tokenPrices = await tokenService.getTokenPrices();
        const operations: any[] = [];

        for (const pool of pools) {
            const subgraphFarm = farms.find((farm) => isSameAddress(pool.address, farm.poolTokenAddress));
            const farm = pool.staking?.reliquary;

            if (!subgraphFarm || !pool.dynamicData || !farm || subgraphFarm.totalBalance === '0') {
                continue;
            }

            const totalShares = parseFloat(pool.dynamicData.totalShares);
            const totalLiquidity = pool.dynamicData?.totalLiquidity || 0;
            const pricePerShare = totalLiquidity / totalShares;

            const beetsPrice = tokenService.getPriceForToken(tokenPrices, networkConfig.beets.address);
            const farmBeetsPerYear = parseFloat(farm.beetsPerSecond) * secondsPerYear;
            const beetsValuePerYear = beetsPrice * farmBeetsPerYear;

            const totalWeightedSupply = subgraphFarm.levels.reduce(
                (total, level) => total + level.allocationPoints * parseFloat(level.balance),
                0,
            );

            /*
                on the pool overview & detail page, we only show min & max apr values, but on the 
                reliquary page we want to show apr values for each level, so we search for the min / max 
                apr values and add the as apr items and also update the apr for each level of the farm
            */
            let minApr = 0;
            let maxApr = 0;

            for (let farmLevel of subgraphFarm.levels) {
                const levelSupply = parseFloat(farmLevel.balance);
                const aprShare = (farmLevel.allocationPoints * levelSupply) / totalWeightedSupply;
                const apr = levelSupply !== 0 ? (beetsValuePerYear * aprShare) / (levelSupply * pricePerShare) : 0;

                if (minApr === 0 && maxApr === 0) {
                    minApr = apr;
                    maxApr = apr;
                } else if (apr !== 0 && apr < minApr) {
                    minApr = apr;
                } else if (apr > maxApr) {
                    maxApr = apr;
                }
                operations.push(
                    prisma.prismaPoolStakingReliquaryFarmLevel.update({
                        where: {
                            id: `${subgraphFarm.pid}-${farmLevel.level}`,
                        },
                        data: {
                            apr: apr,
                        },
                    }),
                );
            }

            operations.push(
                prisma.prismaPoolAprItem.upsert({
                    where: { id: `${pool.id}-beets-apr` },
                    update: {
                        range: {
                            update: { min: minApr, max: maxApr },
                        },
                    },
                    create: {
                        id: `${pool.id}-beets-apr`,
                        poolId: pool.id,
                        title: 'BEETS reward APR',
                        apr: 0,
                        range: {
                            create: {
                                id: `${pool.id}-beets-apr-range`,
                                min: minApr,
                                max: maxApr,
                            },
                        },
                        type: PrismaPoolAprType.NATIVE_REWARD,
                        group: null,
                    },
                }),
            );
        }

        const poolsWithNoAllocPoints = farms
            .filter((farm) => farm.allocPoint === 0)
            .map((farm) => farm.poolTokenAddress.toLowerCase());

        //TODO: this could be optimized, doesn't need to be run everytime
        await prisma.prismaPoolAprItem.deleteMany({
            where: {
                type: 'NATIVE_REWARD',
                pool: { address: { in: poolsWithNoAllocPoints } },
            },
        });

        await prismaBulkExecuteOperations(operations);
    }
}
