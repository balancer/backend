import {
    stableContractCalls,
    quantAmmWeightedCalls,
    lbpCalls,
    reclammCalls,
    fixedLbpCalls,
} from '../pool-type-dynamic-data';
import { PrismaPoolType } from '@prisma/client';
import { lbpCallsV3 } from '../pool-type-dynamic-data/lbp-calls-v3';

export const poolTypeCalls = (pool: { id: string; type: PrismaPoolType; version: number }, vault: string) => {
    switch (pool.type) {
        case PrismaPoolType.STABLE:
            return stableContractCalls(pool.id);
        case PrismaPoolType.LIQUIDITY_BOOTSTRAPPING:
            if (pool.version === 1 || pool.version === 2) {
                return lbpCalls(pool.id);
            } else {
                return lbpCallsV3(pool.id, vault);
            }
        case PrismaPoolType.FIXED_LBP:
            return fixedLbpCalls(pool.id);
        case PrismaPoolType.QUANT_AMM_WEIGHTED:
            return quantAmmWeightedCalls(pool.id);
        case PrismaPoolType.RECLAMM:
            return reclammCalls(pool.id);
        default:
            return [];
    }
};
