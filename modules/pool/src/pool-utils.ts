import { PrismaPoolType } from '@prisma/client';

export function poolIsStablePool(poolType: PrismaPoolType) {
    return poolType === 'STABLE' || poolType === 'META_STABLE' || poolType === 'PHANTOM_STABLE';
}
