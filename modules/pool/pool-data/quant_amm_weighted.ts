import { TypePoolFragment } from '../../sources/subgraphs/balancer-v3-pools/generated/types';

export const quant_amm_weighted = (pool: TypePoolFragment) => {
    const params = pool.quantAMMWeightedParams!;

    return {
        oracleStalenessThreshold: params.oracleStalenessThreshold || '',
        poolRegistry: params.poolRegistry || '',
        lambda: params.lambda || [],
        epsilonMax: params.epsilonMax || '',
        absoluteWeightGuardRail: params.absoluteWeightGuardRail || '',
        maxTradeSizeRatio: params.maxTradeSizeRatio || '',
        updateInterval: params.updateInterval || '',
        weightsAtLastUpdateInterval: params.weightsAtLastUpdateInterval || [],
        weightBlockMultipliers: params.weightBlockMultipliers || [],
        lastUpdateIntervalTime: params.lastUpdateIntervalTime || '',
        lastInterpolationTimePossible: params.lastInterpolationTimePossible || '',
        details: params.details || [],
    };
};
