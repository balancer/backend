import { ContractFunctionParameters } from 'viem';
import { ViemClient } from '../../modules/sources/types';

export type ViemMulticallCall = { path: string } & ContractFunctionParameters;

/**
 * Wrapper for multicall that takes an array of calls and returns an object with the results mapped by the path
 *
 * @param client
 * @param calls
 * @returns
 */
export const multicallViem = async (client: ViemClient, calls: ViemMulticallCall[]) => {
    const results = await client.multicall({ contracts: calls });

    const parsedResults = calls.map((call, i) => [
        call.path,
        results[i].status === 'success' ? results[i].result : undefined,
    ]);

    return Object.fromEntries(parsedResults);
};
