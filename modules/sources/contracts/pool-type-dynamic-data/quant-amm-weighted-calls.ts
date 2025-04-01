import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import quantAmmWeighted from '../abis/quant-amm-weighted';
import { formatEther } from 'viem';

type QuantAMMWeightedPoolImmutableData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof quantAmmWeighted, 'getQuantAMMWeightedPoolImmutableData'>['outputs']
>[0];

type QuantAMMWeightedPoolNormalisedWeights = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof quantAmmWeighted, 'getNormalizedWeights'>['outputs']
>[0];

export const quantAmmWeightedCalls = (id: string): ViemMulticallCall[] => [
    {
        address: id as `0x${string}`,
        abi: quantAmmWeighted,
        functionName: 'getQuantAMMWeightedPoolImmutableData',
    },
    {
        path: `${id}`,
        address: id as `0x${string}`,
        abi: quantAmmWeighted,
        functionName: 'getNormalizedWeights',
        parser: (weights: QuantAMMWeightedPoolNormalisedWeights, results: any, index: number) => {
            const immutableData = results[index - 1].result as QuantAMMWeightedPoolImmutableData;
            const tokens = immutableData.tokens;

            return {
                poolToken: tokens.map((token, index) => ({
                    id: `${id}-${token}`.toLowerCase(),
                    weight: formatEther(weights[index]),
                })),
            };
        },
    },
];
