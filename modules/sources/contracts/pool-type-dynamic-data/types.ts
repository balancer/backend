export type PoolTypeData = {
    typeData: StableTypeData | SeedlessLBPTypeData;
};

export type StableTypeData = {
    amp: string;
    bptPriceRate: string;
};

export type SeedlessLBPTypeData = {
    virtualReserveTokenBalance: string;
};
