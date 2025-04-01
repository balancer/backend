import { BufferState, GyroECLPState, StableState, WeightedState } from '@balancer-labs/balancer-maths';
import * as fs from 'node:fs';
import * as path from 'node:path';

type PoolBase = {
    chainId: number;
    blockNumber: number;
    poolAddress: string;
};

export type WeightedPool = PoolBase & WeightedState;

export type StablePool = PoolBase & StableState;

type BufferPool = PoolBase & BufferState;

export type GyroEPool = PoolBase & GyroECLPState;

type SupportedPools = WeightedPool | StablePool | BufferPool | GyroEPool;

type PoolsMap = Map<string, SupportedPools>;

type Swap = {
    swapKind: number;
    amountRaw: bigint;
    outputRaw: bigint;
    tokenIn: string;
    tokenOut: string;
    test: string;
};

export type TestData = {
    swaps: Swap[];
    pools: PoolsMap;
};

// Reads all json test files and parses to relevant swap/pool bigint format
export function readTestData(fileName: string): TestData {
    const pools: PoolsMap = new Map<string, SupportedPools>();
    const swaps: Swap[] = [];
    const testData: TestData = {
        swaps,
        pools,
    };

    // Resolve the directory path relative to the current file's directory
    const absoluteDirectoryPath = path.resolve(__dirname, fileName);

    // Read the file conten
    const fileContent = fs.readFileSync(absoluteDirectoryPath, 'utf-8');

    // Parse the JSON content
    try {
        const jsonData = JSON.parse(fileContent);
        if (jsonData.swaps)
            swaps.push(
                ...jsonData.swaps.map((swap: Swap) => ({
                    ...swap,
                    swapKind: Number(swap.swapKind),
                    amountRaw: BigInt(swap.amountRaw),
                    outputRaw: BigInt(swap.outputRaw),
                    test: fileName,
                })),
            );
        pools.set(fileName, mapPool(jsonData.pool));
    } catch (error) {
        console.error(`Error parsing JSON file ${fileName}:`, error);
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

function mapRemoveKind(kind: string): number {
    if (kind === 'Proportional') return 0;
    else if (kind === 'SingleTokenExactIn') return 1;
    else if (kind === 'SingleTokenExactOut') return 2;
    else throw new Error(`Unsupported RemoveKind: ${kind}`);
}
