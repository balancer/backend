/**
 * Dynamic data changes over time and needs to be updated periodically.
 * Contract data is used as a source of truth.
 */

import { update } from './update';
import { PoolsClient } from '../../../sources/contracts';
import { PrismaPoolType } from '@prisma/client';

export async function syncDynamicTypeDataForPools(
    poolsClient: PoolsClient,
    pools: {
        id: string;
        type: PrismaPoolType;
    }[],
    blockNumber?: bigint,
): Promise<void> {
    // Get dynamic data for each pool type
    const params = await poolsClient.fetchPoolTypeData(pools, blockNumber);

    await update(params);
}
