import { PrismaPoolWithExpandedNesting } from '../../prisma/prisma-types';

export interface PoolAprService {
    updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void>;
}
