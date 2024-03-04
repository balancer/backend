import { ViemClient } from '../types';
import vaultV3Abi from './abis/VaultV3';

type PoolTokenInfo = {
    tokens: `0x${string}`[];
    tokenTypes: number[];
    balancesRaw: bigint[];
    decimalScalingFactors: bigint[];
    rateProviders: `0x${string}`[];
};

type PoolTokenRates = {
    tokenRates: bigint[];
};

export async function fetchPoolTokenInfo(
    vault: string,
    pools: string[],
    client: ViemClient,
    blockNumber?: bigint,
): Promise<Record<string, PoolTokenInfo>> {
    const contracts = pools
        .map((pool) => [
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'getPoolTokenInfo',
                args: [pool as `0x${string}`],
            } as const,
        ])
        .flat();

    const results = await client.multicall({ contracts, blockNumber: blockNumber });

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

export async function fetchPoolTokenRates(
    vault: string,
    pools: string[],
    client: ViemClient,
    blockNumber?: bigint,
): Promise<Record<string, bigint[]>> {
    const contracts = pools
        .map((pool) => [
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'getPoolTokenRates',
                args: [pool as `0x${string}`],
            } as const,
        ])
        .flat();

    const results = await client.multicall({ contracts, blockNumber: blockNumber });

    // Parse the results
    const parsedResults = results
        .map((result, i) => {
            if (result.status === 'success' && result.result !== undefined) {
                // parse the result here using the abi
                return [pools[i], result.result];
            }
            // Handle the error
            return undefined;
        })
        .filter((result): result is NonNullable<typeof result> => result !== undefined);

    return Object.fromEntries(parsedResults) as Record<string, bigint[]>;
}
