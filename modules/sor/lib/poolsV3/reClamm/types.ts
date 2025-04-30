export type ReClammParams = {
    lastTimestamp: bigint;
    lastVirtualBalances: bigint[];
    dailyPriceShiftBase: bigint;
    centerednessMargin: bigint;
    startFourthRootPriceRatio: bigint;
    endFourthRootPriceRatio: bigint;
    priceRatioUpdateStartTime: bigint;
    priceRatioUpdateEndTime: bigint;
    currentTimestamp: bigint;
};
