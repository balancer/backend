import { getSanityClient } from '../../sanity/sanity';
import { prisma } from '../../../prisma/prisma-client';
import { PrismaPoolCategoryType } from '@prisma/client';
import { networkContext } from '../../network/network-context.service';

interface SanityPoolConfig {
    incentivizedPools: string[];
    blacklistedPools: string[];
    poolFilters: {
        id: string;
        title: string;
        pools: string[];
    }[];
}

export class PoolSanityDataLoaderService {
    public async syncPoolSanityData() {
        const response = await getSanityClient().fetch(`*[_type == "config" && chainId == ${networkContext.chainId}][0]{
            incentivizedPools,
            blacklistedPools,
            poolFilters
        }`);

        const config: SanityPoolConfig = {
            incentivizedPools: response?.incentivizedPools ?? [],
            blacklistedPools: response?.blacklistedPools ?? [],
            poolFilters: response?.poolFilters ?? [],
        };

        const categories = await prisma.prismaPoolCategory.findMany({ where: { chain: networkContext.chain } });
        const incentivized = categories.filter((item) => item.category === 'INCENTIVIZED').map((item) => item.poolId);
        const blacklisted = categories.filter((item) => item.category === 'BLACK_LISTED').map((item) => item.poolId);

        await this.updatePoolCategory(incentivized, config.incentivizedPools, 'INCENTIVIZED');
        await this.updatePoolCategory(blacklisted, config.blacklistedPools, 'BLACK_LISTED');

        await prisma.$transaction([
            prisma.prismaPoolFilterMap.deleteMany({ where: { chain: networkContext.chain } }),
            prisma.prismaPoolFilter.deleteMany({ where: { chain: networkContext.chain } }),
            prisma.prismaPoolFilter.createMany({
                data: config.poolFilters.map((item) => ({
                    id: item.id,
                    chain: networkContext.chain,
                    title: item.title,
                })),
                skipDuplicates: true,
            }),
            prisma.prismaPoolFilterMap.createMany({
                data: config.poolFilters
                    .map((item) => {
                        return item.pools.map((poolId) => ({
                            id: `${item.id}-${poolId}`,
                            chain: networkContext.chain,
                            poolId,
                            filterId: item.id,
                        }));
                    })
                    .flat(),
                skipDuplicates: true,
            }),
        ]);
    }

    private async updatePoolCategory(currentPoolIds: string[], newPoolIds: string[], category: PrismaPoolCategoryType) {
        const itemsToAdd = newPoolIds.filter((poolId) => !currentPoolIds.includes(poolId));
        const itemsToRemove = currentPoolIds.filter((poolId) => !newPoolIds.includes(poolId));

        // make sure the pools really exist to prevent sanity mistakes from breaking the system
        const pools = await prisma.prismaPool.findMany({
            where: { id: { in: itemsToAdd }, chain: networkContext.chain },
            select: { id: true },
        });
        const poolIds = pools.map((pool) => pool.id);
        const existingItemsToAdd = itemsToAdd.filter((poolId) => poolIds.includes(poolId));

        await prisma.$transaction([
            prisma.prismaPoolCategory.createMany({
                data: existingItemsToAdd.map((poolId) => ({
                    id: `${poolId}-${category}`,
                    chain: networkContext.chain,
                    category,
                    poolId,
                })),
                skipDuplicates: true,
            }),
            prisma.prismaPoolCategory.deleteMany({
                where: { poolId: { in: itemsToRemove }, category, chain: networkContext.chain },
            }),
        ]);
    }
}
