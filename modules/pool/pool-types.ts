import { PrismaPoolStakingType } from '@prisma/client';
import { PrismaPoolWithTokens } from '../../prisma/prisma-types';

export interface PoolAprService {
    updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void>;
    getAprServiceName(): string;
}

export interface PoolStakingService {
    syncStakingForPools(): Promise<void>;
    reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[]): Promise<void>;
}
