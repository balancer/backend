import { Prisma, PrismaPoolType } from '@prisma/client';

export function isStablePool(poolType: PrismaPoolType) {
    return poolType === 'STABLE' || poolType === 'META_STABLE' || poolType === 'PHANTOM_STABLE';
}
