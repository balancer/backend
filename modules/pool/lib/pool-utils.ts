import { PrismaPoolType } from '@prisma/client';
import { networkConfig } from '../../config/network-config';
import { isSameAddress } from '@balancer-labs/sdk';

type PoolWithTypeAndFactory = {
    address: string;
    type: PrismaPoolType;
    factory?: string | null;
};

export function isStablePool(poolType: PrismaPoolType) {
    return poolType === 'STABLE' || poolType === 'META_STABLE' || poolType === 'PHANTOM_STABLE';
}

export function isWeightedPoolV2(pool: PoolWithTypeAndFactory) {
    return (
        pool.type === 'WEIGHTED' &&
        networkConfig.balancer.weightedPoolV2Factories.find((factory) => isSameAddress(pool.factory || '', factory)) !==
            undefined
    );
}

export function isComposableStablePool(pool: PoolWithTypeAndFactory) {
    return (
        pool.type === 'PHANTOM_STABLE' &&
        networkConfig.balancer.composableStablePoolFactories.find((factory) =>
            isSameAddress(pool.factory || '', factory),
        ) !== undefined
    );
}

export function collectsYieldFee(pool: PoolWithTypeAndFactory) {
    return (
        !networkConfig.balancer.poolsInRecoveryMode.includes(pool.address) &&
        (isWeightedPoolV2(pool) || isComposableStablePool(pool) || pool.type === 'META_STABLE')
    );
}

export function collectsSwapFee(pool: PoolWithTypeAndFactory) {
    return (
        !networkConfig.balancer.poolsInRecoveryMode.includes(pool.address) && pool.type !== 'LIQUIDITY_BOOTSTRAPPING'
    );
}
