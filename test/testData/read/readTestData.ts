import {
    BufferState,
    GyroECLPState,
    QuantAmmState,
    ReClammState,
    StableState,
    WeightedState,
} from '@balancer-labs/balancer-maths';
import { Address } from '@balancer/sdk';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { HookData, PrismaPoolAndHookWithDynamic } from '../../../prisma/prisma-types';
import { BufferPoolData } from '../../../modules/sor/utils/data';
import { TransformBigintToString } from '../types';
import {
    mapGyroPoolStateToPrismaPool,
    mapQuantAmmPoolStateToPrismaPool,
    mapReClammPoolStateToPrismaPool,
    mapStablePoolStateToPrismaPool,
    mapWeightedPoolStateToPrismaPool,
} from './mapping';

type PoolBase = {
    poolAddress: string;
    chainId: string;
    hook?: HookData;
};

export type WeightedPool = PoolBase & WeightedState;

export type StablePool = PoolBase & StableState;

export type BufferPool = PoolBase & BufferState & { decimals: number[] };

export type GyroEPool = PoolBase & GyroECLPState;

export type ReClammPool = PoolBase & ReClammState;

export type QuantAmmPool = PoolBase & QuantAmmState;

export type SupportedPools = WeightedPool | StablePool | BufferPool | GyroEPool | ReClammPool | QuantAmmPool;

type SwapPath = {
    swapKind: number;
    amountRaw: bigint;
    outputRaw: bigint;
    tokens: string[];
    pools: string[];
    test: string;
    currentTimestamp: bigint;
    chainId: string;
};

export type TestData = {
    swapPathPools: PrismaPoolAndHookWithDynamic[][];
    swapPaths: SwapPath[];
    bufferPools: BufferPoolData[][];
};

// Reads all json test files and parses to relevant swap/pool bigint format
export function readTestData(): TestData {
    const testData: TestData = {
        swapPathPools: [],
        swapPaths: [],
        bufferPools: [],
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

                // map pools to prisma pools
                const pools: PrismaPoolAndHookWithDynamic[] = mapPools(jsonData.pools);
                testData.swapPathPools.push(pools);

                const bufferPools: BufferPoolData[] = mapBufferPools(jsonData.pools);
                testData.bufferPools.push(bufferPools);

                const currentTimestampString = (jsonData.pools as { currentTimestamp?: string }[]).find(
                    (pool) => pool.currentTimestamp,
                )?.currentTimestamp;

                // add swapPaths
                testData.swapPaths.push({
                    ...jsonData.swapPath,
                    pools: jsonData.swapPath.pools,
                    swapKind: Number(jsonData.swapPath.swapKind),
                    amountRaw: BigInt(jsonData.swapPath.amountRaw),
                    outputRaw: BigInt(jsonData.swapPath.outputRaw),
                    test: file,
                    currentTimestamp: currentTimestampString ? BigInt(currentTimestampString) : undefined,
                    chainId: jsonData.test.chainId,
                });
            } catch (error) {
                console.error(`Error parsing JSON file ${file}:`, error);
            }
        }
    }

    return testData;
}

function mapPools(pools: TransformBigintToString<SupportedPools>[]): PrismaPoolAndHookWithDynamic[] {
    const bufferPools: BufferPool[] = pools
        .filter((pool) => pool.poolType === 'Buffer')
        .map((pool) => ({
            ...pool,
            rate: BigInt(pool.rate),
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
                dailyPriceShiftBase: BigInt(pool.dailyPriceShiftBase),
                centerednessMargin: BigInt(pool.centerednessMargin),
                startFourthRootPriceRatio: BigInt(pool.startFourthRootPriceRatio),
                endFourthRootPriceRatio: BigInt(pool.endFourthRootPriceRatio),
                priceRatioUpdateStartTime: BigInt(pool.priceRatioUpdateStartTime),
                priceRatioUpdateEndTime: BigInt(pool.priceRatioUpdateEndTime),
                currentTimestamp: BigInt(pool.currentTimestamp),
            };
            prismaPools.push(mapReClammPoolStateToPrismaPool(reClammPool, Number(pool.chainId), 3, bufferPools));
        } else if (pool.poolType === 'QUANT_AMM_WEIGHTED') {
            const quantAmmPool = {
                ...pool,
                scalingFactors: pool.scalingFactors.map((sf) => BigInt(sf)),
                swapFee: BigInt(pool.swapFee),
                balancesLiveScaled18: pool.balancesLiveScaled18.map((b) => BigInt(b)),
                tokenRates: pool.tokenRates.map((r) => BigInt(r)),
                totalSupply: BigInt(pool.totalSupply),
                aggregateSwapFee: BigInt(pool.aggregateSwapFee ?? '0'),
                supportsUnbalancedLiquidity:
                    pool.supportsUnbalancedLiquidity === undefined ? true : pool.supportsUnbalancedLiquidity,
                firstFourWeightsAndMultipliers: pool.firstFourWeightsAndMultipliers.map((w) => BigInt(w)),
                secondFourWeightsAndMultipliers: pool.secondFourWeightsAndMultipliers.map((m) => BigInt(m)),
                maxTradeSizeRatio: BigInt(pool.maxTradeSizeRatio),
                lastUpdateTime: BigInt(pool.lastUpdateTime),
                lastInteropTime: BigInt(pool.lastInteropTime),
                currentTimestamp: BigInt(pool.currentTimestamp),
            };
            prismaPools.push(mapQuantAmmPoolStateToPrismaPool(quantAmmPool, Number(pool.chainId), 3, bufferPools));
        }
    }
    return prismaPools;
}

function mapBufferPools(pools: TransformBigintToString<SupportedPools>[]): BufferPoolData[] {
    const bufferPools: BufferPool[] = pools
        .filter((pool) => pool.poolType === 'Buffer')
        .map((pool) => ({
            ...pool,
            rate: BigInt(pool.rate),
        }));

    const bufferPoolData: BufferPoolData[] = bufferPools.map((pool) => ({
        ...pool,
        address: pool.poolAddress as Address,
        mainToken: { address: pool.tokens[0] as Address, decimals: pool.decimals[0] },
        underlyingToken: { address: pool.tokens[1] as Address, decimals: pool.decimals[1] },
        unwrapRate: pool.rate,
        chainId: Number(pool.chainId),
    }));

    return bufferPoolData;
}
