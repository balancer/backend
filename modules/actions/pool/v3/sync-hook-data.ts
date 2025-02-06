import { fetchHookData } from '../../../sources/contracts/hooks/fetch-hook-data';
import { prisma } from '../../../../prisma/prisma-client';
import type { HookType } from '../../../network/network-config-types';
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
    hooksTypes: { feeTakingHook?: string[]; exitFeeHook?: string[]; stableSurgeHook?: string[] },
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
        const keys = Object.keys(hooksTypes) as HookType[];
        const hookKey = keys.find((key) => hooksTypes[key]?.includes(hookData.address));
        let hookType: GqlHookType = 'UNKNOWN';
        switch (hookKey) {
            case 'feeTakingHook':
                hookType = 'FEE_TAKING';
            case 'exitFeeHook':
                hookType = 'EXIT_FEE';
            case 'stableSurgeHook':
                hookType = 'STABLE_SURGE';
            default:
                hookType = 'UNKNOWN';
        }

        if (!hookType || !hookKey) {
            continue;
        }

        // Get hooks data
        const data = await fetchHookData(viemClient, hookData.address, hookType, pool.address);

        const name = `${hookKey.charAt(0).toUpperCase()}${hookKey.slice(1)}`;

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
