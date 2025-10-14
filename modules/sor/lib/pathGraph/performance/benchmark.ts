/**
 * Performance benchmark script for PathGraph implementations.
 *
 * Runs PathGraph benchmark across different:
 * - Graph sizes (small to xlarge)
 * - Network topologies (hub-spoke, dense-mesh, etc.)
 * - Configuration profiles (conservative vs aggressive)
 *
 * Measures build time, pathfinding speed, memory usage, and path quality.
 * Run with: bun run modules/sor/lib/pathGraph/performance/benchmark.ts
 *
 * or to get the memory usage, but that's still wonky
 *
 * npx tsx modules/sor/lib/pathGraph/performance/benchmark.ts
 */

import { PathGraph } from '../pathGraph';
import { BasePool } from '../../poolsV2/basePool';
import { Token, TokenAmount, SwapKind } from '@balancer/sdk';
import { topologies } from './helpers';

// Performance benchmark configuration
const BENCHMARK_CONFIG = {
    // Graph sizes to test
    graphSizes: {
        // tiny: { tokens: 20, pools: 30 },
        small: { tokens: 100, pools: 200 },
        // medium: { tokens: 300, pools: 800 },
        // large: { tokens: 600, pools: 2000 },
        xlarge: { tokens: 1000, pools: 4000 },
    },
    // Number of runs for statistical significance
    benchmarkRuns: 2,
    // Number of different token pairs to test per graph
    tokenPairTests: 10,
    // Test configurations
    testConfigs: [
        {
            name: 'conservative',
            config: {
                maxDepth: 4,
                maxTokenPaths: 20,
                approxPathsToReturn: 10,
                maxRanksPerSegment: 2,
                minSwapAmountRatio: 0.5,
                maxBuffersInPath: 3,
            },
        },
        {
            name: 'aggressive',
            config: {
                maxDepth: 6,
                maxTokenPaths: 100,
                approxPathsToReturn: 50,
                maxRanksPerSegment: 4,
                minSwapAmountRatio: 0.1,
                maxBuffersInPath: 8,
            },
        },
    ],
};

interface BenchmarkResult {
    implementation: string;
    graphSize: string;
    topology: string;
    configName: string;
    tokenCount: number;
    poolCount: number;
    buildGraphTime: number;
    avgPathfindingTime: number;
    medianPathfindingTime: number;
    p95PathfindingTime: number;
    minPathfindingTime: number;
    maxPathfindingTime: number;
    totalPaths: number;
    avgPathsPerQuery: number;
    successfulQueries: number;
    failedQueries: number;
    memoryUsageKB?: number;
}

function percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

async function benchmarkImplementation(
    ImplementationClass: typeof PathGraph,
    implementationName: string,
    tokens: Token[],
    pools: BasePool[],
    topology: string,
    graphSize: string,
    configName: string,
    testConfig: any,
): Promise<BenchmarkResult> {
    const graph = new ImplementationClass();

    // Measure memory before
    const memBefore = process.memoryUsage();

    // Time graph building
    const buildStart = performance.now();
    graph.buildGraph({
        pools,
        swapKind: 0,
        tokenPrices: new Map<string, number>(),
        minLimitThresholdUSD: 10,
        enableAddRemoveLiquidityPaths: false,
    });
    const buildEnd = performance.now();
    const buildGraphTime = buildEnd - buildStart;

    // Measure memory after graph building
    const memAfter = process.memoryUsage();
    const memoryUsageKB = (memAfter.heapUsed - memBefore.heapUsed) / 1024;

    // Generate diverse token pairs
    const tokenPairs: { tokenIn: Token; tokenOut: Token }[] = [];

    // Add some random pairs
    for (let i = 0; i < BENCHMARK_CONFIG.tokenPairTests; i++) {
        const tokenIn = tokens[Math.floor(Math.random() * tokens.length)];
        const tokenOut = tokens[Math.floor(Math.random() * tokens.length)];

        if (tokenIn !== tokenOut) {
            tokenPairs.push({ tokenIn, tokenOut });
        }
    }

    // Benchmark pathfinding
    const pathfindingTimes: number[] = [];
    let totalPaths = 0;
    let successfulQueries = 0;
    let failedQueries = 0;

    for (const { tokenIn, tokenOut } of tokenPairs) {
        for (let run = 0; run < BENCHMARK_CONFIG.benchmarkRuns; run++) {
            const swapAmount = TokenAmount.fromRawAmount(tokenIn, BigInt(Math.floor(Math.random() * 1000000) + 10000));

            const startTime = performance.now();

            try {
                const paths = graph.getCandidatePaths({
                    tokenIn,
                    tokenOut,
                    swapAmount,
                    swapKind: SwapKind.GivenIn,
                    graphTraversalConfig: testConfig,
                });

                const endTime = performance.now();
                pathfindingTimes.push(endTime - startTime);
                totalPaths += paths.length;
                successfulQueries++;
            } catch {
                const endTime = performance.now();
                pathfindingTimes.push(endTime - startTime);
                failedQueries++;
            }
        }
    }

    const avgPathfindingTime = pathfindingTimes.reduce((sum, time) => sum + time, 0) / pathfindingTimes.length;
    const medianPathfindingTime = percentile(pathfindingTimes, 50);
    const p95PathfindingTime = percentile(pathfindingTimes, 95);
    const minPathfindingTime = Math.min(...pathfindingTimes);
    const maxPathfindingTime = Math.max(...pathfindingTimes);
    const avgPathsPerQuery = successfulQueries > 0 ? totalPaths / successfulQueries : 0;

    return {
        implementation: implementationName,
        graphSize,
        topology,
        configName,
        tokenCount: tokens.length,
        poolCount: pools.length,
        buildGraphTime,
        avgPathfindingTime,
        medianPathfindingTime,
        p95PathfindingTime,
        minPathfindingTime,
        maxPathfindingTime,
        totalPaths,
        avgPathsPerQuery,
        successfulQueries,
        failedQueries,
        memoryUsageKB,
    };
}

