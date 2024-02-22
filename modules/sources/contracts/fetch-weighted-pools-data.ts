import { parseAbi, formatEther } from 'viem';
import { ViemClient } from '../types';

const abi = parseAbi(['function getNormalizedWeights() view returns (uint[] weights)']);

interface WeightedPoolData {
    weights: string[];
}

export async function fetchWeightedPoolData(pools: string[], client: ViemClient) {
    const contracts = pools
        .map((pool) => [
            {
                address: pool as `0x${string}`,
                abi,
                args: [],
                functionName: 'getNormalizedWeights',
            },
        ])
        .flat();

    const results = await client.multicall({ contracts });

    // Parse the results
    const parsedResults = results
        .map((result, i) => {
            if (result.status === 'success' && result.result !== undefined) {
                return [
                    pools[i],
                    {
                        weights: result.result.map((weight) => formatEther(weight)),
                    },
                ];
            }
            // Handle the error
            return undefined;
        })
        .filter((result): result is NonNullable<typeof result> => result !== undefined);

    return Object.fromEntries(parsedResults) as Record<string, WeightedPoolData>;
}
