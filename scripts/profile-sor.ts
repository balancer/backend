#!/usr/bin/env node

/**
 * Original SOR CPU Profiling Script
 *
 * Isolated profiling for the original SOR implementation only
 * Generates CPU profiles compatible with Chrome DevTools
 *
 * Run with: node --loader tsx scripts/profile-sor.ts
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import * as v8 from 'v8';
import * as fs from 'fs';
import * as path from 'path';
import { Session } from 'inspector';
import { promisify } from 'util';
import { SorService } from '../modules/sor/sor.service';
import { QuerySorGetSwapPathsArgs } from '../apps/api/gql/generated-schema';

interface SwapConfig {
    name: string;
    tokenIn: string;
    tokenOut: string;
    swapAmount: string;
    swapType: 'EXACT_IN' | 'EXACT_OUT';
    chain: string;
}

interface FunctionProfile {
    functionName: string;
    file: string;
    line: number;
    selfTime: number;
    totalTime: number;
    callCount: number;
    percentOfTotal: number;
}

interface CPUProfile {
    topFunctions: FunctionProfile[];
    totalTime: number;
    profileData?: any;
}

class OriginalSorProfiler {
    private session: Session | null = null;
    private originalSor = new SorService();
    private profilesDir = path.join(process.cwd(), 'profiles', 'original-sor');

    constructor() {
        // Create profiles directory if it doesn't exist
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
    }

    private async startCPUProfiling(): Promise<void> {
        this.session = new Session();
        this.session.connect();

        const post = promisify(this.session.post.bind(this.session));
        await post('Profiler.enable');
        await post('Profiler.setSamplingInterval', { interval: 100 }); // 100 microseconds
        await post('Profiler.start');
    }

    private async stopCPUProfiling(): Promise<any> {
        if (!this.session) return null;

        const post = promisify(this.session.post.bind(this.session));
        const profile = await post('Profiler.stop');
        await post('Profiler.disable');

        this.session.disconnect();
        this.session = null;

        return profile.profile;
    }

    private analyzeCPUProfile(profile: any): CPUProfile {
        const nodes = profile.nodes;
        const samples = profile.samples;
        const timeDeltas = profile.timeDeltas;

        // Build node map
        const nodeMap = new Map<number, any>();
        for (const node of nodes) {
            nodeMap.set(node.id, node);
        }

        // Calculate time spent in each function
        const functionTimes = new Map<number, { self: number; total: number; count: number }>();
        let currentTime = profile.startTime;

        for (let i = 0; i < samples.length; i++) {
            const nodeId = samples[i];
            const delta = timeDeltas[i];

            // Update self time for the sampled node
            if (!functionTimes.has(nodeId)) {
                functionTimes.set(nodeId, { self: 0, total: 0, count: 0 });
            }
            const times = functionTimes.get(nodeId)!;
            times.self += delta;
            times.count++;

            // Update total time for all ancestors
            let currentNode = nodeMap.get(nodeId);
            while (currentNode) {
                if (!functionTimes.has(currentNode.id)) {
                    functionTimes.set(currentNode.id, { self: 0, total: 0, count: 0 });
                }
                functionTimes.get(currentNode.id)!.total += delta;

                if (currentNode.parent) {
                    currentNode = nodeMap.get(currentNode.parent);
                } else {
                    break;
                }
            }

            currentTime += delta;
        }

        const totalTime = currentTime - profile.startTime;

        // Convert to function profiles
        const functionProfiles: FunctionProfile[] = [];

        for (const [nodeId, times] of functionTimes.entries()) {
            const node = nodeMap.get(nodeId);
            if (!node || !node.callFrame) continue;

            const callFrame = node.callFrame;
            const functionName = callFrame.functionName || '(anonymous)';

            // Filter out system/runtime functions
            if (functionName.startsWith('(') && functionName.endsWith(')')) continue;

            functionProfiles.push({
                functionName,
                file: callFrame.url || 'unknown',
                line: callFrame.lineNumber || 0,
                selfTime: times.self,
                totalTime: times.total,
                callCount: times.count,
                percentOfTotal: (times.self / totalTime) * 100,
            });
        }

        // Sort by self time
        functionProfiles.sort((a, b) => b.selfTime - a.selfTime);

        return {
            topFunctions: functionProfiles.slice(0, 50),
            totalTime: totalTime / 1000, // Convert to milliseconds
            profileData: profile,
        };
    }

    private formatFunctionName(func: FunctionProfile): string {
        const fileName = func.file.split('/').pop() || func.file;
        return `${func.functionName} (${fileName}:${func.line})`;
    }

    private async profileSingleSwap(config: SwapConfig, iterations: number = 100): Promise<CPUProfile> {
        console.log(`\n🔄 Profiling Original SOR: ${config.name}`);
        console.log(`   Running ${iterations} iterations with CPU profiling...`);

        // Warm up (without profiling)
        console.log('   Warming up...');
        for (let i = 0; i < 5; i++) {
            try {
                await this.originalSor.getSorSwapPaths(config as QuerySorGetSwapPathsArgs);
            } catch (error) {
                // Continue even if swap fails
            }
        }

        // Start CPU profiling
        await this.startCPUProfiling();

        const startTime = performance.now();
        let successfulSwaps = 0;
        let failedSwaps = 0;

        // Run the swap multiple times
        for (let i = 0; i < iterations; i++) {
            try {
                await this.originalSor.getSorSwapPaths(config as QuerySorGetSwapPathsArgs);
                successfulSwaps++;
            } catch (error) {
                failedSwaps++;
            }
        }

        const endTime = performance.now();
        const totalDuration = endTime - startTime;

        // Stop profiling and analyze
        const profile = await this.stopCPUProfiling();
        const analysis = this.analyzeCPUProfile(profile);

        // Save raw profile for Chrome DevTools
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const profilePath = path.join(this.profilesDir, `${config.name.replace(/\s+/g, '-')}-${timestamp}.cpuprofile`);
        fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));

        console.log(`   ✅ Successful swaps: ${successfulSwaps}/${iterations}`);
        if (failedSwaps > 0) {
            console.log(`   ⚠️  Failed swaps: ${failedSwaps}`);
        }
        console.log(`   ⏱️  Total time: ${totalDuration.toFixed(2)}ms`);
        console.log(`   ⏱️  Average per swap: ${(totalDuration / iterations).toFixed(2)}ms`);
        console.log(`   📁 Profile saved: ${profilePath}`);

        return analysis;
    }

    private printFunctionBreakdown(profile: CPUProfile, limit: number = 20): void {
        console.log(`\n📊 Top ${limit} Functions by CPU Time:`);
        console.log('─'.repeat(100));
        console.log(
            'Function'.padEnd(50) +
                'Self Time'.padEnd(12) +
                'Total Time'.padEnd(12) +
                'Calls'.padEnd(10) +
                '% of Total',
        );
        console.log('─'.repeat(100));

        const topFunctions = profile.topFunctions.slice(0, limit);

        for (const func of topFunctions) {
            const funcName = this.formatFunctionName(func);
            const truncatedName = funcName.length > 48 ? funcName.substring(0, 45) + '...' : funcName;

            console.log(
                truncatedName.padEnd(50) +
                    `${(func.selfTime / 1000).toFixed(2)}ms`.padEnd(12) +
                    `${(func.totalTime / 1000).toFixed(2)}ms`.padEnd(12) +
                    func.callCount.toString().padEnd(10) +
                    `${func.percentOfTotal.toFixed(1)}%`,
            );
        }
    }

    private identifyHotspots(profile: CPUProfile): void {
        console.log('\n🔥 Performance Hotspots in Original SOR:');
        console.log('─'.repeat(80));

        // Group functions by category
        const categories = {
            pathFinding: [] as FunctionProfile[],
            poolOperations: [] as FunctionProfile[],
            optimization: [] as FunctionProfile[],
            validation: [] as FunctionProfile[],
            calculations: [] as FunctionProfile[],
            utils: [] as FunctionProfile[],
            other: [] as FunctionProfile[],
        };

        for (const func of profile.topFunctions) {
            const name = func.functionName.toLowerCase();
            const file = func.file.toLowerCase();

            if (name.includes('path') || name.includes('route') || file.includes('path')) {
                categories.pathFinding.push(func);
            } else if (name.includes('pool') || file.includes('pool')) {
                categories.poolOperations.push(func);
            } else if (name.includes('optim') || name.includes('best') || name.includes('sort')) {
                categories.optimization.push(func);
            } else if (name.includes('valid') || name.includes('check') || name.includes('filter')) {
                categories.validation.push(func);
            } else if (name.includes('calc') || name.includes('compute') || name.includes('amount')) {
                categories.calculations.push(func);
            } else if (file.includes('util') || name.includes('format') || name.includes('parse')) {
                categories.utils.push(func);
            } else {
                categories.other.push(func);
            }
        }

        // Calculate and display category totals
        for (const [category, functions] of Object.entries(categories)) {
            if (functions.length === 0) continue;

            const totalTime = functions.reduce((sum, f) => sum + f.selfTime, 0);
            const percent = (totalTime / (profile.totalTime * 1000)) * 100;

            if (percent > 1) {
                // Only show categories with >1% CPU usage
                console.log(`\n${category.charAt(0).toUpperCase() + category.slice(1)}:`);
                console.log(`  Total CPU: ${percent.toFixed(1)}%`);
                console.log(`  Top functions:`);

                const topInCategory = functions.sort((a, b) => b.selfTime - a.selfTime).slice(0, 3);

                for (const func of topInCategory) {
                    console.log(`    - ${func.functionName}: ${func.percentOfTotal.toFixed(1)}%`);
                }
            }
        }
    }

    private async generateFlameGraph(profile: CPUProfile, name: string): Promise<void> {
        console.log('\n🔥 Generating Flame Graph Data...');

        // Convert profile to collapsed stack format for flamegraph
        const stacks: string[] = [];
        const nodes = profile.profileData.nodes;
        const samples = profile.profileData.samples;
        const timeDeltas = profile.profileData.timeDeltas;

        // Build node map
        const nodeMap = new Map<number, any>();
        for (const node of nodes) {
            nodeMap.set(node.id, node);
        }

        // Process each sample
        for (let i = 0; i < samples.length; i++) {
            const nodeId = samples[i];
            const weight = timeDeltas[i];

            // Build stack trace
            const stack: string[] = [];
            let currentNode = nodeMap.get(nodeId);

            while (currentNode) {
                if (currentNode.callFrame) {
                    const frame = currentNode.callFrame;
                    const funcName = frame.functionName || '(anonymous)';
                    const fileName = (frame.url || 'unknown').split('/').pop();
                    stack.unshift(`${funcName} (${fileName})`);
                }

                if (currentNode.parent) {
                    currentNode = nodeMap.get(currentNode.parent);
                } else {
                    break;
                }
            }

            if (stack.length > 0) {
                stacks.push(`${stack.join(';')} ${weight}`);
            }
        }

        // Save collapsed stacks
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const stacksPath = path.join(this.profilesDir, `${name}-stacks-${timestamp}.txt`);
        fs.writeFileSync(stacksPath, stacks.join('\n'));

        console.log(`   📁 Collapsed stacks saved: ${stacksPath}`);
        console.log(`   💡 To generate flamegraph:`);
        console.log(`      1. Install: npm install -g flamegraph`);
        console.log(`      2. Generate: flamegraph ${stacksPath} > ${name}.svg`);
    }

    async runDetailedProfiling(configs?: SwapConfig[]): Promise<void> {
        const defaultConfigs: SwapConfig[] = [
            {
                name: 'Small-ETH-USDC',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
                tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
                swapAmount: '0.1',
                swapType: 'EXACT_IN',
                chain: 'MAINNET',
            },
            {
                name: 'Medium-ETH-USDC',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
                tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
                swapAmount: '1',
                swapType: 'EXACT_IN',
                chain: 'MAINNET',
            },
            {
                name: 'Large-ETH-USDC',
                tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
                tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
                swapAmount: '100',
                swapType: 'EXACT_IN',
                chain: 'MAINNET',
            },
        ];

        const swapConfigs = configs || defaultConfigs;

        console.log('🚀 Original SOR CPU Profiling Analysis');
        console.log('='.repeat(80));
        console.log('This will generate detailed CPU profiles for the original SOR implementation');
        console.log('Profiles will be saved in: ' + this.profilesDir);
        console.log('');

        const allProfiles: { config: SwapConfig; profile: CPUProfile }[] = [];

        for (const config of swapConfigs) {
            const profile = await this.profileSingleSwap(config, 50);
            this.printFunctionBreakdown(profile, 15);
            this.identifyHotspots(profile);
            await this.generateFlameGraph(profile, `original-${config.name}`);

            allProfiles.push({ config, profile });
        }

        // Summary comparison across different swap sizes
        if (allProfiles.length > 1) {
            console.log('\n📊 Performance Summary Across Swap Sizes:');
            console.log('─'.repeat(80));

            for (const { config, profile } of allProfiles) {
                console.log(`\n${config.name}:`);
                console.log(`  Total profiling time: ${profile.totalTime.toFixed(2)}ms`);
                console.log(
                    `  Top CPU consumer: ${profile.topFunctions[0]?.functionName || 'N/A'} (${profile.topFunctions[0]?.percentOfTotal.toFixed(1)}%)`,
                );
            }
        }

        console.log('\n✅ Profiling complete!');
        console.log('\n📖 How to analyze the profiles:');
        console.log('1. Open Chrome DevTools (F12)');
        console.log('2. Go to Performance tab');
        console.log('3. Click "Load profile" button (up arrow icon)');
        console.log('4. Select a .cpuprofile file from: ' + this.profilesDir);
        console.log('\nThis will show you:');
        console.log('- Call tree with time spent in each function');
        console.log('- Flame chart visualization');
        console.log('- Bottom-up view of expensive functions');
    }

    async profileWithMemory(): Promise<void> {
        console.log('\n💾 Profiling with Memory Analysis...');

        // Take initial heap snapshot
        this.takeHeapSnapshot('before');
        const initialMemory = process.memoryUsage();

        const config: SwapConfig = {
            name: 'Memory-Profile',
            tokenIn: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            swapAmount: '10',
            swapType: 'EXACT_IN',
            chain: 'MAINNET',
        };

        // Run profiling
        const profile = await this.profileSingleSwap(config, 20);

        // Take final heap snapshot
        this.takeHeapSnapshot('after');
        const finalMemory = process.memoryUsage();

        // Memory analysis
        console.log('\n💾 Memory Usage:');
        console.log(
            `   Heap Used: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB increase`,
        );
        console.log(`   Total Heap: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   External: ${(finalMemory.external / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    }

    private takeHeapSnapshot(name: string): void {
        const heapSnapshotPath = path.join(this.profilesDir, `heap-${name}-${Date.now()}.heapsnapshot`);
        const heapSnapshot = v8.writeHeapSnapshot();

        if (heapSnapshot) {
            fs.writeFileSync(heapSnapshotPath, heapSnapshot);
            console.log(`📸 Heap snapshot saved: ${heapSnapshotPath}`);
        }
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Original SOR CPU Profiling Script

Usage: node --loader tsx scripts/profile-original-sor.ts [options]

Options:
  --iterations <n>   Number of swap iterations per test (default: 50)
  --memory          Include memory profiling
  --help            Show this help message

The script generates:
  1. CPU profiles (.cpuprofile) - Load in Chrome DevTools
  2. Collapsed stacks (.txt) - For flamegraph generation
  3. Heap snapshots (.heapsnapshot) - Memory analysis (with --memory flag)

Output directory: ./profiles/original-sor/

To view CPU profiles:
  1. Open Chrome DevTools (F12)
  2. Go to Performance tab
  3. Click "Load profile" (up arrow icon)
  4. Select the .cpuprofile file

To generate flamegraphs:
  1. Install: npm install -g flamegraph
  2. Generate: flamegraph profiles/original-sor/[name]-stacks.txt > flamegraph.svg
  3. Open the SVG in a browser
        `);
        process.exit(0);
    }

    const profiler = new OriginalSorProfiler();

    console.log('🚀 Starting Original SOR CPU Profiling...');
    console.log('This will identify performance bottlenecks in the original SOR implementation.\n');

    if (args.includes('--memory')) {
        await profiler.profileWithMemory();
    } else {
        await profiler.runDetailedProfiling();
    }

    console.log('\n✨ Done! Check the ./profiles/original-sor directory for output files.');
}

// Run if called directly
if (require.main === module) {
    main()
        .catch((error) => {
            console.error('❌ Profiling failed:', error);
            process.exit(1);
        })
        .finally(() => process.exit(0));
}

export { OriginalSorProfiler };
