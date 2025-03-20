import { fetchHookData } from '../../../sources/contracts/v3/fetch-hook-data';
import { prisma } from '../../../../prisma/prisma-client';
import type { ViemClient } from '../../../sources/viem-client';
import type { PrismaPool } from '@prisma/client';
import { HookData } from '../../../../prisma/prisma-types';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';

/**
 * Gets and stores known hooks data
 *
 * @param hooks - known hooks addresses
 * @param viemClient
 */
export const syncHookData = async (pools: PrismaPool[], viemClient: ViemClient): Promise<string[]> => {
    if (pools.length === 0) {
        return [];
    }

    const poolsMap = new Map<string, PrismaPool>();
    pools.forEach((pool) => poolsMap.set(pool.address, pool));

    const hooksInput = pools.flatMap((pool) =>
        pool.hook
            ? [
                  {
                      id: pool.address,
                      hook: pool.hook as HookData,
                  },
              ]
            : [],
    );

    const data = await fetchHookData(viemClient, hooksInput);

    const operations = [];
    for (const poolAddress of Object.keys(data)) {
        const pool = poolsMap.get(poolAddress);
        if (!pool) {
            continue;
        }

        // Get hooks data
        const hook = {
            ...(pool.hook as HookData),
            dynamicData: data[poolAddress],
        };

        operations.push(
            prisma.prismaPool.update({
                where: { id_chain: { id: pool.id, chain: pool.chain } },
                data: {
                    hook,
                },
            }),
        );
    }

    await prismaBulkExecuteOperations(operations, false);

    return Object.keys(data);
};
