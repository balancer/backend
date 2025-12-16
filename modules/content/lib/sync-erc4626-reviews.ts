import { prisma } from '../../../prisma/prisma-client';
import { githubChainToChain } from './github-helper';

export const syncErc4626Reviews = async (): Promise<void> => {
    const erc4626Reviews = await getErc4626Reviews();

    const data = erc4626Reviews.map((item) => ({
        chain: item.chain,
        erc4626Address: item.erc4626Address.toLowerCase(),
        name: item.name,
        assetAddress: item.asset.toLowerCase(),
        summary: item.summary,
        canUseBufferForSwaps: item.canUseBufferForSwaps,
        useUnderlyingForAddRemove: item.useUnderlyingForAddRemove,
        useWrappedForAddRemove: item.useWrappedForAddRemove,
        reviewFile: item.review,
        warnings: item.warnings.join(','),
    }));

    await prisma.$transaction([
        prisma.prismaErc4626ReviewData.deleteMany(),
        prisma.prismaErc4626ReviewData.createMany({ data, skipDuplicates: true }),
    ]);
};

const ERC4626_REVIEW_URL =
    'https://raw.githubusercontent.com/balancer/code-review/refs/heads/main/erc4626/registry.json';

interface Erc4626Review {
    [chain: string]: {
        [erc4626Address: string]: {
            name: string;
            asset: string;
            summary: string;
            review: string;
            canUseBufferForSwaps: boolean;
            useUnderlyingForAddRemove: boolean;
            useWrappedForAddRemove: boolean;
            warnings: string[];
        };
    };
}

const getErc4626Reviews = async () => {
    const response = await fetch(ERC4626_REVIEW_URL);
    const list = (await response.json()) as Erc4626Review;

    // Flatten the list by adding the chain and erc4626 address to the object
    const erc4626Tokens = Object.keys(list).flatMap((chain) =>
        Object.keys(list[chain]).map((erc4626Address) => ({
            ...list[chain][erc4626Address],
            chain: githubChainToChain[chain],
            erc4626Address,
        })),
    );

    return erc4626Tokens;
};
