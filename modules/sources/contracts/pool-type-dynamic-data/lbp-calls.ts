import abi from '../abis/lb-pool';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { formatEther } from 'viem';

type ImmutableData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof abi, 'getLBPoolImmutableData'>['outputs']
>[0];

type DynamicData = AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof abi, 'getLBPoolDynamicData'>['outputs']>[0];

export type LBPCallsOutput = {
    poolToken: {
        id: string;
        weight: string;
    }[];
};

export const lbpCalls = (id: string): ViemMulticallCall[] => [
    {
        address: id as `0x${string}`,
        abi,
        functionName: 'getLBPoolImmutableData',
    },
    {
        path: `${id}.poolToken`,
        address: id as `0x${string}`,
        abi,
        functionName: 'getLBPoolDynamicData',
        parser: (result: DynamicData, results: any, index: number) => {
            const immutableData = results[index - 1].result as ImmutableData;
            const tokens = immutableData.tokens;

            return tokens.map((token, index) => ({
                id: `${id}-${token}`.toLowerCase(),
                weight: formatEther(result.normalizedWeights[index]),
            }));
        },
    },
];
