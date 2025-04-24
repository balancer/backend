import { BufferState, GyroECLPState, ReClammState, StableState, WeightedState } from '@balancer-labs/balancer-maths';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { HookData, PrismaPoolAndHookWithDynamic } from '../../../prisma/prisma-types';
import {
    mapGyroPoolStateToPrismaPool,
    mapReClammPoolStateToPrismaPool,
    mapStablePoolStateToPrismaPool,
    mapWeightedPoolStateToPrismaPool,
} from './mapping';
import { Address, isSameAddress } from '@balancer/sdk';

type PoolBase = {
    poolAddress: string;
    chainId: string;
    hook?: HookData;
};

export type WeightedPool = PoolBase & WeightedState;

export type StablePool = PoolBase & StableState;

export type BufferPool = PoolBase & BufferState;

export type GyroEPool = PoolBase & GyroECLPState;

export type ReClammPool = PoolBase & ReClammState;

export type SupportedPools = WeightedPool | StablePool | BufferPool | GyroEPool | ReClammPool;

type SwapPath = {
    swapKind: number;
    amountRaw: bigint;
    outputRaw: bigint;
    tokens: string[];
    pools: string[];
    test: string;
    currentTimestamp: bigint;
};

export type TestData = {
    swapPathPools: PrismaPoolAndHookWithDynamic[][];
    swapPaths: SwapPath[];
    underlyingTokens: { address: string; decimals: number }[][];
};

// Reads all json test files and parses to relevant swap/pool bigint format
export function readTestData(): TestData {
    const testData: TestData = {
        swapPathPools: [],
        swapPaths: [],
        underlyingTokens: [],
    };

    // Resolve the directory path relative to the current file's directory
    const absoluteDirectoryPath = path.resolve(__dirname);

    // Read all files in the directory
    const files = fs.readdirSync(absoluteDirectoryPath);

    // Iterate over each file
    for (const file of files) {
        // Check if the file ends with .json
        if (file.endsWith('.json')) {
            // Read the file content
            const fileContent = fs.readFileSync(path.join(absoluteDirectoryPath, file), 'utf-8');

            // Parse the JSON content
            try {
                const jsonData = JSON.parse(fileContent);

                // add underlying tokens
                const underlyingTokens = jsonData.underlyingTokens as { address: string; decimals: number }[];
                testData.underlyingTokens.push(underlyingTokens);

                // map pools to prisma pools
                const pools: PrismaPoolAndHookWithDynamic[] = mapPools(jsonData.pools, underlyingTokens);
                testData.swapPathPools.push(pools);

                const currentTimestamp = (jsonData.pools as { poolType: string; currentTimestamp?: bigint }[]).find(
                    (pool) => pool.poolType === 'RECLAMM',
                )?.currentTimestamp;

                // add swapPaths
                testData.swapPaths.push({
                    ...jsonData.swapPath,
                    pools: jsonData.swapPath.pools,
                    swapKind: Number(jsonData.swapPath.swapKind),
                    amountRaw: BigInt(jsonData.swapPath.amountRaw),
                    outputRaw: BigInt(jsonData.swapPath.outputRaw),
                    test: file,
                    currentTimestamp,
                });
            } catch (error) {
                console.error(`Error parsing JSON file ${file}:`, error);
            }
        }
    }

    return testData;
}

type TransformBigintToString<T> = {
    [K in keyof T]: T[K] extends bigint ? string : T[K] extends bigint[] ? string[] : T[K];
};

