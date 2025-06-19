import { addressesMatch } from '../../../web3/addresses';
import { PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { secondsPerYear } from '../../../common/time';
import { TokenService } from '../../../token/token.service';
import { ReliquarySubgraphService } from '../../../subgraphs/reliquary-subgraph/reliquary.service';
import { AprHandler, PoolAPRData } from '../../types';
import config from '../../../../config';

export class MaBeetsAprHandler implements AprHandler {
    constructor(private readonly beetsAddress: string, private readonly tokenService: TokenService) {}

    public getAprServiceName(): string {
        return 'MaBeetsAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const chain = pools[0].chain;
        if (!config[chain].subgraphs.reliquary) {
            throw new Error(`Reliquary subgraph not configured for chain ${chain}`);
        }

        const reliquarySubgraphService = new ReliquarySubgraphService(config[chain].subgraphs.reliquary);
        const allSubgraphFarms = await reliquarySubgraphService.getAllFarms({});

        const excludedFarmIds = config[chain].reliquary?.excludedFarmIds || [];

        const filteredFarms = allSubgraphFarms.filter((farm) => !excludedFarmIds.includes(farm.pid.toString()));

        const tokenPrices = await this.tokenService.getTokenPrices(chain);
        const operations: any[] = [];

        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        for (const pool of pools) {
            const subgraphFarm = filteredFarms.find((farm) => addressesMatch(pool.address, farm.poolTokenAddress));
            let farm;
            for (const stake of pool.staking) {
                farm = stake.reliquary;
            }

            if (!subgraphFarm || !pool.dynamicData || !farm || subgraphFarm.totalBalance === '0') {
                continue;
            }

            const totalShares = parseFloat(pool.dynamicData.totalShares);
            const totalLiquidity = pool.dynamicData?.totalLiquidity || 0;
            const pricePerShare = totalLiquidity / totalShares;

            const beetsPrice = this.tokenService.getPriceForToken(tokenPrices, this.beetsAddress, chain);
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
                            id_chain: {
                                id: `${subgraphFarm.pid}-${farmLevel.level}`,
                                chain: chain,
                            },
                        },
                        data: {
                            apr: apr || 0,
                        },
                    }),
                );
            }

            aprItems.push({
                id: `${pool.id}-beets-apr`,
                chain: chain,
                poolId: pool.id,
                title: 'BEETS reward APR',
                apr: minApr,
                type: PrismaPoolAprType.MABEETS_EMISSIONS,
                rewardTokenAddress: this.beetsAddress,
                rewardTokenSymbol: 'BEETS',
            });

            aprItems.push({
                id: `${pool.id}-beets-apr-boost`,
                chain: chain,
                poolId: pool.id,
                title: 'BEETS reward APR',
                apr: maxApr,
                type: PrismaPoolAprType.STAKING_BOOST,
                rewardTokenAddress: this.beetsAddress,
                rewardTokenSymbol: 'BEETS',
            });
        }

        await prismaBulkExecuteOperations(operations);
        return aprItems;
    }
}
