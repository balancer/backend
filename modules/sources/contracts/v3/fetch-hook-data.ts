import { formatEther } from 'viem';
import type { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { multicallViem } from '../../../web3/multicaller-viem';
import { ViemClient } from '../../types';
import * as hookCalls from '../hooks';
import { GqlHookType } from '../../../../apps/api/gql/generated-schema';
import { HookData } from '../../transformers';

const typeToCallsMap = {
    FEE_TAKING: hookCalls.feeTakingHook,
    EXIT_FEE: hookCalls.exitFeeHook,
    STABLE_SURGE: hookCalls.stableSurgeHook,
    MEV_TAX: hookCalls.mevTaxHook,
};

export const fetchHookData = async (
    client: ViemClient,
    pools: {
        address: string;
        hook: HookData;
    }[],
): Promise<{ [poolAddress: string]: Record<string, string> }> => {
    if (pools.length === 0) {
        return {};
    }

    let calls: ViemMulticallCall[] = [];

    for (const pool of pools) {
        const typeCalls = typeToCallsMap[pool.hook.type as keyof typeof typeToCallsMap];
        if (typeCalls) {
            calls = [...calls, ...typeCalls(pool.hook.address, pool.address)];
        }
    }

    const results = await multicallViem(client, calls);

    // Parse all results bignumber values to percentages
    for (const poolAddress of Object.keys(results)) {
        results[poolAddress] = parseHookData(results[poolAddress], poolAddress);
    }

    return results;
};

const parseHookData = (data: Record<string, any>, poolAddress: string): Record<string, string> => {
    const parsedData: Record<string, string> = {};

    for (const key of Object.keys(data)) {
        try {
            parsedData[key] = formatEther(data[key]);
        } catch (e) {
            console.error(`Error parsing hook data for ${poolAddress} ${key} ${data[key]}`, e);
        }
    }

    return parsedData;
};
