import { SwapKind, Token } from '@balancer/sdk';

import { PrismaPoolWithDynamic } from '@/prisma/prisma-types';

import { PathWithAmount } from './path';
import { BasePool } from './pools/types';
import {
    ComposableStablePool,
    FxPool,
    Gyro2Pool,
    Gyro3Pool,
    GyroEPool,
    WeightedPool,
    MetaStablePool,
} from './pools/v2';
import { StablePool, WeightedPoolV3 } from './pools/v3';
import { Router } from './router';
import { SorSwapOptions } from './types';
import { checkInputs } from './utils/helpers';

export async function sorGetSwapsWithPools(
    tokenIn: Token,
    tokenOut: Token,
    swapKind: SwapKind,
    swapAmountEvm: bigint,
    prismaPools: PrismaPoolWithDynamic[],
    swapOptions?: Omit<SorSwapOptions, 'graphTraversalConfig.poolIdsToInclude'>,
): Promise<PathWithAmount[] | null> {
    const checkedSwapAmount = checkInputs(tokenIn, tokenOut, swapKind, swapAmountEvm);

    const basePools: BasePool[] = [];

    for (const prismaPool of prismaPools) {
        switch (prismaPool.type) {
            case 'WEIGHTED':
                {
                    if (prismaPool.protocolVersion === 2) {
                        basePools.push(WeightedPool.fromPrismaPool(prismaPool));
                    } else {
                        basePools.push(WeightedPoolV3.fromPrismaPool(prismaPool));
                    }
                }
                break;
            case 'COMPOSABLE_STABLE':
            case 'PHANTOM_STABLE':
                {
                    if (prismaPool.protocolVersion === 2) {
                        basePools.push(ComposableStablePool.fromPrismaPool(prismaPool));
                    } else {
                        basePools.push(StablePool.fromPrismaPool(prismaPool));
                    }
                }
                break;
            case 'META_STABLE':
                basePools.push(MetaStablePool.fromPrismaPool(prismaPool));
                break;
            case 'FX':
                basePools.push(FxPool.fromPrismaPool(prismaPool));
                break;
            case 'GYRO':
                basePools.push(Gyro2Pool.fromPrismaPool(prismaPool));
                break;
            case 'GYRO3':
                basePools.push(Gyro3Pool.fromPrismaPool(prismaPool));
                break;
            case 'GYROE':
                basePools.push(GyroEPool.fromPrismaPool(prismaPool));
                break;
            default:
                console.log('Unsupported pool type');
                break;
        }
    }

    const router = new Router();

    const candidatePaths = router.getCandidatePaths(tokenIn, tokenOut, basePools, swapOptions?.graphTraversalConfig);

    if (candidatePaths.length === 0) return null;

    const bestPaths = router.getBestPaths(candidatePaths, swapKind, checkedSwapAmount);

    if (!bestPaths) return null;

    return bestPaths;
}
