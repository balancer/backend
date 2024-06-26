import { AbiParameterToPrimitiveType, ExtractAbiFunction, parseAbi } from 'abitype';
import { ViemClient } from '../types';
import VaultV3Abi from './abis/VaultV3';

// TODO: Find out if we need to do that,
// or can somehow get the correct type infered automatically from the viem's result set?
type PoolConfig = AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolConfig'>['outputs'][0]>;
type PoolTokenInfo = [
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenInfo'>['outputs'][0]>,
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenInfo'>['outputs'][1]>,
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenInfo'>['outputs'][2]>,
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenInfo'>['outputs'][3]>,
];

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
                abi: VaultV3Abi,
                functionName: 'totalSupply',
                args: [pool as `0x${string}`],
            },
            {
                address: vault as `0x${string}`,
                abi: VaultV3Abi,
                functionName: 'getPoolConfig',
                args: [pool as `0x${string}`],
            },
            {
                address: vault as `0x${string}`,
                abi: VaultV3Abi,
                functionName: 'getPoolTokenInfo',
                args: [pool as `0x${string}`],
            },
            {
                address: vault as `0x${string}`,
                abi: VaultV3Abi,
                functionName: 'getPoolTokenRates',
                args: [pool as `0x${string}`],
            },
        ])
        .flat();

    // @ts-ignore – viem has some issues with the typings when using imported abis
    const results = await client.multicall({ contracts, blockNumber });

    // Parse the results
    const parsedResults = pools.map((pool, i) => {
        const pointer = i * 4;
        const config =
            results[pointer + 1].status === 'success'
                ? (results[pointer + 1].result as unknown as PoolConfig)
                : undefined;
        const poolTokenInfo =
            results[pointer + 2].status === 'success'
                ? (results[pointer + 2].result as unknown as PoolTokenInfo)
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
                tokens: poolTokenInfo?.[0].map((token: string, i: number) => ({
                    address: token.toLowerCase(),
                    balance: poolTokenInfo[2][i],
                    paysYieldFees: poolTokenInfo[1][i].paysYieldFees,
                    rateProvider: poolTokenInfo[1][i].rateProvider,
                    rate: poolTokenRates[i],
                })),
            },
        ];
    });

    return Object.fromEntries(parsedResults);
}
