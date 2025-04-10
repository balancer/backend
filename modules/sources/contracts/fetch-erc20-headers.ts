import { parseAbi } from 'viem';
import type { ViemClient } from '../types';

const poolAbi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
];

const abi = parseAbi(poolAbi);

export async function fetchErc20Headers(addresses: readonly `0x${string}`[], client: ViemClient) {
    const contracts = addresses
        .map((address) => [
            {
                address,
                abi,
                functionName: 'name',
            },
            {
                address,
                abi,
                functionName: 'symbol',
            },
            {
                address,
                abi,
                functionName: 'decimals',
            },
        ])
        .flat();

    const results = await client.multicall({ contracts });

    // Parse the results
    const parsedResults = results.map((result) => {
        if (result.status === 'success' && result.result !== undefined) {
            return result.result as string;
        }
        // Handle the error
        return undefined;
    });

    return Object.fromEntries(
        addresses.map((address, i) => [
            address,
            {
                name: String(parsedResults[i * 3]),
                symbol: String(parsedResults[i * 3 + 1]),
                decimals: Number(parsedResults[i * 3 + 2]),
            },
        ]),
    );
}
