export type QuantAmmWeightedParams = {
    firstFourWeightsAndMultipliers: bigint[];
    secondFourWeightsAndMultipliers: bigint[];
    lastUpdateTime: bigint;
    lastInteropTime: bigint;
    currentTimestamp: bigint;
    maxTradeSizeRatio: bigint;
};
