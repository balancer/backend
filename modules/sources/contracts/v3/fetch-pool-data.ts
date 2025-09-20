import { AbiParameterToPrimitiveType, ExtractAbiFunction } from 'abitype';
import { ViemClient } from '../../types';
import VaultV3Abi from '../abis/VaultV3';
import { formatEther, formatUnits } from 'viem';
import { multicallViem } from '../../../web3/multicaller-viem';

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

export const poolDataCalls = (pool: string, vault: string, blockNumber: bigint) => [
    {
        path: `${pool.toLowerCase()}.poolDynamicData`,
        address: vault as `0x${string}`,
        abi: VaultV3Abi,
        functionName: 'totalSupply',
        args: [pool as `0x${string}`],
        parser: (result: bigint) => ({
            totalShares: formatEther(result),
            totalSharesNum: parseFloat(formatEther(result)),
        }),
    },
    {
        path: `${pool.toLowerCase()}.poolDynamicData`,
        address: vault as `0x${string}`,
        abi: VaultV3Abi,
        functionName: 'getPoolConfig',
        args: [pool as `0x${string}`],
        parser: (config: PoolConfig) => ({
            swapFee: formatEther(config.staticSwapFeePercentage ?? 0n),
            aggregateSwapFee: formatEther(config.aggregateSwapFeePercentage ?? 0n),
            aggregateYieldFee: formatEther(config.aggregateYieldFeePercentage ?? 0n),
            isPaused: config.isPoolPaused,
            isInRecoveryMode: config.isPoolInRecoveryMode,
            blockNumber: Number(blockNumber),
        }),
    },
    {
        path: `${pool.toLowerCase()}.poolToken`,
        address: vault as `0x${string}`,
        abi: VaultV3Abi,
        functionName: 'getPoolTokenInfo',
        args: [pool as `0x${string}`],
        parser: (poolTokenInfo: PoolTokenInfo, results: any, index: number) => {
            const config =
                results[index - 1].status === 'success' ? (results[index - 1].result as PoolConfig) : undefined;

            if (!config) {
                return [];
            }

            const poolTokenRates =
                results[index + 1].status === 'success' ? (results[index + 1].result as PoolTokenRates) : undefined;

            return poolTokenInfo[0].map((token: string, i: number) => ({
                id: `${pool.toLowerCase()}-${token.toLowerCase()}`,
                index: i,
                address: token.toLowerCase(),
                balance: poolTokenInfo[2][i].toString(), // we format the decimals after
                exemptFromProtocolYieldFee: !poolTokenInfo[1][i].paysYieldFees,
                priceRateProvider: poolTokenInfo[1][i].rateProvider.toLowerCase(),
                priceRate: formatEther(poolTokenRates ? poolTokenRates[1][i] : 1000000000000000000n),
                scalingFactor: String(poolTokenRates ? poolTokenRates[0][i] : 1000000000000000000n),
            }));
        },
    },
    {
        address: vault as `0x${string}`,
        abi: VaultV3Abi,
        functionName: 'getPoolTokenRates',
        args: [pool as `0x${string}`],
    },
];

export async function fetchPoolData(
    vault: string,
    pools: string[],
    client: ViemClient,
    blockNumber: bigint,
): Promise<{ [address: string]: PoolDataV3 }> {
    const calls = pools.map((pool) => poolDataCalls(pool, vault, blockNumber)).flat();

    const results = await multicallViem<{ [address: string]: PoolDataV3 }>(client, calls, blockNumber);

    return results;
}
