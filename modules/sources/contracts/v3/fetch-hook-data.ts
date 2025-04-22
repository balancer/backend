import type { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { multicallViem } from '../../../web3/multicaller-viem';
import { ViemClient } from '../../types';
import * as hookCallFns from '../hooks';
import { HookData } from '../../../../prisma/prisma-types';

export const hookCallsMap = {
    FEE_TAKING: hookCallFns.feeTakingHook,
    EXIT_FEE: hookCallFns.exitFeeHook,
    STABLE_SURGE: hookCallFns.stableSurgeHook,
    MEV_TAX: hookCallFns.mevTaxHook,
};

export const hookDataCalls = (pool: { id: string; hook?: HookData }) => {
    if (!pool.hook) {
        return [];
    }

    const callsFn = hookCallsMap[pool.hook.type as keyof typeof hookCallsMap];
    return callsFn ? callsFn(pool.hook.address, pool.id) : [];
};

export const fetchHookData = async (
    client: ViemClient,
    pools: {
        id: string;
        hook: HookData;
    }[],
    blockNumber?: bigint,
): Promise<{ [poolAddress: string]: Record<string, string> }> => {
    if (pools.length === 0) {
        return {};
    }

    let calls: ViemMulticallCall[] = [];

    for (const pool of pools) {
        calls = [...calls, ...hookDataCalls(pool)];
    }

    const results = await multicallViem<Record<string, { pool: { hook: { dynamicData: Record<string, string> } } }>>(
        client,
        calls,
        blockNumber,
    );

    return Object.fromEntries(
        Object.entries(results).map(([poolAddress, result]) => {
            return [poolAddress, result.pool.hook.dynamicData];
        }),
    );
};
