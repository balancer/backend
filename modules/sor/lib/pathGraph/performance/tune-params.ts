#!/usr/bin/env bun

/**
 * Parameter tuning script for PathGraphBeam optimization.
 *
 * Tests various parameter combinations across different graph sizes and topologies
 * to find optimal settings for:
 * - maxDepth, maxTokenPaths, approxPathsToReturn
 * - maxRanksPerSegment, minSwapAmountRatio
 *
 * Outputs fastest, most-paths, and balanced configurations for each test case.
 * Run with: bun run modules/sor/lib/pathGraph/performance/tune-params.ts
 */

import { PathGraph } from '../pathGraph';
import { BasePool } from '../../poolsV2/basePool';
import { Token, TokenAmount, SwapKind } from '@balancer/sdk';
import { topologies, GraphSpec } from './helpers';

interface ParamSet {
    maxDepth: number;
    maxTokenPaths: number;
    approxPathsToReturn: number;
    maxRanksPerSegment: number;
    minSwapAmountRatio: number;
}

interface TuneResult {
    params: string;
    avgTimeMs: number;
    pathsFound: number;
    successRate: number;
}

// Focused parameter grid - most impactful parameters only
const PARAM_GRID = {
    maxDepth: [3, 4, 5],
    maxTokenPaths: [10, 25, 50],
    approxPathsToReturn: [5, 10, 20],
    maxRanksPerSegment: [1, 2, 3],
    minSwapAmountRatio: [0.1, 0.3, 0.5],
};

const GRAPHS: GraphSpec[] = [
    { name: 'tiny-hub', tokens: 20, pools: 30, type: 'hub-spoke' },
    { name: 'tiny-mesh', tokens: 20, pools: 40, type: 'dense-mesh' },
    { name: 'small-hub', tokens: 50, pools: 80, type: 'hub-spoke' },
    { name: 'small-mesh', tokens: 50, pools: 120, type: 'dense-mesh' },
    { name: 'med-hub', tokens: 100, pools: 200, type: 'hub-spoke' },
    { name: 'med-mesh', tokens: 100, pools: 300, type: 'dense-mesh' },
];

async function testParams(graph: { tokens: Token[]; pools: BasePool[] }, params: ParamSet): Promise<TuneResult> {
    const pathGraph = new PathGraph();
    pathGraph.buildGraph({
        pools: graph.pools,
        swapKind: 0,
        tokenPrices: new Map<string, number>(),
        minLimitThresholdUSD: 0,
        enableAddRemoveLiquidityPaths: false,
    });

    const testPairs = 3;
    const runs = 2;
    const times: number[] = [];
    let totalPaths = 0;
    let successful = 0;
    let total = 0;

    for (let pair = 0; pair < testPairs; pair++) {
        const tokenIn = graph.tokens[Math.floor(Math.random() * graph.tokens.length)];
        const tokenOut = graph.tokens[Math.floor(Math.random() * graph.tokens.length)];

        if (tokenIn === tokenOut) continue;

        for (let run = 0; run < runs; run++) {
            const amount = TokenAmount.fromRawAmount(tokenIn, BigInt(Math.floor(100000 + Math.random() * 900000)));

            const start = performance.now();
            try {
                const paths = pathGraph.getCandidatePaths({
                    tokenIn,
                    tokenOut,
                    swapAmount: amount,
                    swapKind: SwapKind.GivenIn,
                    graphTraversalConfig: {
                        ...params,
                        maxBuffersInPath: 5,
                    },
                });

                times.push(performance.now() - start);
                totalPaths += paths.length;
                successful++;
            } catch {
                times.push(performance.now() - start);
            }
            total++;
        }
    }

    const avgTime = times.reduce((s, t) => s + t, 0) / times.length;
    const avgPaths = successful > 0 ? totalPaths / successful : 0;
    const successRate = successful / total;

    const paramsStr = `d${params.maxDepth}t${params.maxTokenPaths}p${params.approxPathsToReturn}r${params.maxRanksPerSegment}s${params.minSwapAmountRatio}`;

    return {
        params: paramsStr,
        avgTimeMs: avgTime,
        pathsFound: avgPaths,
        successRate,
    };
}

