import { performance } from 'perf_hooks';
import { sorService } from './sor.service';
import { QuerySorGetSwapPathsArgs } from '../../apps/api/gql/generated-schema';
import { Chain } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';

// Configuration
const CONFIG = {
    // chains: ['MAINNET', 'BASE', 'SONIC', 'GNOSIS'] as Chain[],
    chains: ['GNOSIS'] as Chain[],
    swapsCount: 100_000,
    logIndividualSwaps: false,
};

// Types
interface SwapData {
    tokenIn: string;
    tokenOut: string;
    tokenInSymbol: string;
    tokenOutSymbol: string;
    amountIn?: string; // Scaled amount in
    amountOut?: string; // Scaled amount out
    blockNumber?: number;
    transactionHash?: string;
    logIndex?: number;
}

type BacktestResult = {
    txHash: string;
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

    async run(): Promise<void> {
        console.log(`\n📊 Running SOR backtest for chains: ${CONFIG.chains.join(', ')}\n`);

        // Run backtest for each chain
        for (const chain of CONFIG.chains) {
            await this.runForChain(chain);
        }
    }

    private async runForChain(chain: Chain): Promise<void> {
        console.log(`\n🔗 Testing chain: ${chain}\n`);

        // 1. Fetch swaps
        const swapData = await this.fetcher.fetchRecentSwaps(CONFIG.swapsCount, chain);

        const results: BacktestResult[] = [];

        for (const swap of swapData) {
            try {
                // 2. Build query for our sorService
                const args: QuerySorGetSwapPathsArgs = {
                    tokenIn: swap.tokenIn,
                    tokenOut: swap.tokenOut,
                    swapAmount: swap.amountIn || '0',
                    swapType: 'EXACT_IN',
                    chain,
                };

                // 3. Run SOR with timing
                const start = performance.now();
                const sorResult = await sorService.getSorSwapPaths(args);
                const durationMs = performance.now() - start;

                // Historic = actual out from chain logs
                const historicOut = parseFloat(swap.amountOut || '0');
                const sorOut =
                    sorResult?.returnAmount && !isNaN(parseFloat(sorResult.returnAmount))
                        ? parseFloat(sorResult.returnAmount)
                        : 0;

                const improvement = historicOut > 0 ? ((sorOut - historicOut) / historicOut) * 100 : 0;

                results.push({
                    txHash: swap.transactionHash!,
                    tokenIn: swap.tokenIn,
                    tokenOut: swap.tokenOut,
                    amount: swap.amountIn!,
                    historicAmountOut: swap.amountOut!,
                    sorAmountOut: sorResult.returnAmount ?? '0',
                    improvement,
                    durationMs,
                });

                if (CONFIG.logIndividualSwaps) {
                    console.log(
                        `${swap.tokenInSymbol.padStart(16, '.')} > ${swap.tokenOutSymbol.padEnd(16, '.')} | hist=${historicOut.toFixed(
                            4,
                        )}, sor=${sorOut.toFixed(4)} | Δ=${improvement.toFixed(2)}% | ${durationMs.toFixed(1)}ms | ${sorResult.swaps.length} hops`,
                    );
                }
            } catch (err) {
                console.warn(`   ⚠️ Error processing swap: ${swap.transactionHash}`, err);
            }
        }

        // 4. Summary for this chain
        this.printSummary(results, chain);
    }

    private printSummary(results: BacktestResult[], chain: Chain): void {
        const avgDuration = results.slice(1).reduce((s, r) => s + r.durationMs, 0) / (results.length || 1);
        const avgImprovement = results.reduce((s, r) => s + r.improvement, 0) / (results.length || 1);

        console.log(`\n📈 Backtest Summary: ${chain}`);
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
    await backtester.run();
    process.exit(0);
})();

// 1. Swap Data Fetcher - Fetches and stores swap data
class SwapDataFetcher {
    async fetchRecentSwaps(count: number, chain: Chain): Promise<SwapData[]> {
        const tokens = await prisma.prismaToken.findMany({ where: { chain } });
        const tokensMap = new Map(tokens.map((t) => [t.address, t.symbol]));

        const swaps = (
            await prisma.prismaPoolEvent.findMany({
                where: {
                    chain,
                    type: 'SWAP',
                },
                take: count,
            })
        ).map((swap) => {
            return {
                tokenIn: (swap.payload as any).tokenIn.address,
                tokenOut: (swap.payload as any).tokenOut.address,
                tokenInSymbol: tokensMap.get((swap.payload as any).tokenIn.address) || 'x',
                tokenOutSymbol: tokensMap.get((swap.payload as any).tokenOut.address) || 'x',
                amountIn: (swap.payload as any).tokenIn.amount,
                amountOut: (swap.payload as any).tokenOut.amount,
                transactionHash: swap.tx,
                blockNumber: swap.blockNumber,
                logIndex: swap.logIndex,
            };
        });

        // Group swaps by transaction hash
        const groupedSwaps = this.groupSwapsByTransaction(swaps);

        // Select balanced set
        const selected = this.selectBalancedSwaps(groupedSwaps, []);

        return selected;
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
                };

                result.push(combined);
            }
        }

        return result;
    }

    private selectBalancedSwaps(v2Swaps: SwapData[], v3Swaps: SwapData[]): SwapData[] {
        const selected: SwapData[] = [];
        const seenPairs = new Set<string>();

        // Sort by newest
        const allSwaps = [...v2Swaps, ...v3Swaps].sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));

        // Select unique pairs
        for (const swap of allSwaps) {
            const pairKey = `${swap.tokenIn}-${swap.tokenOut}`;
            if (!seenPairs.has(pairKey)) {
                seenPairs.add(pairKey);
                selected.push(swap);
            }
        }

        return selected;
    }
}
