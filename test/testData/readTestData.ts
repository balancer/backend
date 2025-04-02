import { BufferState, GyroECLPState, StableState, WeightedState } from '@balancer-labs/balancer-maths';
import * as fs from 'node:fs';
import * as path from 'node:path';

type TestBase = {
    chainId: number;
    blockNumber: number;
};

type PoolBase = TestBase & {
    poolAddress: string;
};

export type WeightedPool = PoolBase & WeightedState;

export type StablePool = PoolBase & StableState;

export type BufferPool = PoolBase & BufferState;

export type GyroEPool = PoolBase & GyroECLPState;

export type SupportedPools = WeightedPool | StablePool | BufferPool | GyroEPool;

export type PoolsMap = Map<string, SupportedPools>;

type SwapPath = {
    swapKind: number;
    amountRaw: bigint;
    outputRaw: bigint;
    tokens: string[];
    pools: PoolBase[];
    test: string;
};

export type TestData = {
    swapPathPools: SupportedPools[][];
    swapPaths: SwapPath[];
};

// Reads all json test files and parses to relevant swap/pool bigint format
export function readTestData(): TestData {
    const testData: TestData = {
        swapPathPools: [],
        swapPaths: [],
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

                // map pools to SupportedPools[]
                const pools: SupportedPools[] = jsonData.pools.map((pool: any) => mapPool(pool));
                testData.swapPathPools.push(pools);

                // add swapPaths
                testData.swapPaths.push({
                    ...jsonData.swapPath,
                    pools: jsonData.swapPath.pools.map((pool: any) => pool.poolAddress),
                    swapKind: Number(jsonData.swapPath.swapKind),
                    amountRaw: BigInt(jsonData.swapPath.amountRaw),
                    outputRaw: BigInt(jsonData.swapPath.outputRaw),
                    test: file,
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

function mapPool(pool: TransformBigintToString<SupportedPools>): SupportedPools {
    if (pool.poolType === 'WEIGHTED') {
        return {
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
    }
    if (pool.poolType === 'STABLE') {
        return {
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
    }
    if (pool.poolType === 'Buffer') {
        return {
            ...pool,
            rate: BigInt(pool.rate),
        };
    }
    if (pool.poolType === 'GYROE') {
        return {
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
    }
    console.log(pool);
    throw new Error('mapPool: Unsupported Pool Type');
}
