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
            firstFourWeightsAndMultipliers: string[];
            secondFourWeightsAndMultipliers: string[];
        };
    };
};

/**
 * Extracts weights and multipliers from two arrays of string values
 *
 * This function processes Quant AMM Weighted Pool data to extract token weights and multipliers.
 * The function handles differently based on if the pool has more than 4 tokens or not.
 *
 * For each input array, the first half contains the weights and the second half contains the multipliers.
 * Each returned item is an array pair of [weights, multipliers], where both weights and multipliers are arrays.
 *
 * @param tokensLength - The number of tokens in the pool
 * @param firstFourWeightsAndMultipliers - First array containing weights and multipliers (for tokens 1-4)
 * @param secondFourWeightsAndMultipliers - Second array containing weights and multipliers (for tokens 5-8 if any)
 * @returns An array of two pairs, where each pair is [weights, multipliers]
 */
export const extractWeightsAndMultipliers = (
    tokensLength: number,
    firstFourWeightsAndMultipliers: string[],
    secondFourWeightsAndMultipliers: string[],
) => {
    if (tokensLength > 4) {
        // For pools with more than 4 tokens:
        return [
            // First pair: Use first 4 elements as weights and next 4 as multipliers from firstFourWeightsAndMultipliers
            [firstFourWeightsAndMultipliers.slice(0, 4), firstFourWeightsAndMultipliers.slice(4, 8)],
            // Second pair:
            // - Take (tokensLength - 4) elements as weights from secondFourWeightsAndMultipliers and pad with zeros
            // - Take remaining needed multipliers from secondFourWeightsAndMultipliers starting at the index matching tokensLength - 4
            [
                secondFourWeightsAndMultipliers
                    .slice(0, tokensLength - 4)
                    .concat(Array(4 - (tokensLength - 4)).fill('0')),
                secondFourWeightsAndMultipliers.slice(tokensLength - 4, tokensLength),
            ],
        ];
    } else {
        // For pools with 4 or fewer tokens:
        return [
            // First pair:
            // - Take tokensLength elements as weights and pad with zeros
            // - Take tokensLength elements starting from index tokensLength as multipliers and pad with zeros
            [
                firstFourWeightsAndMultipliers.slice(0, tokensLength).concat(Array(4 - tokensLength).fill('0')),
                firstFourWeightsAndMultipliers
                    .slice(tokensLength, tokensLength * 2)
                    .concat(Array(4 - tokensLength).fill('0')),
            ],
            // Second pair (handled the same way):
            [
                secondFourWeightsAndMultipliers.slice(0, tokensLength).concat(Array(4 - tokensLength).fill('0')),
                secondFourWeightsAndMultipliers
                    .slice(tokensLength, tokensLength * 2)
                    .concat(Array(4 - tokensLength).fill('0')),
            ],
        ];
    }
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
            const firstFourWeightsAndMultipliers = result.firstFourWeightsAndMultipliers.map(String);
            const secondFourWeightsAndMultipliers = result.secondFourWeightsAndMultipliers.map(String);
            const lastUpdateIntervalTime = Number(result.lastUpdateTime);
            const lastInterpolationTimePossible = Number(result.lastInteropTime);

            const immutableData = results[index - 2].result as QuantAMMWeightedPoolImmutableData;
            const tokensLength = immutableData.tokens.length;

            const [[weightsA, multipliersA], [weightsB, multipliersB]] = extractWeightsAndMultipliers(
                tokensLength,
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
            );

            const weightsAtLastUpdateInterval = [...weightsA, ...weightsB];
            const weightBlockMultipliers = [...multipliersA, ...multipliersB].map(String);

            return {
                weightsAtLastUpdateInterval,
                weightBlockMultipliers,
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
                lastUpdateIntervalTime,
                lastInterpolationTimePossible,
            };
        },
    },
];
