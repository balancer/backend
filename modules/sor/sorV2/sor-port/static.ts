import { parseUnits } from 'ethers/lib/utils';
import { GqlCowSwapApiResponse, GqlSorGetSwapsResponse, GqlSorSwapRoute } from '../../../../schema';
import { Router } from './router';
import { Token } from './token';
import { BasePool, SwapKind, SwapOptions, zeroResponse } from './types';
import { PrismaPoolWithDynamic } from '../../../../prisma/prisma-types';
import { checkInputs } from './utils/helpers';
import { FxPool } from './pools/fx';
import { Gyro2Pool } from './pools/gyro2';
import { Gyro3Pool } from './pools/gyro3';
import { GyroEPool } from './pools/gyroE';
import { WeightedPool } from './pools/weighted/weightedPool';
import { Swap } from './swap';
import { StablePool } from './pools/stable/stablePool';
import { MetaStablePool } from './pools/metastable/metastablePool';

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
): Promise<Swap | null> {
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

    if (candidatePaths.length === 0) return null;

    const bestPaths = router.getBestPaths(candidatePaths, swapKind, checkedSwapAmount);

    if (!bestPaths) return null;

    // TODO build response from best paths
    return new Swap({ paths: bestPaths, swapKind });
    // return zeroResponse('EXACT_IN', tokenIn.address, tokenOut.address, checkedSwapAmount);
}

export function mapToSorSwapsResponse(swap: Swap): GqlSorGetSwapsResponse {
    return zeroResponse(
        swap.swapKind === SwapKind.GivenIn ? 'EXACT_IN' : 'EXACT_OUT',
        swap.inputAmount.token.address,
        swap.outputAmount.token.address,
        swap.inputAmount.amount.toString(),
    );
}

export function mapToCowSwapResponse(swap: Swap): GqlCowSwapApiResponse {
    return zeroResponse(
        swap.swapKind === SwapKind.GivenIn ? 'EXACT_IN' : 'EXACT_OUT',
        swap.inputAmount.token.address,
        swap.outputAmount.token.address,
        swap.inputAmount.amount.toString(),
    );
}
