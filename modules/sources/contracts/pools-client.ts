import { PrismaPoolType } from '@prisma/client';
import { ViemClient } from '../viem-client';
import { fetchPoolTypeData } from './fetch-pool-type-data';

export interface PoolsClient {
    fetchPoolTypeData: (
        pools: {
            id: string;
            type: PrismaPoolType;
        }[],
        blockNumber?: bigint,
    ) => Promise<{ id: string; typeData: any }[]>;
}

export const getPoolsClient = (viemClient: ViemClient): PoolsClient => {
    return {
        fetchPoolTypeData: async (
            pools: {
                id: string;
                type: PrismaPoolType;
            }[],
            blockNumber?: bigint,
        ) => fetchPoolTypeData(viemClient, pools, blockNumber),
    };
};
