import { ContractFunctionParameters } from 'viem';
import { ViemClient } from '../../modules/sources/types';
import { set } from 'lodash';

export type ViemMulticallCall = { path: string } & ContractFunctionParameters;

/**
 * Wrapper for multicall that takes an array of calls and returns an object with the results mapped by the path
 *
 * @param client
 * @param calls
 * @returns
 */
export async function multicallViem<T extends Record<string, any>>(
    client: ViemClient,
    calls: ViemMulticallCall[],
    blockNumber?: bigint,
): Promise<T> {
    const results = await client.multicall({ contracts: calls, blockNumber });

    const returnObject = {};
    let i = 0;
    for (const call of calls) {
        const resultValue = results[i].status === 'success' ? results[i].result : undefined;
        set(returnObject, call.path, resultValue);
        i++;
    }
    return returnObject as T;
}
