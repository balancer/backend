import { VaultPoolFragment } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { TypePoolFragment } from '../../sources/subgraphs/balancer-v3-pools/generated/types';

export type Reclamm = ReturnType<typeof reclamm>;

export const reclamm = (pool: TypePoolFragment & VaultPoolFragment) => {
    const params = pool.reClammParams!;

    return {
        lastTimestamp: Number(params.lastTimestamp) || 0,
        lastVirtualBalances: params.lastVirtualBalances || [],
        dailyPriceShiftBase: params.dailyPriceShiftBase || '',
        centerednessMargin: params.centerednessMargin || '',
        currentFourthRootPriceRatio: params.currentFourthRootPriceRatio || '',
        startFourthRootPriceRatio: params.startFourthRootPriceRatio || '',
        endFourthRootPriceRatio: params.endFourthRootPriceRatio || '',
        priceRatioUpdateStartTime: Number(params.priceRatioUpdateStartTime) || 0,
        priceRatioUpdateEndTime: Number(params.priceRatioUpdateEndTime) || 0,
    };
};
