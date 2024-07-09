import { prisma } from '../../../prisma/prisma-client';
import { getRateProviderReviews } from '../../sources/github/rate-providers';

const RATEPROVIDER_BASE_URL = 'https://raw.githubusercontent.com/balancer/code-review/main/rate-providers/';

export const syncRateProviderReviews = async (): Promise<void> => {
    const rateProviders = await getRateProviderReviews();

    const data = rateProviders.map((item) => ({
        reviewed: true,
        name: item.name,
        chain: item.chain,
        summary: item.summary,
        tokenAddress: item.asset.toLowerCase(),
        rateProviderAddress: item.rateProviderAddress.toLowerCase(),
        reviewUrl: RATEPROVIDER_BASE_URL + item.review,
        warnings: item.warnings.join(','),
        upgradableComponents: item.upgradeableComponents.map((component) => ({
            entryPoint: component.entrypoint,
            implementationReviewed: component.implementationReviewed,
        })),
    }));

    await prisma.$transaction([
        prisma.prismaPriceRateProviderData.deleteMany(),
        prisma.prismaPriceRateProviderData.createMany({ data, skipDuplicates: true }),
    ]);
};
