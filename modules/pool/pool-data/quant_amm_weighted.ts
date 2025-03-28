import { SepoliaTypePoolFragment } from '../../sources/subgraphs/balancer-v3-pools/generated/types';

export const quantAmmWeighted = (pool: SepoliaTypePoolFragment) => {
    if (!pool.quantAMMWeightedParams) {
        return {} as any;
    }

    const params = pool.quantAMMWeightedParams;

    // Return just the fields that are dynamic and are updated in the RPC call
    return {
        weightsAtLastUpdateInterval: params.weightsAtLastUpdateInterval || [],
        weightBlockMultipliers: params.weightBlockMultipliers || [],
        lastUpdateIntervalTime: params.lastUpdateIntervalTime || '',
        lastInterpolationTimePossible: params.lastInterpolationTimePossible || '',
    };

    // return {
    //     oracleStalenessThreshold: params.oracleStalenessThreshold || '',
    //     poolRegistry: params.poolRegistry || '',
    //     lambda: params.lambda || [],
    //     epsilonMax: params.epsilonMax || '',
    //     absoluteWeightGuardRail: params.absoluteWeightGuardRail || '',
    //     maxTradeSizeRatio: params.maxTradeSizeRatio || '',
    //     updateInterval: params.updateInterval || '',
    //     weightsAtLastUpdateInterval: params.weightsAtLastUpdateInterval || [],
    //     weightBlockMultipliers: params.weightBlockMultipliers || [],
    //     lastUpdateIntervalTime: params.lastUpdateIntervalTime || '',
    //     lastInterpolationTimePossible: params.lastInterpolationTimePossible || '',
    //     details: params.details || [],
    // };
};
