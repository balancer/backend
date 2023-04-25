import { PrismaPoolType } from '@prisma/client';
import { isSameAddress } from '@balancer-labs/sdk';
import { networkContext } from '../../network/network-context.service';

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
        networkContext.data.balancer.weightedPoolV2Factories.find((factory) =>
            isSameAddress(pool.factory || '', factory),
        ) !== undefined
    );
}

export function isComposableStablePool(pool: PoolWithTypeAndFactory) {
    return (
        pool.type === 'PHANTOM_STABLE' &&
        networkContext.data.balancer.composableStablePoolFactories.find((factory) =>
            isSameAddress(pool.factory || '', factory),
        ) !== undefined
    );
}

export function collectsYieldFee(pool: PoolWithTypeAndFactory) {
    return (
        !networkContext.data.balancer.poolsInRecoveryMode.includes(pool.address) &&
        (isWeightedPoolV2(pool) || isComposableStablePool(pool) || pool.type === 'META_STABLE')
    );
}

export function capturesYield(pool: PoolWithTypeAndFactory) {
    return isWeightedPoolV2(pool) || isComposableStablePool(pool) || pool.type === 'META_STABLE';
}

export function collectsFee(pool: PoolWithTypeAndFactory) {
    return (
        !networkContext.data.balancer.poolsInRecoveryMode.includes(pool.address) &&
        pool.type !== 'LIQUIDITY_BOOTSTRAPPING'
    );
}
