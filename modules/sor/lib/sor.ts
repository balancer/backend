import { SwapKind, Token } from '@balancer/sdk';

import { Router } from './router';
import { SorAbortError } from '../errors';
import { PrismaPoolAndHookWithDynamic } from '../../../prisma/prisma-types';
import { checkInputs, isLiquidityManagement } from './utils/helpers';
import {
    ComposableStablePool,
    FxPool,
    Gyro2Pool,
    Gyro3Pool,
    GyroEPool,
    MetaStablePool,
    StablePool,
    WeightedPool,
} from './poolsV2';
import { BasePool } from './poolsV2/basePool';
import { SorSwapOptions } from './types';
import { PathWithAmount } from './path';
import {
    BufferPool,
    Gyro2CLPPool,
    GyroECLPPool,
    QuantAmmPool,
    ReClammPool,
    StablePoolV3,
    WeightedPoolV3,
} from './poolsV3';
import { LiquidityBootstrappingPoolV3 } from './poolsV3/liquidityBootstrapping/liquidityBootstrapping';
import { BufferPoolData } from '../utils/data';
import { FixedPriceLBPPoolV3 } from './poolsV3/fixedPriceLBP/fixedPriceLBP';

export class SOR {
    static async getPathsWithPools(
        tokenIn: Token,
        tokenOut: Token,
        swapKind: SwapKind,
        swapAmountEvm: bigint,
        prismaPools: PrismaPoolAndHookWithDynamic[],
        bufferPools: BufferPoolData[],
        protocolVersion: number,
        tokenPrices: Map<string, number>,
        swapOptions?: Omit<SorSwapOptions, 'graphTraversalConfig.poolIdsToInclude'>,
        signal?: AbortSignal,
    ): Promise<PathWithAmount[] | null> {
        // Check if already aborted
        if (signal?.aborted) {
            throw new SorAbortError();
        }

        const checkedSwapAmount = checkInputs(tokenIn, tokenOut, swapKind, swapAmountEvm);

        // get current block timestamp if not provided
        const currentTimestamp = swapOptions?.currentTimestamp ?? BigInt(Date.now()) / 1000n;

        const basePools: BasePool[] = [];

        for (const prismaPool of prismaPools) {
            // Check for abort periodically
            if (signal?.aborted) {
                throw new SorAbortError();
            }

            // typeguard
            if (prismaPool.protocolVersion === 3) {
                if (
                    !isLiquidityManagement(prismaPool.liquidityManagement) &&
                    prismaPool.type !== 'LIQUIDITY_BOOTSTRAPPING' &&
                    prismaPool.type !== 'FIXED_LBP'
                ) {
                    console.log('LiquidityManagement incorrect for pool', prismaPool.id);
                    continue;
                }
            }
            try {
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
                    case 'FIXED_LBP':
                        basePools.push(FixedPriceLBPPoolV3.fromPrismaPool(prismaPool, currentTimestamp));
                        break;
                    case 'LIQUIDITY_BOOTSTRAPPING': {
                        /// LBPs use weighted math
                        if (prismaPool.protocolVersion === 2) {
                            basePools.push(WeightedPool.fromPrismaPool(prismaPool));
                        } else {
                            basePools.push(LiquidityBootstrappingPoolV3.fromPrismaPool(prismaPool, currentTimestamp));
                        }
                        break;
                    }
                    case 'COMPOSABLE_STABLE':
                    case 'PHANTOM_STABLE':
                        basePools.push(ComposableStablePool.fromPrismaPool(prismaPool));
                        break;
                    case 'STABLE':
                        // Since we allowed all the pools, we started getting BAL#322 errors
                        // Enabling pools one by one until we find the issue
                        if (protocolVersion === 3) {
                            basePools.push(StablePoolV3.fromPrismaPool(prismaPool));
                        } else {
                            if (
                                [
                                    '0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249', // auraBal/8020
                                    '0x2d011adf89f0576c9b722c28269fcb5d50c2d17900020000000000000000024d', // sdBal/8020
                                    '0xff4ce5aaab5a627bf82f4a571ab1ce94aa365ea6000200000000000000000426', // dola/usdc
                                ].includes(prismaPool.id)
                            ) {
                                basePools.push(StablePool.fromPrismaPool(prismaPool));
                            }
                        }
                        break;
                    case 'META_STABLE':
                        basePools.push(MetaStablePool.fromPrismaPool(prismaPool));
                        break;
                    case 'FX':
                        const fxPool = FxPool.fromPrismaPool(prismaPool);
                        basePools.push(fxPool);
                        break;
                    case 'GYRO':
                        if (protocolVersion === 3) {
                            basePools.push(Gyro2CLPPool.fromPrismaPool(prismaPool));
                        } else {
                            basePools.push(Gyro2Pool.fromPrismaPool(prismaPool));
                        }
                        break;
                    case 'GYRO3':
                        basePools.push(Gyro3Pool.fromPrismaPool(prismaPool));
                        break;
                    case 'GYROE':
                        if (protocolVersion === 3) {
                            basePools.push(GyroECLPPool.fromPrismaPool(prismaPool));
                        } else {
                            basePools.push(GyroEPool.fromPrismaPool(prismaPool));
                        }
                        break;
                    case 'RECLAMM':
                        basePools.push(ReClammPool.fromPrismaPool(prismaPool, currentTimestamp));
                        break;
                    case 'QUANT_AMM_WEIGHTED':
                        basePools.push(QuantAmmPool.fromPrismaPool(prismaPool, currentTimestamp));
                        break;
                    default:
                        console.log('Unsupported pool type');
                        break;
                }
            } catch (e: any) {
                // Do nothing, just skip the pool
                console.error('Skipping pool', prismaPool.id, prismaPool.chain, e.message);
            }
        }

        if (protocolVersion === 3) {
            for (const bufferPool of bufferPools) {
                basePools.push(BufferPool.fromBufferPoolData(bufferPool));
            }
        }

        // Check for abort before starting router
        if (signal?.aborted) {
            throw new SorAbortError();
        }

        const router = new Router();

        const candidatePaths = router.getCandidatePaths(
            tokenIn,
            tokenOut,
            basePools,
            checkedSwapAmount,
            swapKind,
            protocolVersion === 3,
            tokenPrices,
            swapOptions?.graphTraversalConfig,
            signal,
        );

        if (candidatePaths.length === 0) return null;

        // Check for abort before getBestPaths
        if (signal?.aborted) {
            throw new SorAbortError();
        }

        const bestPaths = router.getBestPaths(candidatePaths, swapKind, checkedSwapAmount);

        if (!bestPaths) return null;

        return bestPaths;
    }
}