function mapPools(
    pools: TransformBigintToString<SupportedPools>[],
    underlyingTokens: { address: string; decimals: number }[],
): PrismaPoolAndHookWithDynamic[] {
    const bufferPools: (BufferPool & { underlyingTokenDecimals: number })[] = pools
        .filter((pool) => pool.poolType === 'Buffer')
        .map((pool) => ({
            ...pool,
            rate: BigInt(pool.rate),
            underlyingTokenDecimals:
                underlyingTokens.find((token) => isSameAddress(token.address as Address, pool.tokens[1] as Address))
                    ?.decimals || 0,
        }));

    const nonBufferPools = pools.filter((pool) => pool.poolType !== 'Buffer');

    const prismaPools: PrismaPoolAndHookWithDynamic[] = [];
    for (const pool of nonBufferPools) {
        if (pool.poolType === 'WEIGHTED') {
            const weightedPool = {
                ...pool,
                scalingFactors: pool.scalingFactors.map((sf) => BigInt(sf)),
                swapFee: BigInt(pool.swapFee),
                balancesLiveScaled18: pool.balancesLiveScaled18.map((b) => BigInt(b)),
                tokenRates: pool.tokenRates.map((r) => BigInt(r)),
                totalSupply: BigInt(pool.totalSupply),
                weights: (pool as TransformBigintToString<WeightedPool>).weights.map((w) => BigInt(w)),
                aggregateSwapFee: BigInt(pool.aggregateSwapFee ?? '0'),
                supportsUnbalancedLiquidity:
                    pool.supportsUnbalancedLiquidity === undefined ? true : pool.supportsUnbalancedLiquidity,
            };
            prismaPools.push(mapWeightedPoolStateToPrismaPool(weightedPool, Number(pool.chainId), 3, bufferPools));
        } else if (pool.poolType === 'STABLE') {
            const stablePool = {
                ...pool,
                scalingFactors: pool.scalingFactors.map((sf) => BigInt(sf)),
                swapFee: BigInt(pool.swapFee),
                balancesLiveScaled18: pool.balancesLiveScaled18.map((b) => BigInt(b)),
                tokenRates: pool.tokenRates.map((r) => BigInt(r)),
                totalSupply: BigInt(pool.totalSupply),
                amp: BigInt((pool as TransformBigintToString<StablePool>).amp),
                aggregateSwapFee: BigInt(pool.aggregateSwapFee ?? '0'),
                supportsUnbalancedLiquidity:
                    pool.supportsUnbalancedLiquidity === undefined ? true : pool.supportsUnbalancedLiquidity,
            };
            prismaPools.push(mapStablePoolStateToPrismaPool(stablePool, Number(pool.chainId), 3, bufferPools));
        } else if (pool.poolType === 'GYROE') {
            const gyroPool = {
                ...pool,
                scalingFactors: pool.scalingFactors.map((sf) => BigInt(sf)),
                swapFee: BigInt(pool.swapFee),
                balancesLiveScaled18: pool.balancesLiveScaled18.map((b) => BigInt(b)),
                tokenRates: pool.tokenRates.map((r) => BigInt(r)),
                totalSupply: BigInt(pool.totalSupply),
                aggregateSwapFee: BigInt(pool.aggregateSwapFee ?? '0'),
                supportsUnbalancedLiquidity:
                    pool.supportsUnbalancedLiquidity === undefined ? true : pool.supportsUnbalancedLiquidity,
                paramsAlpha: BigInt(pool.paramsAlpha),
                paramsBeta: BigInt(pool.paramsBeta),
                paramsC: BigInt(pool.paramsC),
                paramsS: BigInt(pool.paramsS),
                paramsLambda: BigInt(pool.paramsLambda),
                tauAlphaX: BigInt(pool.tauAlphaX),
                tauAlphaY: BigInt(pool.tauAlphaY),
                tauBetaX: BigInt(pool.tauBetaX),
                tauBetaY: BigInt(pool.tauBetaY),
                u: BigInt(pool.u),
                v: BigInt(pool.v),
                w: BigInt(pool.w),
                z: BigInt(pool.z),
                dSq: BigInt(pool.dSq),
            };
            prismaPools.push(mapGyroPoolStateToPrismaPool(gyroPool, Number(pool.chainId), 3, bufferPools));
        } else if (pool.poolType === 'RECLAMM') {
            const reClammPool = {
                ...pool,
                scalingFactors: pool.scalingFactors.map((sf) => BigInt(sf)),
                swapFee: BigInt(pool.swapFee),
                balancesLiveScaled18: pool.balancesLiveScaled18.map((b) => BigInt(b)),
                tokenRates: pool.tokenRates.map((r) => BigInt(r)),
                totalSupply: BigInt(pool.totalSupply),
                aggregateSwapFee: BigInt(pool.aggregateSwapFee ?? '0'),
                supportsUnbalancedLiquidity:
                    pool.supportsUnbalancedLiquidity === undefined ? true : pool.supportsUnbalancedLiquidity,
                lastTimestamp: BigInt(pool.lastTimestamp),
                lastVirtualBalances: pool.lastVirtualBalances.map((b) => BigInt(b)),
                priceShiftDailyRateInSeconds: BigInt(pool.priceShiftDailyRateInSeconds),
                centerednessMargin: BigInt(pool.centerednessMargin),
                startFourthRootPriceRatio: BigInt(pool.startFourthRootPriceRatio),
                endFourthRootPriceRatio: BigInt(pool.endFourthRootPriceRatio),
                priceRatioUpdateStartTime: BigInt(pool.priceRatioUpdateStartTime),
                priceRatioUpdateEndTime: BigInt(pool.priceRatioUpdateEndTime),
                currentTimestamp: BigInt(pool.currentTimestamp),
            };
            prismaPools.push(mapReClammPoolStateToPrismaPool(reClammPool, Number(pool.chainId), 3, bufferPools));
        }
    }
    return prismaPools;
}
