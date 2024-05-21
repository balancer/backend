import { Router } from './router';
import { PrismaPoolWithDynamic } from '../../../../prisma/prisma-types';
import { checkInputs } from './utils/helpers';
import { WeightedPool } from './pools/weighted/weightedPool';
import { MetaStablePool } from './pools/metastable/metastablePool';
import { FxPool } from './pools/fx/fxPool';
import { Gyro2Pool } from './pools/gyro2/gyro2Pool';
import { Gyro3Pool } from './pools/gyro3/gyro3Pool';
import { GyroEPool } from './pools/gyroE/gyroEPool';
import { SwapKind, Token } from '@balancer/sdk';
import { ComposableStablePool } from './pools/composableStable/composableStablePool';
import { BasePool } from './pools/basePool';
import { SorSwapOptions } from './types';
import { PathWithAmount } from './path';
import { StablePool } from './pools/stable/stablePool';

export async function sorGetSwapsWithPools(
    tokenIn: Token,
    tokenOut: Token,
    swapKind: SwapKind,
    swapAmountEvm: bigint,
    prismaPools: PrismaPoolWithDynamic[],
    vaultVersion: number,
    swapOptions?: Omit<SorSwapOptions, 'graphTraversalConfig.poolIdsToInclude'>,
): Promise<PathWithAmount[] | null> {
    const checkedSwapAmount = checkInputs(tokenIn, tokenOut, swapKind, swapAmountEvm);

    const basePools: BasePool[] = [];

    for (const prismaPool of prismaPools) {
        switch (prismaPool.type) {
            case 'WEIGHTED':
                basePools.push(WeightedPool.fromPrismaPool(prismaPool));
                break;
            case 'COMPOSABLE_STABLE':
            case 'PHANTOM_STABLE':
                basePools.push(ComposableStablePool.fromPrismaPool(prismaPool));
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
