import { sanityClient } from '../../util/sanity';
import { env } from '../../../app/env';
import { prisma } from '../../util/prisma-client';

export class PoolSanityDataLoaderService {
    public async syncPoolSanityData() {
        const response = await sanityClient.fetch(`*[_type == "config" && chainId == ${env.CHAIN_ID}][0]`);

        const config = {
            incentivizedPools: response?.incentivizedPools ?? [],
            featuredPools: response?.featuredPools ?? [],
            homeFeaturedPools: response?.homeFeaturedPools ?? [],
            blacklistedPools: response?.blacklistedPools ?? [],
        };

        const categories = await prisma.prismaPoolCategory.findMany({});
        const incentivized = categories.filter((item) => item.category === 'INCENTIVIZED').map((item) => item.poolId);
        const featured = categories.filter((item) => item.category === 'FEATURED').map((item) => item.poolId);
        const homeFeatured = categories.filter((item) => item.category === 'HOME_FEATURED').map((item) => item.poolId);
        const blacklisted = categories.filter((item) => item.category === 'BLACK_LISTED').map((item) => item.poolId);

        let operations: any[] = [];
    }
}
