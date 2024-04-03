import { MathSol, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathGraph } from './pathGraph/pathGraph';
import { PathGraphTraversalConfig } from './pathGraph/pathGraphTypes';
import { WAD } from './utils/math';
import { BasePool } from './pools/basePool';
import { PathLocal, PathWithAmount } from './path';
import { formatEther, maxInt256, parseUnits } from 'viem';

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
        // console.log('bestPathNormalizedLiquidities', bestPathNormalizedLiquidities);

        const bestNormLiq = MathSol.powDownFixed(
            bestPathNormalizedLiquidities.reduce((acc, normLiq) => MathSol.mulDownFixed(acc, normLiq), WAD),
            WAD / BigInt(bestPathNormalizedLiquidities.length),
        );
        // const bestNormLiq = bestPathNormalizedLiquidities.reduce(
        //     (acc, normLiq) => MathSol.min(acc, normLiq),
        //     maxInt256,
        // );
        // console.log('bestNormLiq  ', bestNormLiq);

        // console.log('bestPath    ', bestPath.outputAmount.amount);

        let bestPaths: PathWithAmount[] = [];
        let bestPathsNorm: PathWithAmount[] = [];
        let bestPaths50_50: PathWithAmount[] = [];
        let bestNormLiq2 = 0n;

        // If there is only one path, return it
        if (orderedQuotePaths.length === 1) {
            bestPaths = orderedQuotePaths;
        } else {
            const secondBestPath = orderedQuotePaths[1];
            // console.log('second bestPath pools', secondBestPath.pools);

            const secondBestPathNormalizedLiquidities = secondBestPath.pools.map((p, i) =>
                p.getNormalizedLiquidity(secondBestPath.tokens[i], secondBestPath.tokens[i + 1]),
            );
            // console.log('bestPathNormalizedLiquidities 2', secondBestPathNormalizedLiquidities);

            bestNormLiq2 = MathSol.powDownFixed(
                secondBestPathNormalizedLiquidities.reduce((acc, normLiq) => MathSol.mulDownFixed(acc, normLiq), WAD),
                WAD / BigInt(secondBestPathNormalizedLiquidities.length),
            );
            // const secondBestNormLiq = secondBestPathNormalizedLiquidities.reduce(
            //     (acc, normLiq) => MathSol.min(acc, normLiq),
            //     maxInt256,
            // );
            // console.log('bestNormLiq 2', bestNormLiq2);

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
            bestPathsNorm = [pathNormUp, pathNormDown];
            // console.log('bestPath 2  ', secondBestPath.outputAmount.amount);
            // console.log('pathNormUp  ', pathNormUp.outputAmount.amount);
            // console.log('pathNormDown', pathNormDown.outputAmount.amount);
            // console.log('outputAmount', pathNormUp.outputAmount.amount + pathNormDown.outputAmount.amount);

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
            bestPaths50_50 = [path50up, path50down];
            // console.log('path50up    ', path50up.outputAmount.amount);
            // console.log('path50down  ', path50down.outputAmount.amount);
            // console.log('outputAmount', path50up.outputAmount.amount + path50down.outputAmount.amount);

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
        }
        const amountSingle = parseFloat(formatEther(orderedQuotePaths[0].outputAmount.amount)).toFixed(2);
        const amountNorm = parseFloat(
            formatEther(bestPathsNorm.reduce((acc, path) => acc + path.outputAmount.amount, 0n)),
        ).toFixed(2);
        const amount5050 = parseFloat(
            formatEther(bestPaths50_50.reduce((acc, path) => acc + path.outputAmount.amount, 0n)),
        ).toFixed(2);
        const bestLiq = parseFloat(formatEther(bestNormLiq)).toFixed(2);
        const bestLiq2 = parseFloat(formatEther(bestNormLiq2)).toFixed(2);

        const pathSplit = bestPaths.length === 1 ? 'single' : 'split';
        const greatestAmount = parseFloat(amountNorm) > parseFloat(amount5050) ? 'norm' : '50-50';
        const greatestLiq = parseFloat(bestLiq) > parseFloat(bestLiq2) ? '1' : '2';

        console.table([
            {
                amountSingle,
                amountNorm,
                amount5050,
                bestLiq,
                bestLiq2,
                pathSplit,
                greatestAmount,
                greatestLiq,
            },
        ]);

        return bestPaths;
    }
}
