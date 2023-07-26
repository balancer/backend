import { PrismaPoolDynamicData, PrismaPoolType } from '@prisma/client';
import { isSameAddress } from '@balancer-labs/sdk';
import { networkContext } from '../../network/network-context.service';
import { prisma } from '../../../prisma/prisma-client';

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
    return !pool.dynamicData?.isInRecoveryMode && capturesYield(pool);
}

export function capturesYield(pool: PoolWithTypeAndFactory) {
    return isWeightedPoolV2(pool) || isComposableStablePool(pool) || pool.type === 'META_STABLE' || isGyroEV2(pool);
}

export function isGyroEV2(pool: PoolWithTypeAndFactory) {
    return pool.type === 'GYROE' && pool.version === 2;
}
