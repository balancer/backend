import abi from '../abis/lb-pool';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { formatEther } from 'viem';

type ImmutableData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof abi, 'getLBPoolImmutableData'>['outputs']
>[0];

type DynamicData = AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof abi, 'getLBPoolDynamicData'>['outputs']>[0];

export type LBPCallsOutput = {
    poolDynamicData: {
        id: string;
        swapEnabled: boolean;
    };
    poolToken: {
        id: string;
        weight: string;
    }[];
};

export const lbpCalls = (poolAddress: string): ViemMulticallCall[] => [
    {
        address: poolAddress as `0x${string}`,
        abi,
        functionName: 'getLBPoolImmutableData',
    },
    {
        path: `${poolAddress}`,
        address: poolAddress as `0x${string}`,
        abi,
        functionName: 'getLBPoolDynamicData',
        parser: (result: DynamicData, results: any, index: number) => {
            const immutableData = results[index - 1].result as ImmutableData;
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
];
