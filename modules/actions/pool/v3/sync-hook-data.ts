import { fetchHookData } from '../../../sources/contracts/hooks/fetch-hook-data';
import { prisma } from '../../../../prisma/prisma-client';
import type { ViemClient } from '../../../sources/viem-client';
import type { Chain, PrismaPool } from '@prisma/client';
import { HookData } from '../../../sources/transformers';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { GqlHookType } from '../../../../apps/api/gql/generated-schema';

/**
 * Gets and stores known hooks data
 *
 * @param hooks - known hooks addresses
 * @param viemClient
 */
export const syncHookData = async (
    pools: PrismaPool[],
    hooks: Record<string, GqlHookType>,
    viemClient: ViemClient,
    chain: Chain,
): Promise<void> => {
    if (pools.length === 0) {
        return;
    }
    const operations = [];

    for (const pool of pools) {
        const hookData = pool.hook as HookData | null;
        if (!hookData) {
            continue;
        }

        let hookType: GqlHookType = 'UNKNOWN';

        try {
            hookType = hooks[hookData.address];
        } catch (e) {
            console.log(`Error getting hook type for ${hookData.address}`, e);
        }

        // Get hooks data
        const data = await fetchHookData(viemClient, hookData.address, hookType, pool.address);

        const name = ``;

        operations.push(
            prisma.prismaPool.update({
                where: { id_chain: { id: pool.id, chain } },
                data: {
                    hook: {
                        ...(hookData as HookData),
                        name,
                        type: hookType,
                        dynamicData: data,
                    },
                },
            }),
        );
    }
    await prismaBulkExecuteOperations(operations, false);
};
