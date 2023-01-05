import { PrismaPoolStakingType } from '@prisma/client';
import { PrismaPoolWithExpandedNesting } from '../../prisma/prisma-types';

export interface PoolAprService {
    updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void>;
    getAprServiceName(): string;
}

export interface PoolStakingService {
    syncStakingForPools(): Promise<void>;
    reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[]): Promise<void>;
}
