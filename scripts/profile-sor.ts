#!/usr/bin/env node

/**
 * SOR CPU Profiling Script
 *
 * Usage:
 *   npx tsx scripts/profile-sor.ts [options]
 *
 * Options:
 *   --fetch <count>              Fetch and save swap data only
 *   --file <path>                Use swaps from file
 *   --swap <tokenIn,tokenOut,amount>  Test single swap
 *   --count <n>                  Number of swaps to fetch (default: 100)
 *   --help                       Show help
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';
import { Session } from 'inspector';
import { promisify } from 'util';
import { SorService } from '../modules/sor/sor.service';
import mainnetConfig from '../config/mainnet';
import { getViemClient } from '../modules/sources/viem-client';
import { multicallViem } from '../modules/web3/multicaller-viem';
import { parseAbiItem } from 'abitype';
import { formatUnits, getAddress, keccak256, toHex, encodeAbiParameters, parseAbiParameters } from 'viem';

// Configuration
const CONFIG = {
    vaults: {
        v2: mainnetConfig.balancer.v2.vaultAddress,
        v3: mainnetConfig.balancer.v3.vaultAddress,
    },
    eventSignatures: {
        v2: '0x2170c741c41531aec20e7c107c24eecfdd15e69c9bb0a8dd37b1840b9e0b207b',
        v3: '0x' + keccak256(toHex('Swap(address,address,address,uint256,uint256,uint256,uint256)')).slice(2),
    },
    defaults: {
        swapCount: 100,
        blocksToSearch: 7200,
        dataDir: path.join(process.cwd(), 'profiles', 'real-swaps'),
        defaultSwapsFile: 'latest-swaps.json',
    },
};

// Types
interface SwapData {
    tokenIn: string;
    tokenOut: string;
    amount: string; // This is amountIn scaled (for backward compatibility)
    amountIn: string; // Raw amount in
    amountOut: string; // Raw amount out  
    amountInScaled?: string; // Scaled amount in
    amountOutScaled?: string; // Scaled amount out
    poolId?: string;
    blockNumber?: number;
    transactionHash?: string;
    protocolVersion?: '2' | '3';
}

interface SwapComparison {
    swap: SwapData;
    sorReturnAmount: string;
    actualAmountOut: string;
    deviation: number;
    deviationPercent: number;
}

interface ProfileResult {
    successful: number;
    failed: number;
    duration: number;
    avgPerSwap: number;
    topFunctions?: any[];
    comparisons?: SwapComparison[];
    biggestDeviations?: SwapComparison[];
}

// Utilities
function ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function formatTimestamp(): string {
    return new Date().toISOString().replace(/:/g, '-').split('.')[0];
}

function getSwapsFilePath(filename?: string): string {
    ensureDirectory(CONFIG.defaults.dataDir);
    return path.join(CONFIG.defaults.dataDir, filename || CONFIG.defaults.defaultSwapsFile);
}

// 1. Swap Data Fetcher - Fetches and stores swap data
class SwapDataFetcher {
    private viemClient = getViemClient('MAINNET');
    private tokenDecimals = new Map<string, number>();

    async fetchAndSaveSwaps(count: number = CONFIG.defaults.swapCount, outputFile?: string): Promise<string> {
        console.log(`\n🔍 Fetching ${count} recent swaps from Balancer...`);

        const swaps = await this.fetchRecentSwaps(count);
        const filePath = getSwapsFilePath(outputFile);

        fs.writeFileSync(filePath, JSON.stringify(swaps, null, 2));
        console.log(`✅ Saved ${swaps.length} swaps to: ${filePath}`);

        return filePath;
    }

    private async fetchRecentSwaps(count: number): Promise<SwapData[]> {
        const currentBlock = Number(await this.viemClient.getBlockNumber());
        const fromBlock = currentBlock - CONFIG.defaults.blocksToSearch;

        // Fetch logs
        const [v2Logs, v3Logs] = await Promise.all([
            this.fetchLogs(CONFIG.vaults.v2, CONFIG.eventSignatures.v2, fromBlock, currentBlock),
            this.fetchLogs(CONFIG.vaults.v3, CONFIG.eventSignatures.v3, fromBlock, currentBlock),
        ]);

        console.log(`   Found: ${v2Logs.length} v2, ${v3Logs.length} v3 swaps`);

        // Parse swaps
        const v2Swaps = this.parseV2Swaps(v2Logs);
        const v3Swaps = this.parseV3Swaps(v3Logs);

        // Select balanced set
        const selected = this.selectBalancedSwaps(v2Swaps, v3Swaps, count);

        // Fetch decimals and scale amounts
        await this.fetchTokenDecimals(selected);

        console.log(`   Selected: ${selected.length} unique swaps`);
        return selected;
    }

    private async fetchLogs(address: string, topic: string, fromBlock: number, toBlock: number): Promise<any[]> {
        const logs = (await this.viemClient.request({
            method: 'eth_getLogs',
            params: [
                {
                    address: address as `0x${string}`,
                    topics: [topic as `0x${string}`],
                    fromBlock: toHex(fromBlock),
                    toBlock: toHex(toBlock),
                },
            ],
        })) as any[];

        return logs;
    }

    private parseV2Swaps(logs: any[]): SwapData[] {
        return logs
            .map((log) => {
                try {
                    const data = (log.data as string).slice(2);
                    const amountIn = BigInt('0x' + data.slice(0, 64)).toString();
                    const amountOut = BigInt('0x' + data.slice(64, 128)).toString();
                    return {
                        tokenIn: getAddress('0x' + (log.topics[2] as string).slice(26)).toLowerCase(),
                        tokenOut: getAddress('0x' + (log.topics[3] as string).slice(26)).toLowerCase(),
                        amount: amountIn, // Keep for backward compatibility
                        amountIn,
                        amountOut,
                        poolId: log.topics[1] as string,
                        blockNumber:
                            typeof log.blockNumber === 'string'
                                ? parseInt(log.blockNumber, 16)
                                : Number(log.blockNumber),
                        transactionHash: log.transactionHash as string,
                        protocolVersion: '2' as const,
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean) as SwapData[];
    }

    private parseV3Swaps(logs: any[]): SwapData[] {
        return logs
            .map((log) => {
                try {
                    const data = (log.data as string).slice(2);
                    const amountIn = BigInt('0x' + data.slice(0, 64)).toString();
                    const amountOut = BigInt('0x' + data.slice(64, 128)).toString();
                    // Note: V3 also has swapFeePercentage at data.slice(128, 192) and swapFeeAmount at data.slice(192, 256)
                    return {
                        tokenIn: getAddress('0x' + (log.topics[2] as string).slice(26)).toLowerCase(),
                        tokenOut: getAddress('0x' + (log.topics[3] as string).slice(26)).toLowerCase(),
                        amount: amountIn, // Keep for backward compatibility
                        amountIn,
                        amountOut,
                        poolId: '0x' + (log.topics[1] as string).slice(26),
                        blockNumber:
                            typeof log.blockNumber === 'string'
                                ? parseInt(log.blockNumber, 16)
                                : Number(log.blockNumber),
                        transactionHash: log.transactionHash as string,
                        protocolVersion: '3' as const,
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean) as SwapData[];
    }

    private selectBalancedSwaps(v2Swaps: SwapData[], v3Swaps: SwapData[], count: number): SwapData[] {
        const selected: SwapData[] = [];
        const seenPairs = new Set<string>();

        // Sort by newest
        v2Swaps.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));
        v3Swaps.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));

        // Select unique pairs
        for (const swaps of [v2Swaps, v3Swaps]) {
            for (const swap of swaps) {
                if (selected.length >= count) break;

                const pairKey = `${swap.tokenIn}-${swap.tokenOut}`;
                if (!seenPairs.has(pairKey)) {
                    seenPairs.add(pairKey);
                    selected.push(swap);
                }
            }
        }

        return selected;
    }

    private async fetchTokenDecimals(swaps: SwapData[]): Promise<void> {
        const uniqueTokens = Array.from(new Set(swaps.flatMap((s) => [s.tokenIn, s.tokenOut])));

        const calls = uniqueTokens.map((token) => ({
            path: token,
            address: token as `0x${string}`,
            abi: [parseAbiItem('function decimals() view returns(uint8)')],
            functionName: 'decimals',
        }));

        try {
            const results = await multicallViem(this.viemClient, calls);
            for (const token of uniqueTokens) {
                this.tokenDecimals.set(token, Number(results[token] || 18));
            }
        } catch {
            uniqueTokens.forEach((token) => this.tokenDecimals.set(token, 18));
        }

        // Convert amounts to human-readable format
        for (const swap of swaps) {
            const inDecimals = this.tokenDecimals.get(swap.tokenIn) || 18;
            const outDecimals = this.tokenDecimals.get(swap.tokenOut) || 18;
            
            // Scale both amounts
            swap.amountInScaled = formatUnits(BigInt(swap.amountIn), inDecimals);
            swap.amountOutScaled = formatUnits(BigInt(swap.amountOut), outDecimals);
            
            // Keep 'amount' as scaled amountIn for backward compatibility
            swap.amount = swap.amountInScaled;
        }
    }
}

// 2. SOR Profiler - Tests SOR with provided swaps
class SorProfiler {
    async profileSwaps(swaps: SwapData[], opts: { heap?: boolean } = {}): Promise<ProfileResult> {
        console.log(`\n🔄 Profiling SOR with ${swaps.length} swaps... (heap=${!!opts.heap})`);

        const session = new Session();
        session.connect();
        const post = promisify(session.post.bind(session));

        // --- Enable profiling domains ---
        await post('Profiler.enable');
        await post('Profiler.setSamplingInterval', { interval: 100 });
        await post('Runtime.enable');

        if (opts.heap) {
            await post('HeapProfiler.enable');
            await post('HeapProfiler.startTrackingHeapObjects', { trackAllocations: true });
            await post('HeapProfiler.startSampling', {
                samplingInterval: 256 * 1024,
                stackDepth: 32,
            });
        }

        // --- Start CPU profiler ---
        await post('Profiler.start');
        const startTime = performance.now();

        console.log(`   Creating SorService instance...`);
        const sor = new SorService();

        let successful = 0;
        let failed = 0;
        const comparisons: SwapComparison[] = [];

        for (const swap of swaps) {
            try {
                const sorResult = await sor.getSorSwapPaths({
                    tokenIn: swap.tokenIn,
                    tokenOut: swap.tokenOut,
                    swapAmount: swap.amount,
                    swapType: 'EXACT_IN',
                    chain: 'MAINNET',
                });
                successful++;
                
                // Compare SOR result with actual swap output
                if (sorResult.returnAmount && swap.amountOutScaled) {
                    const sorAmount = parseFloat(sorResult.returnAmount);
                    const actualAmount = parseFloat(swap.amountOutScaled);
                    const deviation = sorAmount - actualAmount;
                    const deviationPercent = actualAmount !== 0 ? (deviation / actualAmount) * 100 : 0;
                    
                    comparisons.push({
                        swap,
                        sorReturnAmount: sorResult.returnAmount,
                        actualAmountOut: swap.amountOutScaled,
                        deviation,
                        deviationPercent,
                    });
                }
                
                if (successful % 10 === 0) process.stdout.write('.');
            } catch {
                failed++;
            }
        }

        console.log('');
        const duration = performance.now() - startTime;

        // --- Stop CPU profiler ---
        const { profile } = await post('Profiler.stop');

        let heapProfile: any = null;
        if (opts.heap) {
            const { profile: hp } = await post('HeapProfiler.stopSampling');
            heapProfile = hp;
            await post('HeapProfiler.stopTrackingHeapObjects');
            await post('HeapProfiler.disable');
        }

        // --- Disable domains ---
        await post('Runtime.disable');
        await post('Profiler.disable');
        session.disconnect();

        // --- Save profiles ---
        if (profile) this.saveProfile(profile, 'cpuprofile');
        if (heapProfile) this.saveProfile(heapProfile, 'heapprofile');

        // --- Analyze comparisons ---
        const biggestDeviations = this.analyzeComparisons(comparisons);
        
        // --- Analyze CPU profile ---
        if (profile) {
            const analysis = this.analyzeProfile(profile);
            this.printResults(successful, failed, duration, swaps.length, analysis, biggestDeviations);

            return {
                successful,
                failed,
                duration,
                avgPerSwap: duration / swaps.length,
                topFunctions: analysis,
                comparisons,
                biggestDeviations,
            };
        }

        return { 
            successful, 
            failed, 
            duration, 
            avgPerSwap: duration / swaps.length,
            comparisons,
            biggestDeviations,
        };
    }
    
    private analyzeComparisons(comparisons: SwapComparison[]): SwapComparison[] {
        if (comparisons.length === 0) return [];
        
        // Sort by absolute deviation percentage
        const sorted = [...comparisons].sort((a, b) => 
            Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent)
        );
        
        // Log summary statistics
        const avgDeviation = comparisons.reduce((sum, c) => sum + Math.abs(c.deviationPercent), 0) / comparisons.length;
        const betterCount = comparisons.filter(c => c.deviation > 0).length;
        const worseCount = comparisons.filter(c => c.deviation < 0).length;
        const exactCount = comparisons.filter(c => Math.abs(c.deviation) < 0.000001).length;
        
        console.log('\n📊 SOR vs Actual Comparison:');
        console.log(`   Total comparisons: ${comparisons.length}`);
        console.log(`   Average deviation: ${avgDeviation.toFixed(2)}%`);
        console.log(`   SOR better: ${betterCount} (${(betterCount / comparisons.length * 100).toFixed(1)}%)`);
        console.log(`   SOR worse: ${worseCount} (${(worseCount / comparisons.length * 100).toFixed(1)}%)`);
        console.log(`   Exact match: ${exactCount}`);
        
        // Return top 10 biggest deviations
        return sorted.slice(0, 10);
    }

    private analyzeProfile(profile: any): any[] {
        const nodes = profile.nodes;
        const samples = profile.samples;
        const timeDeltas = profile.timeDeltas;

        const functionTimes = new Map<number, { self: number; count: number }>();
        const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));

        for (let i = 0; i < samples.length; i++) {
            const nodeId = samples[i];
            const delta = timeDeltas[i];

            if (!functionTimes.has(nodeId)) {
                functionTimes.set(nodeId, { self: 0, count: 0 });
            }

            const times = functionTimes.get(nodeId)!;
            times.self += delta;
            times.count++;
        }

        const totalTime = timeDeltas.reduce((sum: number, d: number) => sum + d, 0);

        return Array.from(functionTimes.entries())
            .map(([nodeId, times]) => {
                const node = nodeMap.get(nodeId) as any;
                if (!node?.callFrame) return null;

                return {
                    functionName: node.callFrame.functionName || '(anonymous)',
                    file: node.callFrame.url || 'unknown',
                    selfTime: times.self,
                    callCount: times.count,
                    percentOfTotal: (times.self / totalTime) * 100,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b!.selfTime - a!.selfTime)
            .slice(0, 10);
    }

    private saveProfile(profile: any, type: 'cpuprofile' | 'heapprofile'): void {
        ensureDirectory(CONFIG.defaults.dataDir);
        const profilePath = path.join(CONFIG.defaults.dataDir, `profile-${formatTimestamp()}.${type}`);
        fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
        console.log(`📁 ${type.toUpperCase()} saved: ${profilePath}`);
    }

    private printResults(
        successful: number,
        failed: number,
        duration: number,
        total: number,
        topFunctions?: any[],
        biggestDeviations?: SwapComparison[],
    ): void {
        console.log(`\n📊 Results:`);
        console.log(`   Successful: ${successful}/${total}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Total time: ${duration.toFixed(2)}ms`);
        console.log(`   Avg per swap: ${(duration / total).toFixed(2)}ms`);
        
        // Print biggest deviations
        if (biggestDeviations && biggestDeviations.length > 0) {
            console.log(`\n🎯 Biggest Deviations (SOR vs Actual):`);
            for (let i = 0; i < Math.min(5, biggestDeviations.length); i++) {
                const comp = biggestDeviations[i];
                const sign = comp.deviation > 0 ? '+' : '';
                console.log(`   ${i + 1}. ${comp.swap.tokenIn.slice(0, 6)}...${comp.swap.tokenIn.slice(-4)} → ${comp.swap.tokenOut.slice(0, 6)}...${comp.swap.tokenOut.slice(-4)}`);
                console.log(`      Amount In: ${parseFloat(comp.swap.amount).toFixed(4)}`);
                console.log(`      SOR Output: ${parseFloat(comp.sorReturnAmount).toFixed(4)}`);
                console.log(`      Actual Output: ${parseFloat(comp.actualAmountOut).toFixed(4)}`);
                console.log(`      Deviation: ${sign}${comp.deviation.toFixed(6)} (${sign}${comp.deviationPercent.toFixed(2)}%)`);
                console.log(`      ${comp.deviation > 0 ? '✅ SOR found better path' : '⚠️  SOR predicted worse'}`);
            }
        }

        if (topFunctions && topFunctions.length > 0) {
            console.log(`\n🔥 Top Functions:`);
            for (let i = 0; i < Math.min(5, topFunctions.length); i++) {
                const func = topFunctions[i];
                const fileName = func.file.split('/').pop() || func.file;
                console.log(`   ${func.percentOfTotal.toFixed(1)}% - ${func.functionName} (${fileName})`);
            }
        }
    }
}

// 3. CLI Handler
class CLI {
    private fetcher = new SwapDataFetcher();
    private profiler = new SorProfiler();

    async run(args: string[]): Promise<void> {
        const options = this.parseArgs(args);

        if (options.help) {
            this.printHelp();
            return;
        }

        if (options.fetchOnly) {
            // Just fetch and save swaps
            await this.fetcher.fetchAndSaveSwaps(options.count);
            return;
        }

        // Determine swap source
        let swaps: SwapData[] = [];

        if (options.singleSwap) {
            // Use single swap from CLI params
            swaps = [options.singleSwap];
            console.log(`\n📝 Using single swap from CLI params`);
        } else if (options.file) {
            // Load from specified file
            swaps = this.loadSwapsFromFile(options.file);
            console.log(`\n📂 Loaded ${swaps.length} swaps from: ${options.file}`);
        } else {
            // Try to load from default file, or fetch new ones
            const defaultFile = getSwapsFilePath();
            if (fs.existsSync(defaultFile)) {
                swaps = this.loadSwapsFromFile(defaultFile);
                console.log(`\n📂 Loaded ${swaps.length} swaps from: ${defaultFile}`);
            } else {
                console.log(`\n🔄 No saved swaps found. Fetching new ones...`);
                const filePath = await this.fetcher.fetchAndSaveSwaps(options.count);
                swaps = this.loadSwapsFromFile(filePath);
            }
        }

        if (swaps.length === 0) {
            console.error('❌ No swaps to test');
            process.exit(1);
        }

        // Profile the swaps
        await this.profiler.profileSwaps(swaps);
    }

    private parseArgs(args: string[]): any {
        const options: any = {
            help: args.includes('--help') || args.includes('-h'),
            fetchOnly: false,
            count: CONFIG.defaults.swapCount,
            file: null,
            singleSwap: null,
        };

        // Parse fetch-only mode
        const fetchIndex = args.indexOf('--fetch');
        if (fetchIndex !== -1) {
            options.fetchOnly = true;
            if (args[fetchIndex + 1] && !args[fetchIndex + 1].startsWith('--')) {
                options.count = parseInt(args[fetchIndex + 1]) || CONFIG.defaults.swapCount;
            }
        }

        // Parse count
        const countIndex = args.indexOf('--count');
        if (countIndex !== -1 && args[countIndex + 1]) {
            options.count = parseInt(args[countIndex + 1]) || CONFIG.defaults.swapCount;
        }

        // Parse file
        const fileIndex = args.indexOf('--file');
        if (fileIndex !== -1 && args[fileIndex + 1]) {
            options.file = args[fileIndex + 1];
        }

        // Parse single swap
        const swapIndex = args.indexOf('--swap');
        if (swapIndex !== -1 && args[swapIndex + 1]) {
            const parts = args[swapIndex + 1].split(',');
            if (parts.length === 3) {
                options.singleSwap = {
                    tokenIn: parts[0],
                    tokenOut: parts[1],
                    amount: parts[2],
                };
            } else {
                console.error('❌ Invalid swap format. Use: --swap tokenIn,tokenOut,amount');
                process.exit(1);
            }
        }

        return options;
    }

    private loadSwapsFromFile(filePath: string): SwapData[] {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Failed to load swaps from ${filePath}:`, error);
            return [];
        }
    }

    private printHelp(): void {
        console.log(`
SOR CPU Profiling Tool

Usage: npx tsx scripts/profile-sor.ts [options]

Options:
  --fetch [count]              Fetch and save swap data only (default: ${CONFIG.defaults.swapCount})
  --file <path>                Use swaps from specified file
  --swap <in,out,amount>       Test single swap (e.g., --swap 0xC02aa...,0x6B17...,1.5)
  --count <n>                  Number of swaps to fetch (default: ${CONFIG.defaults.swapCount})
  --help                       Show this help

Examples:
  # Fetch latest 200 swaps and save to file
  npx tsx scripts/profile-sor.ts --fetch 200

  # Test with previously saved swaps
  npx tsx scripts/profile-sor.ts --file profiles/real-swaps/latest-swaps.json

  # Test single swap
  npx tsx scripts/profile-sor.ts --swap 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,0x6B175474E89094C44Da98b954EedeAC495271d0F,1.5

  # Auto mode: use saved swaps if available, otherwise fetch new ones
  npx tsx scripts/profile-sor.ts

Data directory: ${CONFIG.defaults.dataDir}/
        `);
    }
}

// Main entry point
async function main() {
    const cli = new CLI();

    try {
        await cli.run(process.argv.slice(2));
        console.log('\n✨ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => process.exit(0));
}

export { SwapDataFetcher, SorProfiler, SwapData };
