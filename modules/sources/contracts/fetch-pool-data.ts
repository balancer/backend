import { AbiParameterToPrimitiveType, ExtractAbiFunction } from 'abitype';
import { ViemClient } from '../types';
import vaultV3Abi from './abis/VaultV3';

// TODO: Find out if we need to do that,
// or can somehow get the correct type infered automatically from the viem's result set?
type PoolConfig = AbiParameterToPrimitiveType<ExtractAbiFunction<typeof vaultV3Abi, 'getPoolConfig'>['outputs'][0]>;

export interface OnchainPoolData {
    totalSupply: bigint;
    swapFee: bigint;
    // rate?: bigint;
    // amp?: [bigint, boolean, bigint];
    isPoolPaused: boolean;
    isPoolInRecoveryMode: boolean;
    tokens: {
        address: string;
        balance: bigint;
        rateProvider: string;
        rate: bigint;
    }[];
}

export async function fetchPoolData(
    vault: string,
    pools: string[],
    client: ViemClient,
    blockNumber?: bigint,
): Promise<{ [address: string]: OnchainPoolData }> {
    const contracts = pools
        .map((pool) => [
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'totalSupply',
                args: [pool as `0x${string}`],
            },
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'getPoolConfig',
                args: [pool as `0x${string}`],
            },
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'getPoolTokenInfo',
                args: [pool as `0x${string}`],
            },
            {
                address: vault as `0x${string}`,
                abi: vaultV3Abi,
                functionName: 'getPoolTokenRates',
                args: [pool as `0x${string}`],
            },
        ])
        .flat();

    const results = await client.multicall({ contracts, blockNumber: blockNumber });

    // Parse the results
    const parsedResults = pools.map((pool, i) => {
        const pointer = i * 4;
        const config =
            results[pointer + 1].status === 'success'
                ? (results[pointer + 1].result as unknown as PoolConfig)
                : undefined;
        const poolTokens =
            results[pointer + 2].status === 'success'
                ? {
                      tokens: (results[pointer + 2].result as any)[0],
                      balancesRaw: (results[pointer + 2].result as any)[2],
                      rateProviders: (results[pointer + 2].result as any)[4],
                  }
                : undefined;
        const poolTokenRates =
            results[pointer + 3].status === 'success' ? (results[pointer + 3].result as any) : undefined;

        return [
            pool.toLowerCase(),
            {
                totalSupply: results[pointer].status === 'success' ? (results[pointer].result as bigint) : undefined,
                swapFee: config?.staticSwapFeePercentage,
                isPoolPaused: config?.isPoolPaused,
                isPoolInRecoveryMode: config?.isPoolInRecoveryMode,
                tokens: poolTokens?.tokens.map((token: string, i: number) => ({
                    address: token.toLowerCase(),
                    balance: poolTokens.balancesRaw[i],
                    rateProvider: poolTokens.rateProviders[i],
                    rate: poolTokenRates[i],
                })),
            },
        ];
    });

    return Object.fromEntries(parsedResults);
}
