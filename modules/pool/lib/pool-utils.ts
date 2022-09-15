import { PrismaPoolType } from '@prisma/client';
import { networkConfig } from '../../config/network-config';
import { isSameAddress } from '@balancer-labs/sdk';

type PoolWithTypeAndFactory = {
    type: PrismaPoolType;
    factory?: string | null;
};

export function isStablePool(poolType: PrismaPoolType) {
    return poolType === 'STABLE' || poolType === 'META_STABLE' || poolType === 'PHANTOM_STABLE';
}

export function isWeightedPoolV2(pool: PoolWithTypeAndFactory): boolean {
    return pool.type === 'WEIGHTED' && isSameAddress(pool.factory || '', networkConfig.balancer.weightedPoolV2Factory);
}

export function isComposableStablePool(pool: PoolWithTypeAndFactory) {
    return (
        pool.type === 'PHANTOM_STABLE' &&
        isSameAddress(pool.factory || '', networkConfig.balancer.coposableStablePoolFactory)
    );
}
