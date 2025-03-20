import { poolDataCalls } from './fetch-pool-data';
import { poolTypeCalls } from './fetch-pool-type-data';
import { hookDataCalls } from './fetch-hook-data';
import { ViemClient } from '../../types';
import { multicallViem, ViemMulticallCall } from '../../../web3/multicaller-viem';
import { PrismaPoolType } from '@prisma/client';
import { PoolTypeData } from '../pool-type-dynamic-data';
import { HookData } from '../../../../prisma/prisma-types';

export interface PoolSyncDataV3 {
    poolDynamicData: {
        totalShares: string;
        totalSharesNum: number;
        swapFee: string;
        aggregateSwapFee?: string;
        aggregateYieldFee?: string;
        isPaused: boolean;
        isInRecoveryMode: boolean;
        blockNumber: number;
    };
    poolToken: {
        id: string;
        index: number;
        address: string;
        balance: string;
        priceRateProvider: string;
        priceRate: string;
        scalingFactor: string;
        exemptFromProtocolYieldFee: boolean;
    }[];
    pool: {
        typeData?: PoolTypeData['typeData'];
        hook?: {
            dynamicData: any;
        };
    };
}

export const fetchPoolSyncData = async (
    client: ViemClient,
    vault: string,
    pools: {
        id: string;
        type: PrismaPoolType;
        hook?: HookData;
    }[],
    blockNumber: bigint,
): Promise<{ [address: string]: PoolSyncDataV3 }> => {
    let calls: ViemMulticallCall[] = [];
    for (const pool of pools) {
        const poolCalls = poolDataCalls(pool.id, vault, blockNumber);
        const typeCalls = poolTypeCalls(pool);
        const hookCalls = hookDataCalls(pool);
        calls = [...calls, ...poolCalls, ...typeCalls, ...hookCalls];
    }

    const data = await multicallViem<{ [address: string]: PoolSyncDataV3 }>(client, calls, blockNumber);

    return data;
};
