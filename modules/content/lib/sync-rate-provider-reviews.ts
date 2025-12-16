import { prisma } from '../../../prisma/prisma-client';
import { githubChainToChain } from './github-helper';

const RATEPROVIDER_REVIEW_URL =
    'https://raw.githubusercontent.com/balancer/code-review/main/rate-providers/registry.json';

export const syncRateProviderReviews = async (): Promise<void> => {
    const rateProviders = await getRateProviderReviews();

    const data = rateProviders.map((item) => ({
        reviewed: true,
        name: item.name,
        chain: item.chain,
        summary: item.summary,
        tokenAddress: item.asset.toLowerCase(),
        rateProviderAddress: item.rateProviderAddress.toLowerCase(),
        reviewUrl: item.review,
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

interface RateProviderReview {
    [chain: string]: {
        [rateproviderAddress: string]: {
            name: string;
            asset: string;
            summary: string;
            review: string;
            warnings: string[];
            factory: string;
            upgradeableComponents: {
                entrypoint: string;
                implementationReviewed: string;
            }[];
        };
    };
}

const getRateProviderReviews = async () => {
    const response = await fetch(RATEPROVIDER_REVIEW_URL);
    const list = (await response.json()) as RateProviderReview;

    // Flatten the list by adding the chain and rate provider address to the object
    const rateProviders = Object.keys(list).flatMap((chain) =>
        Object.keys(list[chain]).map((rateProviderAddress) => ({
            ...list[chain][rateProviderAddress],
            chain: githubChainToChain[chain],
            rateProviderAddress,
        })),
    );

    return rateProviders;
};
