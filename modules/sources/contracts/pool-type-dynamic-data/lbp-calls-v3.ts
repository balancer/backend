import abi from '../abis/lb-pool-v3';
import { AbiParametersToPrimitiveTypes, AbiParameterToPrimitiveType, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { formatEther, formatUnits } from 'viem';
import VaultV3Abi from '../abis/VaultV3';
import { decodeDecimalDiffs } from '../v3/parse-helper';

type ImmutableData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof abi, 'getLBPoolImmutableData'>['outputs']
>[0];

type DynamicData = AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof abi, 'getLBPoolDynamicData'>['outputs']>[0];

type ReserveTokenVirtualBalanceRaw = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof abi, 'getReserveTokenVirtualBalance'>['outputs']
>;

type ReserveToken = AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof abi, 'getReserveToken'>['outputs']>[0];

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

export type LBPCallsOutput = {
    poolDynamicData: {
        id: string;
        swapEnabled: boolean;
    };
    poolToken: {
        id: string;
        weight: string;
    }[];
    pool: {
        typeData: {
            reserveTokenVirtualBalance: string;
            isSeedless: boolean;
        };
    };
};

export const lbpCallsV3 = (poolAddress: string, vaultAddress: string): ViemMulticallCall[] => [
    {
        address: poolAddress as `0x${string}`,
        abi,
        functionName: 'getLBPoolImmutableData',
    },
    {
        address: poolAddress as `0x${string}`,
        abi,
        functionName: 'getReserveTokenVirtualBalance',
    },
    {
        address: poolAddress as `0x${string}`,
        abi,
        functionName: 'getReserveToken',
    },
    {
        path: `${poolAddress}`,
        address: poolAddress as `0x${string}`,
        abi,
        functionName: 'getLBPoolDynamicData',
        parser: (result: DynamicData, results: any, index: number) => {
            const immutableData = results[index - 3].result as ImmutableData;
            const tokens = immutableData.tokens;

            const poolToken = tokens.map((token, index) => ({
                id: `${poolAddress}-${token}`.toLowerCase(),
                weight: formatEther(result.normalizedWeights[index]),
            }));

            const poolDynamicData = {
                id: poolAddress,
                swapEnabled: result.isSwapEnabled,
            };

            return { poolToken, poolDynamicData };
        },
    },
    // for seedless LBPs (LBP v3) we need to adjust the token balance with the virtual balance. We fetch the complete pool token info here and override
    // the prior generalized pool call with the adjusted result.
    {
        path: `${poolAddress}.poolDynamicData`,
        address: vaultAddress as `0x${string}`,
        abi: VaultV3Abi,
        functionName: 'getPoolConfig',
        args: [poolAddress as `0x${string}`],
        parser: (config: PoolConfig) => ({
            swapFee: formatEther(config.staticSwapFeePercentage ?? 0n),
            aggregateSwapFee: formatEther(config.aggregateSwapFeePercentage ?? 0n),
            aggregateYieldFee: formatEther(config.aggregateYieldFeePercentage ?? 0n),
            isPaused: config.isPoolPaused,
            isInRecoveryMode: config.isPoolInRecoveryMode,
        }),
    },
    {
        path: `${poolAddress}`,
        address: vaultAddress as `0x${string}`,
        abi: VaultV3Abi,
        functionName: 'getPoolTokenInfo',
        args: [poolAddress as `0x${string}`],
        parser: (poolTokenInfo: PoolTokenInfo, results: any, index: number) => {
            const config =
                results[index - 1].status === 'success' ? (results[index - 1].result as PoolConfig) : undefined;

            if (!config) {
                return [];
            }

            const poolTokenRates =
                results[index + 1].status === 'success' ? (results[index + 1].result as PoolTokenRates) : undefined;

            const decimals = decodeDecimalDiffs(BigInt(config.tokenDecimalDiffs), poolTokenInfo[0].length ?? 0);

            const reserveTokenVirtualBalanceRaw = results[index - 4].result
                ? (results[index - 4].result[0] as bigint)
                : 0n;
            const reserveTokenAddress = results[index - 3].result as `0x${string}`;

            const poolToken = [];
            let reserveTokenVirtualBalance = '0';

            // adjust balance for the reserve token by adding the virtual balance to the pool balance
            // const poolToken = poolTokenInfo[0].map((token: string, i: number) => ({
            for (const [i, token] of poolTokenInfo[0].entries()) {
                if (token.toLowerCase() === reserveTokenAddress.toLowerCase()) {
                    reserveTokenVirtualBalance = formatUnits(reserveTokenVirtualBalanceRaw, decimals[i]);
                }

                poolToken.push({
                    id: `${poolAddress}-${token.toLowerCase()}`,
                    index: i,
                    address: token.toLowerCase(),
                    balance:
                        token.toLowerCase() === reserveTokenAddress.toLowerCase()
                            ? formatUnits(reserveTokenVirtualBalanceRaw + poolTokenInfo[2][i], decimals[i])
                            : formatUnits(poolTokenInfo[2][i], decimals[i]),
                    exemptFromProtocolYieldFee: !poolTokenInfo[1][i].paysYieldFees,
                    priceRateProvider: poolTokenInfo[1][i].rateProvider.toLowerCase(),
                    priceRate: formatEther(poolTokenRates ? poolTokenRates[1][i] : 1000000000000000000n),
                    scalingFactor: String(poolTokenRates ? poolTokenRates[0][i] : 1000000000000000000n),
                });
            }

            return {
                poolToken,
                pool: {
                    typeData: { reserveTokenVirtualBalance, isSeedless: Number(reserveTokenVirtualBalance) > 0 },
                },
            };
        },
    },
    {
        address: vaultAddress as `0x${string}`,
        abi: VaultV3Abi,
        functionName: 'getPoolTokenRates',
        args: [poolAddress as `0x${string}`],
    },
];
