import { parseUnits } from 'ethers/lib/utils';
import { GqlSorGetSwapsResponse, GqlSorSwapRoute } from '../../../../schema';
import { Router } from './router';
import { Token } from './token';
import { BasePool, SwapKind, SwapOptions, zeroResponse } from './types';
import { PrismaPoolWithDynamic } from '../../../../prisma/prisma-types';
import { checkInputs } from './utils/helpers';
import { StablePool, StablePoolFactory } from './pools/stable';
import { MetaStablePool, MetaStablePoolFactory } from './pools/metastable';
import { FxPool } from './pools/fx';
import { Gyro2Pool } from './pools/gyro2';
import { Gyro3Pool } from './pools/gyro3';
import { GyroEPool } from './pools/gyroE';
import { WeightedPool } from './pools/weightedPool';

function sorParsePrismaPool(prismaPools: PrismaPoolWithDynamic[]): BasePool[] {
    const pools: BasePool[] = [];

    for (const prismaPool of prismaPools) {
        switch (prismaPool.type) {
            case 'WEIGHTED':
                pools.push(WeightedPool.fromPrismaPool(prismaPool));
                break;
            case 'COMPOSABLE_STABLE':
            case 'STABLE':
            case 'PHANTOM_STABLE':
                break;
            case 'META_STABLE':
                break;
            case 'FX':
                break;
            case 'GYRO':
                break;
            case 'GYRO3':
                break;
            case 'GYROE':
                break;
            default:
                console.log('Unsupported pool type');
                break;
        }
    }

    return pools;
}

export async function sorGetSwapsWithPools(
    tokenIn: Token,
    tokenOut: Token,
    swapKind: SwapKind,
    swapAmountEvm: bigint,
    prismaPools: PrismaPoolWithDynamic[],
    swapOptions?: Omit<SwapOptions, 'graphTraversalConfig.poolIdsToInclude'>,
): Promise<GqlSorGetSwapsResponse> {
    const checkedSwapAmount = checkInputs(tokenIn, tokenOut, swapKind, swapAmountEvm);

    const basePools: BasePool[] = [];

    for (const prismaPool of prismaPools) {
        switch (prismaPool.type) {
            case 'WEIGHTED':
                basePools.push(WeightedPool.fromPrismaPool(prismaPool));
                break;
            case 'COMPOSABLE_STABLE':
            case 'STABLE':
            case 'PHANTOM_STABLE':
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
    const swapToken = SwapKind.GivenIn ? tokenIn : tokenOut;

    const candidatePaths = router.getCandidatePaths(tokenIn, tokenOut, basePools, swapOptions?.graphTraversalConfig);

    if (candidatePaths.length === 0)
        return zeroResponse('EXACT_IN', tokenIn.address, tokenOut.address, checkedSwapAmount.amount);

    const bestPaths = router.getBestPaths(candidatePaths, swapKind, checkedSwapAmount, swapToken);

    if (!bestPaths) return zeroResponse('EXACT_IN', tokenIn.address, tokenOut.address, checkedSwapAmount.amount);

    // TODO build response from best paths
    // return new Swap({ paths: bestPaths, swapKind });
    return zeroResponse('EXACT_IN', tokenIn.address, tokenOut.address, checkedSwapAmount);
}
