import { prisma } from '../../../prisma/prisma-client';
import { HookData } from '../../../prisma/prisma-types';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { Chain } from '@prisma/client';
import config from '../../../config';
import { githubChainToChain } from './github-helper';

export const syncHookReviews = async (): Promise<void> => {
    const hookReviews = await getHookReviews();

    const data = hookReviews.map((item) => ({
        chain: item.chain,
        name: item.name,
        hookAddress: item.hookAddress.toLowerCase(),
        description: item.description,
        summary: item.summary,
        reviewFile: item.review,
        warnings: item.warnings,
    }));

    // Get hook addresses from the database
    const poolsWithHooks = await prisma.prismaPool.findMany({
        where: {
            hook: { path: ['address'], string_starts_with: '0x' },
        },
    });

    const operations = [];

    for (const pool of poolsWithHooks) {
        const filteredData = data.find(
            (item) => pool.chain === item.chain && (pool.hook as HookData).address === item.hookAddress,
        );
        operations.push(
            prisma.prismaPool.update({
                where: { id_chain: { id: pool.id, chain: pool.chain } },
                data: {
                    hook: {
                        ...(pool.hook as HookData),
                        reviewData: filteredData,
                    },
                },
            }),
        );
    }

    await prismaBulkExecuteOperations(operations, false);
};

const HOOK_REVIEW_URL = 'https://raw.githubusercontent.com/balancer/code-review/refs/heads/main/hooks/registry.json';

interface HookReview {
    [chain: string]: {
        [hookAddress: string]: {
            name: string;
            description: string;
            summary: string;
            review: string;
            warnings: string[];
        };
    };
}

const getHookReviews = async () => {
    const response = await fetch(HOOK_REVIEW_URL);
    const list = (await response.json()) as HookReview;

    // Flatten the list by adding the chain and hook address to the object
    const hooks = Object.keys(list).flatMap((chain) =>
        Object.keys(list[chain]).map((hookAddress) => ({
            ...list[chain][hookAddress],
            chain: githubChainToChain[chain],
            hookAddress,
        })),
    );

    return hooks;
};
