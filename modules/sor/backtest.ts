import { performance } from 'perf_hooks';
import { sorService } from './sor.service';
import { QuerySorGetSwapPathsArgs } from '../../apps/api/gql/generated-schema';
import { formatUnits, getAddress, keccak256, parseAbiItem, toHex } from 'viem';
import { multicallViem } from '../web3/multicaller-viem';
import { getViemClient } from '../sources/viem-client';
import mainnetConfig from '../../config/mainnet';
import { Chain } from '@prisma/client';

// Configuration
const CONFIG = {
    chain: 'MAINNET' as Chain,
    vaults: {
        v2: mainnetConfig.balancer.v2.vaultAddress,
        v3: mainnetConfig.balancer.v3.vaultAddress,
    },
    eventSignatures: {
        v2: '0x2170c741c41531aec20e7c107c24eecfdd15e69c9bb0a8dd37b1840b9e0b207b',
        v3: '0x' + keccak256(toHex('Swap(address,address,address,uint256,uint256,uint256,uint256)')).slice(2),
    },
    defaults: {
        swapCount: 1000,
        blocksToSearch: 10000,
    },
};

// Types
interface SwapData {
    tokenIn: string;
    tokenOut: string;
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amount: string; // This is amountIn scaled (for backward compatibility)
    amountIn: string; // Raw amount in
    amountOut: string; // Raw amount out
    amountInScaled?: string; // Scaled amount in
    amountOutScaled?: string; // Scaled amount out
    poolId?: string;
    blockNumber?: number;
    transactionHash?: string;
    logIndex?: number;
    protocolVersion?: '2' | '3';
}

type BacktestResult = {
    txHash: string;
    protocolVersion: string;
    tokenIn: string;
    tokenOut: string;
    amount: string;
    historicAmountOut: string;
    sorAmountOut: string;
    improvement: number; // percentage difference
    durationMs: number;
};

class SorBacktester {
    private fetcher = new SwapDataFetcher();

    async run(count: number): Promise<void> {
        console.log(`\n📊 Running SOR backtest over last ${count} swaps...\n`);

        // 1. Fetch swaps
        const swapData = await this.fetcher.fetchRecentSwaps(count);

        // const swapData = [
        //     {
        //         transactionHash: '0x0',
        //         tokenIn: '0x7c050be1dded733bd44116b60a8a35125ba47459',
        //         tokenInSymbol: 'wrsETH',
        //         tokenOut: '0x53a6abb52b2f968fa80df6a894e4f1b1020da975',
        //         tokenOutSymbol: 'dUSD',
        //         amount: '1',
        //         amountIn: '10000000000000000',
        //         amountInScaled: '1',
        //         amountOut: '10000000000000000',
        //         amountOutScaled: '4661.8117',
        //         protocolVersion: '3',
        //     },
        // ];

        const results: BacktestResult[] = [];

        for (const swap of swapData) {
            try {
                // 2. Build query for our sorService
                const args: QuerySorGetSwapPathsArgs = {
                    tokenIn: swap.tokenIn,
                    tokenOut: swap.tokenOut,
                    swapAmount: swap.amountInScaled || '0',
                    swapType: 'EXACT_IN',
                    chain: CONFIG.chain,
                };

                // 3. Run SOR with timing
                const start = performance.now();
                const sorResult = await sorService.getSorSwapPaths(args);
                const durationMs = performance.now() - start;

                // Historic = actual out from chain logs
                const historicOut = parseFloat(swap.amountOutScaled || '0');
                const sorOut =
                    sorResult?.returnAmount && !isNaN(parseFloat(sorResult.returnAmount))
                        ? parseFloat(sorResult.returnAmount)
                        : 0;

                const improvement = historicOut > 0 ? ((sorOut - historicOut) / historicOut) * 100 : 0;

                // console.log(
                //     sorResult.routes[0].hops.length,
                //     sorResult.routes[0].hops.map((h) => h.poolId),
                // );

                results.push({
                    txHash: swap.transactionHash!,
                    protocolVersion: swap.protocolVersion!,
                    tokenIn: swap.tokenIn,
                    tokenOut: swap.tokenOut,
                    amount: swap.amountInScaled!,
                    historicAmountOut: swap.amountOutScaled!,
                    sorAmountOut: sorResult.returnAmount ?? '0',
                    improvement,
                    durationMs,
                });

                console.log(
                    `${swap.tokenInSymbol.padStart(16, '.')} > ${swap.tokenOutSymbol.padEnd(16, '.')} | hist=${historicOut.toFixed(
                        4,
                    )}, sor=${sorOut.toFixed(4)} | Δ=${improvement.toFixed(2)}% | ${durationMs.toFixed(1)}ms | ${sorResult.swaps.length} hops`,
                );
            } catch (err) {
                console.warn(`   ⚠️ Error processing swap: ${swap.transactionHash}`, err);
            }
        }

        // 4. Summaries
        this.printSummary(results);
    }