function printDetailedResults(results: BenchmarkResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 PATHGRAPH PERFORMANCE BENCHMARK RESULTS');
    console.log('='.repeat(80));

    // Group by topology only, then by size and config
    const topologyGroups = results.reduce(
        (acc, result) => {
            if (!acc[result.topology]) acc[result.topology] = {};
            const sizeConfigKey = `${result.graphSize}-${result.configName}`;
            if (!acc[result.topology][sizeConfigKey]) acc[result.topology][sizeConfigKey] = [];
            acc[result.topology][sizeConfigKey].push(result);
            return acc;
        },
        {} as Record<string, Record<string, BenchmarkResult[]>>,
    );

    console.log('\n**PathGraph Performance:**\n');

    for (const [topology, sizeConfigGroups] of Object.entries(topologyGroups)) {
        const displayTopology = topology
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('-');

        console.log(`${displayTopology} topology:`);

        // Group by graph size to show all sizes for this topology
        const sizeGroups: Record<string, Record<string, BenchmarkResult[]>> = {};
        for (const [sizeConfigKey, groupResults] of Object.entries(sizeConfigGroups)) {
            const [graphSize, configName] = sizeConfigKey.split('-');
            if (!sizeGroups[graphSize]) sizeGroups[graphSize] = {};
            sizeGroups[graphSize][configName] = groupResults;
        }

        for (const [graphSize, configGroups] of Object.entries(sizeGroups)) {
            // Get token/pool count from any result in this size group
            const sampleResult = Object.values(configGroups)[0][0];
            console.log(`* ${graphSize} (${sampleResult.tokenCount} tokens, ${sampleResult.poolCount} pools):`);

            for (const [configName, groupResults] of Object.entries(configGroups)) {
                const result = groupResults.find((r) => r.implementation === 'PathGraph');

                if (!result) continue;

                const speed = result.avgPathfindingTime;

                console.log(`${configName.charAt(0).toUpperCase() + configName.slice(1)} ${speed.toFixed(2)}ms`);
            }
        }
        console.log('');
    }

    // Overall summary
    console.log('='.repeat(80));
    console.log('📈 OVERALL PERFORMANCE SUMMARY');
    console.log('='.repeat(80));

    const avgPathfinding = results.reduce((sum, r) => sum + r.avgPathfindingTime, 0) / results.length;
    const avgBuild = results.reduce((sum, r) => sum + r.buildGraphTime, 0) / results.length;

    console.log(`   Overall pathfinding speed: ${avgPathfinding.toFixed(2)}ms`);
    console.log(`   Overall build speed: ${avgBuild.toFixed(2)}ms`);

    const avgPaths = results.reduce((sum, r) => sum + r.avgPathsPerQuery, 0) / results.length;
    console.log(`   Average paths found: ${avgPaths.toFixed(1)}`);

    console.log('\n✅ Benchmark completed successfully!\n');
}

async function main(): Promise<void> {
    console.log('🔥 Starting PathGraph Performance Benchmark...\n');
    console.log(`Configuration:`);
    console.log(`- Graph sizes: ${Object.keys(BENCHMARK_CONFIG.graphSizes).join(', ')}`);
    console.log(
        `- Topologies: ${Object.keys(topologies)
            .map((t) => t)
            .join(', ')}`,
    );
    console.log(`- Benchmark runs per test: ${BENCHMARK_CONFIG.benchmarkRuns}`);
    console.log(`- Token pair tests per graph: ${BENCHMARK_CONFIG.tokenPairTests}\n`);

    const results: BenchmarkResult[] = [];

    for (const [sizeKey, sizeConfig] of Object.entries(BENCHMARK_CONFIG.graphSizes)) {
        for (const topology of Object.values(topologies)) {
            for (const { name: configName, config: testConfig } of BENCHMARK_CONFIG.testConfigs) {
                console.log(`\n🧪 Generating ${sizeKey} ${topology.name} graph (${configName} config)...`);

                const { tokens, pools } = topology.generator(sizeConfig.tokens, sizeConfig.pools);
                console.log(`   Generated: ${tokens.length} tokens, ${pools.length} pools`);

                console.log(`   Testing PathGraph...`);
                const result = await benchmarkImplementation(
                    PathGraph,
                    'PathGraph',
                    tokens,
                    pools,
                    topology.name,
                    sizeKey,
                    configName,
                    testConfig,
                );
                results.push(result);
                console.log(
                    `   ✅ Beam: ${result.avgPathfindingTime.toFixed(2)}ms avg, ${result.successfulQueries} successful queries`,
                );
            }
        }
    }

    printDetailedResults(results);
}

// Run the benchmark
if (require.main === module) {
    main().catch(console.error);
}

export { main, benchmarkImplementation, topologies, BENCHMARK_CONFIG };
