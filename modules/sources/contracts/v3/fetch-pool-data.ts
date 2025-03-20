import { AbiParameterToPrimitiveType, ExtractAbiFunction } from 'abitype';
import { ViemClient } from '../../types';
import VaultV3Abi from '../abis/VaultV3';
import { formatEther, formatUnits } from 'viem';
import { Chain } from '@prisma/client';

// TODO: Find out if we need to do that,
// or can somehow get the correct type infered automatically from the viem's result set?
type PoolConfig = AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolConfig'>['outputs'][0]>;
type PoolTokenInfo = [
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenInfo'>['outputs'][0]>, // token address array
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenInfo'>['outputs'][1]>, // tokenInfo (rateprovider etc)
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenInfo'>['outputs'][2]>, // balancesRaw
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenInfo'>['outputs'][3]>, // lastLiveBalances
];
type PoolTokenRates = [
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenRates'>['outputs'][0]>, // decimalScalingFactors
    AbiParameterToPrimitiveType<ExtractAbiFunction<typeof VaultV3Abi, 'getPoolTokenRates'>['outputs'][1]>, // tokenRates
];

export interface PoolDataV3 {
    poolDynamicData: {
        id: string;
        totalShares: string;
        totalSharesNum: number;
        swapFee: string;
        aggregateSwapFee?: string;
        aggregateYieldFee?: string;
        // amp?: [bigint, boolean, bigint];
        isPaused: boolean;
        isInRecoveryMode: boolean;
        blockNumber: number;
    };
    poolToken: {
        id: string;
        index: number;
        address: string;
        balance: string;
        priceRateProvider: string;
        priceRate: string;
        scalingFactor: string;
        exemptFromProtocolYieldFee: boolean;
    }[];
}

export async function fetchPoolData(
    vault: string,
    pools: string[],
    client: ViemClient,
    blockNumber: bigint,
): Promise<{ [address: string]: PoolDataV3 }> {
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
            results[pointer + 3].status === 'success'
                ? (results[pointer + 3].result as unknown as PoolTokenRates)
                : undefined;

        const totalShares = formatEther(
            results[pointer].status === 'success' ? (results[pointer].result as bigint) : 0n,
        );

        const decimals = decodeDecimalDiffs(Number(config?.tokenDecimalDiffs), poolTokenInfo?.[0].length ?? 0);

        return [
            pool.toLowerCase(),
            {
                poolDynamicData: {
                    id: pool.toLowerCase(),
                    totalShares,
                    totalSharesNum: parseFloat(totalShares),
                    swapFee: formatEther(config?.staticSwapFeePercentage ?? 0n),
                    aggregateSwapFee: formatEther(config?.aggregateSwapFeePercentage ?? 0n),
                    aggregateYieldFee: formatEther(config?.aggregateYieldFeePercentage ?? 0n),
                    isPaused: config?.isPoolPaused,
                    isInRecoveryMode: config?.isPoolInRecoveryMode,
                    blockNumber: Number(blockNumber),
                },
                poolToken: poolTokenInfo?.[0].map((token: string, i: number) => ({
                    id: `${pool.toLowerCase()}-${token.toLowerCase()}`,
                    index: i,
                    address: token.toLowerCase(),
                    balance: formatUnits(poolTokenInfo[2][i], decimals[i]),
                    exemptFromProtocolYieldFee: !poolTokenInfo[1][i].paysYieldFees,
                    priceRateProvider: poolTokenInfo[1][i].rateProvider.toLowerCase(),
                    priceRate: formatEther(poolTokenRates ? poolTokenRates[1][i] : 1000000000000000000n),
                    scalingFactor: String(poolTokenRates ? poolTokenRates[0][i] : 1000000000000000000n),
                })),
            } as PoolDataV3,
        ];
    });

    return Object.fromEntries(parsedResults);
}

const DECIMAL_DIFF_BITS = 5;

const decodeDecimalDiffs = (diff: number, numTokens: number): number[] => {
    const result: number[] = [];

    for (let i = 0; i < numTokens; i++) {
        // Compute the 5-bit mask for each token.
        const mask = (2 ** DECIMAL_DIFF_BITS - 1) << (i * DECIMAL_DIFF_BITS);
        // Logical AND with the input, and shift back down to get the final result.
        result[i] = (diff & mask) >> (i * DECIMAL_DIFF_BITS);
    }

    return result.map((d) => 18 - d);
};
