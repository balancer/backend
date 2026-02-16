import abi from '../abis/fixed-lb-pool';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';

type DynamicData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof abi, 'getFixedPriceLBPoolDynamicData'>['outputs']
>[0];

export type FixedPriceLBPCallsOutput = {
    poolDynamicData: {
        id: string;
        swapEnabled: boolean;
    };
};

export const fixedLbpCalls = (poolAddress: string): ViemMulticallCall[] => [
    {
        path: `${poolAddress}`,
        address: poolAddress as `0x${string}`,
        abi,
        functionName: 'getFixedPriceLBPoolDynamicData',
        parser: (result: DynamicData) => {
            const poolDynamicData = {
                id: poolAddress,
                swapEnabled: result.isSwapEnabled,
            };

            return { poolDynamicData };
        },
    },
];
