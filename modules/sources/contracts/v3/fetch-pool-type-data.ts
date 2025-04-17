import { ViemClient } from '../../types';
import {
    stableContractCalls,
    quantAmmWeightedCalls,
    PoolTypeData,
    lbpCalls,
    reclammCalls,
} from '../pool-type-dynamic-data';
import { multicallViem, ViemMulticallCall } from '../../../web3/multicaller-viem';
import { PrismaPoolType } from '@prisma/client';

export const poolTypeCalls = (pool: { id: string; type: PrismaPoolType }) => {
    switch (pool.type) {
        case PrismaPoolType.STABLE:
            return stableContractCalls(pool.id);
        case PrismaPoolType.LIQUIDITY_BOOTSTRAPPING:
            return lbpCalls(pool.id);
        case PrismaPoolType.QUANT_AMM_WEIGHTED:
            return quantAmmWeightedCalls(pool.id);
        case PrismaPoolType.RECLAMM:
            return reclammCalls(pool.id);
        default:
            return [];
    }
};

export const fetchPoolTypeData = async (
    client: ViemClient,
    pools: {
        id: string;
        type: PrismaPoolType;
    }[],
    blockNumber?: bigint,
): Promise<{ [address: string]: PoolTypeData }> => {
    const calls = pools.flatMap(poolTypeCalls).filter((x): x is ViemMulticallCall => !!x);

    const data = await multicallViem(client, calls, blockNumber);

    return data as { [address: string]: PoolTypeData };
};