    private printSummary(results: BacktestResult[]): void {
        const avgDuration = results.slice(1).reduce((s, r) => s + r.durationMs, 0) / (results.length || 1);
        const avgImprovement = results.reduce((s, r) => s + r.improvement, 0) / (results.length || 1);

        console.log('\n📈 Backtest Summary:');
        console.table({
            swapsTested: results.length,
            avgLatencyMs: avgDuration.toFixed(2),
            avgImprovementPercent: avgImprovement.toFixed(2),
            notFound: results.filter((r) => r.sorAmountOut === '0').length,
            betterInCount: results.filter((r) => r.improvement > 0).length,
            worseInCount: results.filter((r) => r.sorAmountOut !== '0' && r.improvement < 0).length,
        });
    }
}

// Entrypoint usage
(async () => {
    const backtester = new SorBacktester();
    await backtester.run(CONFIG.defaults.swapCount);
    process.exit(0);
})();

// 1. Swap Data Fetcher - Fetches and stores swap data
class SwapDataFetcher {
    private viemClient = getViemClient(CONFIG.chain);
    private tokenDecimals = new Map<string, number>();

    async fetchRecentSwaps(count: number): Promise<SwapData[]> {
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

        // Group swaps by transaction hash
        const groupedSwaps = this.groupSwapsByTransaction([...v2Swaps, ...v3Swaps]);

        // Select balanced set
        const selected = this.selectBalancedSwaps(groupedSwaps, [], count);

        // Fetch decimals and scale amounts
        await this.processTokens(selected);

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
                        logIndex: typeof log.logIndex === 'string' ? parseInt(log.logIndex, 16) : Number(log.logIndex),
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
                        logIndex: typeof log.logIndex === 'string' ? parseInt(log.logIndex, 16) : Number(log.logIndex),
                        protocolVersion: '3' as const,
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean) as SwapData[];
    }

    private groupSwapsByTransaction(swaps: SwapData[]): SwapData[] {
        const grouped = new Map<string, SwapData[]>();

        // Group swaps by transaction hash
        for (const swap of swaps) {
            if (!swap.transactionHash) continue;

            const txHash = swap.transactionHash;
            if (!grouped.has(txHash)) {
                grouped.set(txHash, []);
            }
            grouped.get(txHash)!.push(swap);
        }

        // Combine swaps within each transaction
        const result: SwapData[] = [];
        for (const [txHash, txSwaps] of grouped.entries()) {
            if (txSwaps.length === 1) {
                // Single swap, keep as is
                result.push(txSwaps[0]);
            } else {
                // Multiple swaps in same transaction - sort by log index
                const sorted = txSwaps.sort((a, b) => (a.logIndex || 0) - (b.logIndex || 0));

                // First swap (lowest log index)
                const firstSwap = sorted[0];
                // Last swap (highest log index)
                const lastSwap = sorted[sorted.length - 1];

                // Combine: tokenIn/amountIn from first, tokenOut/amountOut from last
                const combined: SwapData = {
                    ...firstSwap,
                    tokenOut: lastSwap.tokenOut,
                    tokenOutSymbol: lastSwap.tokenOutSymbol,
                    amountOut: lastSwap.amountOut,
                    amountOutScaled: lastSwap.amountOutScaled,
                };

                result.push(combined);
            }
        }

        return result;
    }

    private selectBalancedSwaps(v2Swaps: SwapData[], v3Swaps: SwapData[], count: number): SwapData[] {
        const selected: SwapData[] = [];
        const seenPairs = new Set<string>();

        // Sort by newest
        const allSwaps = [...v2Swaps, ...v3Swaps].sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));

        // Select unique pairs
        for (const swap of allSwaps) {
            if (selected.length >= count) break;

            const pairKey = `${swap.tokenIn}-${swap.tokenOut}-${swap.protocolVersion}`;
            if (!seenPairs.has(pairKey)) {
                seenPairs.add(pairKey);
                selected.push(swap);
            }
        }

        return selected;
    }

    private async processTokens(swaps: SwapData[]): Promise<void> {
        const uniqueTokens = Array.from(new Set(swaps.flatMap((s) => [s.tokenIn, s.tokenOut])));

        const calls = uniqueTokens.flatMap((token) => [
            {
                path: `${token}.decimals`,
                address: token as `0x${string}`,
                abi: [parseAbiItem('function decimals() view returns(uint8)')],
                functionName: 'decimals',
            },
            {
                path: `${token}.symbol`,
                address: token as `0x${string}`,
                abi: [parseAbiItem('function symbol() view returns(string)')],
                functionName: 'symbol',
            },
        ]);

        const symbols = new Map<string, string>();
        try {
            const results = await multicallViem(this.viemClient, calls);
            for (const token of uniqueTokens) {
                this.tokenDecimals.set(token, Number(results[token].decimals || 18));
                symbols.set(token, results[token].symbol || '0x');
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

            const inSymbol = symbols.get(swap.tokenIn);
            const outSymbol = symbols.get(swap.tokenOut);

            swap.tokenInSymbol = inSymbol || 'no-symbol';
            swap.tokenOutSymbol = outSymbol || 'no-symbol';
        }
    }
}
