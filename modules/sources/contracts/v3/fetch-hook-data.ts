import { formatEther } from 'viem';
import type { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { multicallViem } from '../../../web3/multicaller-viem';
import { ViemClient } from '../../types';
import * as hooks from '../hooks';
import { GqlHookType } from '../../../../apps/api/gql/generated-schema';

export const fetchHookData = async (
    client: ViemClient,
    address: string,
    type: GqlHookType,
    poolAddress: string,
): Promise<Record<string, string>> => {
    let calls: ViemMulticallCall[] = [];

    switch (type) {
        case 'FEE_TAKING':
            calls = [...calls, ...hooks.feeTakingHook(address)];
            break;
        case 'EXIT_FEE':
            calls = [...calls, ...hooks.exitFeeHook(address)];
            break;
        case 'STABLE_SURGE':
            calls = [...calls, ...hooks.stableSurgeHook(address, poolAddress)];
            break;
        case 'MEV_TAX':
            calls = [...calls, ...hooks.mevTaxHook(address, poolAddress)];
            break;
        default:
            break;
    }

    const results = await multicallViem(client, calls);

    // Parse all results bignumber values to percentages
    for (const key of Object.keys(results)) {
        try {
            results[key] = formatEther(results[key]);
        } catch (e) {
            console.error(`Error parsing hook data for ${address} ${key} ${results[key]}`, e);
        }
    }

    console.log('Hook data', results);

    return results;
};
