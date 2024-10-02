import { Router } from './router';
import { PrismaPoolWithDynamic, PrismaHookWithDynamic } from '../../../../prisma/prisma-types';
import { checkInputs } from './utils/helpers';
import { ComposableStablePool, FxPool, Gyro2Pool, Gyro3Pool, GyroEPool, MetaStablePool, WeightedPool } from './poolsV2';
import { SwapKind, Token } from '@balancer/sdk';
import { BasePool } from './poolsV2/basePool';
import { SorSwapOptions } from './types';
import { PathWithAmount } from './path';
import { StablePool, WeightedPoolV3 } from './poolsV3';

export async function sorGetPathsWithPools(
    tokenIn: Token,
    tokenOut: Token,
    swapKind: SwapKind,
    swapAmountEvm: bigint,
    prismaPools: PrismaPoolWithDynamic[],
    protocolVersion: number,
    swapOptions?: Omit<SorSwapOptions, 'graphTraversalConfig.poolIdsToInclude'>,
): Promise<PathWithAmount[] | null> {
    const checkedSwapAmount = checkInputs(tokenIn, tokenOut, swapKind, swapAmountEvm);

    const basePools: BasePool[] = [];

    for (const prismaPool of prismaPools) {
        // TODO: Once more hooks infrastructure exists, allow pools with hooks to be considered for routing
        // for now they are discarded.
        // Discard pools with hooks
        if (prismaPool.hook !== null) {
            continue;
        }
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
                basePools.push(ComposableStablePool.fromPrismaPool(prismaPool));
                break;
            case 'STABLE':
                basePools.push(StablePool.fromPrismaPool(prismaPool));
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

    const candidatePaths = router.getCandidatePaths(
        tokenIn,
        tokenOut,
        basePools,
        protocolVersion === 3,
        swapOptions?.graphTraversalConfig,
    );

    if (candidatePaths.length === 0) return null;

    const bestPaths = router.getBestPaths(candidatePaths, swapKind, checkedSwapAmount);

    if (!bestPaths) return null;

    return bestPaths;
}