function generateParamCombinations(): ParamSet[] {
    const combinations: ParamSet[] = [];

    // Generate strategic combinations instead of full grid
    // Speed-focused configs
    combinations.push(
        { maxDepth: 3, maxTokenPaths: 10, approxPathsToReturn: 5, maxRanksPerSegment: 1, minSwapAmountRatio: 0.5 },
        { maxDepth: 3, maxTokenPaths: 25, approxPathsToReturn: 10, maxRanksPerSegment: 1, minSwapAmountRatio: 0.3 },
    );

    // Balanced configs
    combinations.push(
        { maxDepth: 4, maxTokenPaths: 25, approxPathsToReturn: 10, maxRanksPerSegment: 2, minSwapAmountRatio: 0.3 },
        { maxDepth: 4, maxTokenPaths: 50, approxPathsToReturn: 20, maxRanksPerSegment: 2, minSwapAmountRatio: 0.1 },
        { maxDepth: 5, maxTokenPaths: 25, approxPathsToReturn: 10, maxRanksPerSegment: 2, minSwapAmountRatio: 0.3 },
    );

    // Quality-focused configs
    combinations.push(
        { maxDepth: 5, maxTokenPaths: 50, approxPathsToReturn: 20, maxRanksPerSegment: 3, minSwapAmountRatio: 0.1 },
        { maxDepth: 4, maxTokenPaths: 50, approxPathsToReturn: 20, maxRanksPerSegment: 3, minSwapAmountRatio: 0.1 },
    );

    // Edge cases
    combinations.push(
        { maxDepth: 3, maxTokenPaths: 50, approxPathsToReturn: 20, maxRanksPerSegment: 1, minSwapAmountRatio: 0.1 },
        { maxDepth: 5, maxTokenPaths: 10, approxPathsToReturn: 5, maxRanksPerSegment: 3, minSwapAmountRatio: 0.5 },
    );

    return combinations;
}

async function tuneGraph(spec: GraphSpec): Promise<void> {
    const graph = topologies[spec.type].generator(spec.tokens, spec.pools);
    const paramSets = generateParamCombinations();

    console.log(`${spec.name}:`);

    const results: TuneResult[] = [];

    for (const params of paramSets) {
        const result = await testParams(graph, params);
        results.push(result);
        console.log(
            `  ${result.params} → ${result.avgTimeMs.toFixed(1)}ms ${result.pathsFound.toFixed(1)}p ${(result.successRate * 100).toFixed(0)}%`,
        );
    }

    // Find best by different criteria
    const fastest = results.sort((a, b) => a.avgTimeMs - b.avgTimeMs)[0];
    const mostPaths = results.sort((a, b) => b.pathsFound - a.pathsFound)[0];
    const balanced = results.sort((a, b) => {
        const scoreA = (100 - a.avgTimeMs) * 0.6 + a.pathsFound * 0.4;
        const scoreB = (100 - b.avgTimeMs) * 0.6 + b.pathsFound * 0.4;
        return scoreB - scoreA;
    })[0];

    console.log(`  fastest: ${fastest.params}`);
    console.log(`  most-paths: ${mostPaths.params}`);
    console.log(`  balanced: ${balanced.params}`);
}

async function main(): Promise<void> {
    console.log('Parameter Tuning Results');
    console.log('Format: d=depth, t=tokenPaths, p=pathsReturn, r=ranksSegment, s=swapRatio');
    console.log('Output: time(ms), paths, success%\n');

    for (const spec of GRAPHS) {
        await tuneGraph(spec);
        console.log();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export { main, tuneGraph, PARAM_GRID };
