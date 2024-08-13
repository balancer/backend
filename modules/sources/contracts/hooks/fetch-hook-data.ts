import { formatEther } from 'viem';
import type { HookType } from '../../../network/network-config-types';
import type { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { multicallViem } from '../../../web3/multicaller-viem';
import { ViemClient } from '../../types';
import { feeTakingHook } from './fee-taking-hook';
import { removeLiquidityFeeHook } from './remove-liquidity-fee-hook';

export const fetchHookData = async (client: ViemClient, addresses?: Record<string, HookType>) => {
    if (!addresses) {
        return {};
    }

    let calls: ViemMulticallCall[] = [];

    // For each address, hook type get the calls
    for (const [address, type] of Object.entries(addresses)) {
        switch (type) {
            case 'feeTakingHook':
                calls = [...calls, ...feeTakingHook(address)];
                break;
            case 'removeLiquidityFeeHook':
                calls = [...calls, ...removeLiquidityFeeHook(address)];
                break;
            default:
                break;
        }
    }

    const results = await multicallViem(client, calls);

    // Parse all results bignumber values to percentages
    for (const hook of Object.keys(results)) {
        for (const key of Object.keys(results[hook])) {
            results[hook][key] = formatEther(results[hook][key]);
        }
    }

    return results;
};
