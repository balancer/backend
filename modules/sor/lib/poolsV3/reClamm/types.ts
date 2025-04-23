export type ReClammParams = {
    lastTimestamp: bigint;
    lastVirtualBalances: bigint[];
    priceShiftRatePerSecond: bigint;
    centerednessMargin: bigint;
    startFourthRootPriceRatio: bigint;
    endFourthRootPriceRatio: bigint;
    priceRatioUpdateStartTime: bigint;
    priceRatioUpdateEndTime: bigint;
    currentTimestamp: bigint;
};
