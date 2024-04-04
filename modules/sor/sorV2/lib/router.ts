import { MathSol, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathGraph } from './pathGraph/pathGraph';
import { PathGraphTraversalConfig } from './pathGraph/pathGraphTypes';
import { WAD } from './utils/math';
import { BasePool } from './pools/basePool';
import { PathLocal, PathWithAmount } from './path';
import { formatEther, maxInt256, parseEther, parseUnits } from 'viem';

export class Router {
    private readonly pathGraph: PathGraph;

    constructor() {
        this.pathGraph = new PathGraph();
    }

    public getCandidatePaths(
        tokenIn: Token,
        tokenOut: Token,
        pools: BasePool[],
        graphTraversalConfig?: Partial<PathGraphTraversalConfig>,
    ): PathLocal[] {
        this.pathGraph.buildGraph({ pools });

        const candidatePaths = this.pathGraph.getCandidatePaths({
            tokenIn,
            tokenOut,
            graphTraversalConfig,
        });

        return candidatePaths;
    }

    public getBestPaths(paths: PathLocal[], swapKind: SwapKind, swapAmount: TokenAmount): PathWithAmount[] | null {
        if (paths.length === 0) {
            throw new Error('No potential swap paths provided');
        }

        const quotePaths: PathWithAmount[] = [];

        // Check if PathWithAmount is valid (each hop pool swap limit)
        paths.forEach((path) => {
            try {
                quotePaths.push(new PathWithAmount(path.tokens, path.pools, swapAmount));
            } catch {
                // logger.trace('Invalid path:');
                // logger.trace(path.tokens.map((token) => token.symbol).join(' -> '));
                // logger.trace(path.pools.map((pool) => pool.id).join(' -> '));
                return;
            }
        });

        if (quotePaths.length === 0) {
            // logger.info('No valid paths found');
            return null;
        }

        let valueArr: { item: PathWithAmount; value: number }[];

        if (swapKind === SwapKind.GivenIn) {
            valueArr = quotePaths.map((item) => {
                return {
                    item,
                    value: Number(item.outputAmount.amount),
                };
            });
            valueArr.sort((a, b) => b.value - a.value);
        } else {
            valueArr = quotePaths.map((item) => {
                return {
                    item,
                    value: Number(item.inputAmount.amount),
                };
            });
            valueArr.sort((a, b) => a.value - b.value);
        }

        const orderedQuotePaths = valueArr.map((item) => item.item);

        // Split swapAmount in half, making sure not to lose dust
        const bestPath = orderedQuotePaths[0];
        // console.log('bestPath pools', bestPath.pools);

        const bestPathNormalizedLiquidities = bestPath.pools.map((p, i) =>
            p.getNormalizedLiquidity(bestPath.tokens[i], bestPath.tokens[i + 1]),
        );
        // const bestPathPIs = bestPathNormalizedLiquidities.map((normLiq) => MathSol.divDownFixed(WAD, normLiq));
        // const bestPathPI = bestPathPIs.reduce((acc, pi) => acc + pi, 0n);

        // console.log('bestPathNormalizedLiquidities', bestPathNormalizedLiquidities);

        const bestNormLiq = MathSol.divDownFixed(
            WAD,
            bestPathNormalizedLiquidities.reduce((acc, normLiq) => acc + MathSol.divDownFixed(WAD, normLiq), 0n),
        );

        // If there is only one path, return it
        if (orderedQuotePaths.length === 1) {
            // console.log('Single path');
            return orderedQuotePaths;
        } else {
            const bestPath2 = orderedQuotePaths[1];

            const bestPath2NormalizedLiquidities = bestPath2.pools.map((p, i) =>
                p.getNormalizedLiquidity(bestPath2.tokens[i], bestPath2.tokens[i + 1]),
            );

            const bestNormLiq2 = MathSol.divDownFixed(
                WAD,
                bestPath2NormalizedLiquidities.reduce((acc, normLiq) => acc + MathSol.divDownFixed(WAD, normLiq), 0n),
            );

            const normLiqSum = bestNormLiq + bestNormLiq2;
            const bestPathRatio = MathSol.divDownFixed(bestNormLiq, normLiqSum);
            const swapAmountNormUp = swapAmount.mulDownFixed(bestPathRatio);
            const swapAmountNormDown = swapAmount.sub(swapAmountNormUp);

            const pathNormUp = new PathWithAmount(
                orderedQuotePaths[0].tokens,
                orderedQuotePaths[0].pools,
                swapAmountNormUp,
            );
            const pathNormDown = new PathWithAmount(
                orderedQuotePaths[1].tokens,
                orderedQuotePaths[1].pools,
                swapAmountNormDown,
            );
            const bestPathsNorm = [pathNormUp, pathNormDown];

            const swapAmount50up = swapAmount.mulDownFixed(WAD / 2n);
            const swapAmount50down = swapAmount.sub(swapAmount50up);

            const path50up = new PathWithAmount(
                orderedQuotePaths[0].tokens,
                orderedQuotePaths[0].pools,
                swapAmount50up,
            );
            const path50down = new PathWithAmount(
                orderedQuotePaths[1].tokens,
                orderedQuotePaths[1].pools,
                swapAmount50down,
            );
            const bestPaths50_50 = [path50up, path50down];

            let bestPaths: PathWithAmount[] = [];

            if (swapKind === SwapKind.GivenIn) {
                if (
                    orderedQuotePaths[0].outputAmount.amount >
                    path50up.outputAmount.amount + path50down.outputAmount.amount
                ) {
                    bestPaths = orderedQuotePaths.slice(0, 1);
                } else {
                    bestPaths = [path50up, path50down];
                }
            } else {
                if (
                    orderedQuotePaths[0].inputAmount.amount <
                    path50up.inputAmount.amount + path50down.inputAmount.amount
                ) {
                    bestPaths = orderedQuotePaths.slice(0, 1);
                } else {
                    bestPaths = [path50up, path50down];
                }
            }

            const amountSingle = parseFloat(formatEther(orderedQuotePaths[0].outputAmount.amount)).toFixed(4);
            const amountNorm = parseFloat(
                formatEther(bestPathsNorm.reduce((acc, path) => acc + path.outputAmount.amount, 0n)),
            ).toFixed(4);
            const amount5050 = parseFloat(
                formatEther(bestPaths50_50.reduce((acc, path) => acc + path.outputAmount.amount, 0n)),
            ).toFixed(4);
            const bestLiq = parseFloat(formatEther(bestNormLiq)).toFixed(2);
            const bestLiq2 = parseFloat(formatEther(bestNormLiq2)).toFixed(2);

            const greatestAmount =
                bestPaths.length === 1 ? 'single' : parseFloat(amountNorm) > parseFloat(amount5050) ? 'norm' : '50-50';
            const greatestLiq = parseFloat(bestLiq) > parseFloat(bestLiq2) ? '1' : '2';

            const tIn = bestPaths[0].tokens[0].address;
            const tOut = bestPaths[0].tokens[bestPaths[0].tokens.length - 1].address;
            if (bestPathRatio > parseEther('0.6')) {
                console.table([
                    {
                        tokenIn: `${tIn.slice(0, 5)}...${tIn.slice(39)}`,
                        tokenOut: `${tOut.slice(0, 5)}...${tOut.slice(39)}`,
                        amountSingle,
                        amountNorm,
                        amount5050,
                        bestLiq,
                        bestLiq2,
                        bestPathRatio: parseFloat(formatEther(bestPathRatio)).toFixed(2),
                        greatestAmount,
                        greatestLiq,
                    },
                ]);
            }

            return bestPaths;
        }
    }
}
