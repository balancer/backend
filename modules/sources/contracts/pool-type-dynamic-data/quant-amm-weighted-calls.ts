import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import quantAmmWeighted from '../abis/quant-amm-weighted';
import { formatEther } from 'viem';

type QuantAMMWeightedPoolImmutableData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof quantAmmWeighted, 'getQuantAMMWeightedPoolImmutableData'>['outputs']
>[0];

type QuantAMMWeightedPoolDynamicData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof quantAmmWeighted, 'getQuantAMMWeightedPoolDynamicData'>['outputs']
>[0];

type QuantAMMWeightedPoolNormalisedWeights = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof quantAmmWeighted, 'getNormalizedWeights'>['outputs']
>[0];

export type QuantAMMWeightedCallsOutput = {
    poolToken: {
        id: string;
        weight: string;
    }[];
    pool: {
        typeData: {
            weightsAtLastUpdateInterval: string[];
            weightBlockMultipliers: string[];
            lastUpdateIntervalTime: number;
            lastInterpolationTimePossible: number;
        };
    };
};

export const quantAmmWeightedCalls = (id: string): ViemMulticallCall[] => [
    {
        address: id as `0x${string}`,
        abi: quantAmmWeighted,
        functionName: 'getQuantAMMWeightedPoolImmutableData',
    },
    {
        path: `${id}.poolToken`,
        address: id as `0x${string}`,
        abi: quantAmmWeighted,
        functionName: 'getNormalizedWeights',
        parser: (weights: QuantAMMWeightedPoolNormalisedWeights, results: any, index: number) => {
            const immutableData = results[index - 1].result as QuantAMMWeightedPoolImmutableData;
            const tokens = immutableData.tokens;

            return tokens.map((token, index) => ({
                id: `${id}-${token}`.toLowerCase(),
                weight: formatEther(weights[index]),
            }));
        },
    },
    {
        path: `${id}.pool.typeData`,
        address: id as `0x${string}`,
        abi: quantAmmWeighted,
        functionName: 'getQuantAMMWeightedPoolDynamicData',
        parser: (result: QuantAMMWeightedPoolDynamicData, results: any, index: number) => {
            const firstFourWeightsAndMultipliers = result.firstFourWeightsAndMultipliers.map(Number);
            const secondFourWeightsAndMultipliers = result.secondFourWeightsAndMultipliers.map(Number);
            const lastUpdateIntervalTime = Number(result.lastUpdateTime);
            const lastInterpolationTimePossible = Number(result.lastInteropTime);

            return {
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
                lastUpdateIntervalTime,
                lastInterpolationTimePossible,
            };
        },
    },
];
