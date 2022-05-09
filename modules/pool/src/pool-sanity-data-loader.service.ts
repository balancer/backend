import { sanityClient } from '../../util/sanity';
import { env } from '../../../app/env';
import { prisma } from '../../util/prisma-client';
import { PrismaPoolCategoryType } from '@prisma/client';

interface SanityPoolConfig {
    incentivizedPools: string[];
    blacklistedPools: string[];
}

export class PoolSanityDataLoaderService {
    public async syncPoolSanityData() {
        const response = await sanityClient.fetch(`*[_type == "config" && chainId == ${env.CHAIN_ID}][0]{
            incentivizedPools,
            blacklistedPools
        }`);

        const config: SanityPoolConfig = {
            incentivizedPools: response?.incentivizedPools ?? [],
            blacklistedPools: response?.blacklistedPools ?? [],
        };

        const categories = await prisma.prismaPoolCategory.findMany({});
        const incentivized = categories.filter((item) => item.category === 'INCENTIVIZED').map((item) => item.poolId);
        const blacklisted = categories.filter((item) => item.category === 'BLACK_LISTED').map((item) => item.poolId);

        await this.updatePoolCategory(incentivized, config.incentivizedPools, 'INCENTIVIZED');
        await this.updatePoolCategory(blacklisted, config.blacklistedPools, 'BLACK_LISTED');
    }

    private async updatePoolCategory(currentPoolIds: string[], newPoolIds: string[], category: PrismaPoolCategoryType) {
        const itemsToAdd = newPoolIds.filter((poolId) => !currentPoolIds.includes(poolId));
        const itemsToRemove = currentPoolIds.filter((poolId) => !newPoolIds.includes(poolId));

        await prisma.$transaction([
            prisma.prismaPoolCategory.createMany({
                data: itemsToAdd.map((poolId) => ({
                    id: `${poolId}-${category}`,
                    category,
                    poolId,
                })),
                skipDuplicates: true,
            }),
            prisma.prismaPoolCategory.deleteMany({
                where: { poolId: { in: itemsToRemove }, category },
            }),
        ]);
    }
}
