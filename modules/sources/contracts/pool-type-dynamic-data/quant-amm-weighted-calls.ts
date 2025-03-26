import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import quantAmmWeighted from '../abis/quant-amm-weighted';
import { formatEther } from 'viem';

type QuantAMMWeightedPoolDynamicData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof quantAmmWeighted, 'getQuantAMMWeightedPoolDynamicData'>['outputs']
>[0];

type QuantAMMWeightedPoolImmutableData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof quantAmmWeighted, 'getQuantAMMWeightedPoolImmutableData'>['outputs']
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
        functionName: 'getQuantAMMWeightedPoolDynamicData',
        parser: (result: QuantAMMWeightedPoolDynamicData, results: any, index: number) => {
            const immutableData = results[index - 1].result as QuantAMMWeightedPoolImmutableData;
            const tokens = immutableData.tokens;

            const [[weightsA, multipliersA], [weightsB, multipliersB]] = [
                result.firstFourWeightsAndMultipliers,
                result.secondFourWeightsAndMultipliers,
            ].map((arr) => [arr.slice(0, 4), arr.slice(4)]);

            const weightsAtLastUpdateInterval = [...weightsA, ...weightsB];
            const weightBlockMultipliers = [...multipliersA, ...multipliersB].map(Number);
            const lastUpdateIntervalTime = Number(result.lastUpdateTime);
            const lastInterpolationTimePossible = Number(result.lastInteropTime);

            return {
                pool: {
                    typeData: {
                        weightsAtLastUpdateInterval: weightsAtLastUpdateInterval.map(Number),
                        weightBlockMultipliers,
                        lastUpdateIntervalTime,
                        lastInterpolationTimePossible,
                    },
                },
                poolToken: tokens.map((token, index) => ({
                    id: `${id}-${token}`.toLowerCase(),
                    weight: formatEther(weightsAtLastUpdateInterval[index]),
                })),
            };
        },
    },
];
