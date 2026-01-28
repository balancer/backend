import { ViemClient } from '../../types';
import {
    stableContractCalls,
    quantAmmWeightedCalls,
    PoolTypeData,
    lbpCalls,
    reclammCalls,
} from '../pool-type-dynamic-data';
import { PrismaPoolType } from '@prisma/client';

export const poolTypeCalls = (pool: { id: string; type: PrismaPoolType }, vault: string) => {
    switch (pool.type) {
        case PrismaPoolType.STABLE:
            return stableContractCalls(pool.id);
        case PrismaPoolType.LIQUIDITY_BOOTSTRAPPING:
            return lbpCalls(pool.id, vault);
        case PrismaPoolType.QUANT_AMM_WEIGHTED:
            return quantAmmWeightedCalls(pool.id);
        case PrismaPoolType.RECLAMM:
            return reclammCalls(pool.id);
        default:
            return [];
    }
};
