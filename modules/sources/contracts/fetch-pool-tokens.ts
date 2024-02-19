import { parseAbi } from 'viem';
import { ViemClient } from '../types';

type PoolTokenInfo = {
    tokens: `0x${string}`[];
    tokenTypes: number[];
    balancesRaw: bigint[];
    decimalScalingFactors: bigint[];
    rateProviders: `0x${string}`[];
};

const abi = parseAbi([
    'function getPoolTokenInfo(address pool) view returns (address[] tokens, uint8[] tokenTypes, uint[] balancesRaw, uint[] decimalScalingFactors, address[] rateProviders)',
]);

export async function fetchPoolTokens(vault: string, pools: string[], client: ViemClient) {
    const contracts = pools
        .map((pool) => [
            {
                address: vault as `0x${string}`,
                abi,
                args: [pool as `0x${string}`],
                functionName: 'getPoolTokenInfo',
            },
        ])
        .flat();

    const results = await client.multicall({ contracts });

    // Parse the results
    const parsedResults = results
        .map((result, i) => {
            if (result.status === 'success' && result.result !== undefined) {
                // parse the result here using the abi
                const poolTokens = {
                    tokens: result.result[0],
                    tokenTypes: result.result[1],
                    balancesRaw: result.result[2],
                    decimalScalingFactors: result.result[3],
                    rateProviders: result.result[4],
                } as PoolTokenInfo;

                return [pools[i], poolTokens];
            }
            // Handle the error
            return undefined;
        })
        .filter((result): result is NonNullable<typeof result> => result !== undefined);

    return Object.fromEntries(parsedResults) as Record<string, PoolTokenInfo>;
}
