import { Chain, PrismaPoolStakingType } from '@prisma/client';
import { PrismaPoolWithTokens } from '../../prisma/prisma-types';

export interface PoolAprService {
    updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void>;
    getAprServiceName(): string;
}

export interface PoolStakingService {
    syncStakingForPools(chain: Chain): Promise<void>;
    deleteStakingForAllPools(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void>;
}
