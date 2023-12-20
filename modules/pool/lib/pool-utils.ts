import { PrismaPoolDynamicData, PrismaPoolType } from '@prisma/client';

type PoolWithTypeAndFactory = {
    address: string;
    type: PrismaPoolType;
    factory?: string | null;
    dynamicData?: PrismaPoolDynamicData | null;
    version: number;
};

export function isStablePool(poolType: PrismaPoolType) {
    return poolType === 'STABLE' || poolType === 'META_STABLE' || poolType === 'PHANTOM_STABLE';
}

export function isWeightedPoolV2(pool: PoolWithTypeAndFactory) {
    return pool.type === 'WEIGHTED' && pool.version >= 2;
}

export function isComposableStablePool(pool: PoolWithTypeAndFactory) {
    return pool.type === 'COMPOSABLE_STABLE' && pool.version > 0;
}

export function collectsYieldFee(pool: PoolWithTypeAndFactory) {
    return !pool.dynamicData?.isInRecoveryMode && capturesYield(pool);
}

export function capturesYield(pool: PoolWithTypeAndFactory) {
    return isWeightedPoolV2(pool) || isComposableStablePool(pool) || pool.type === 'META_STABLE' || isGyroEV2(pool);
}

export function isGyroPool(pool: PoolWithTypeAndFactory) {
    return pool.type.includes('GYRO');
}

export function isGyroEV2(pool: PoolWithTypeAndFactory) {
    return pool.type === 'GYROE' && pool.version === 2;
}
