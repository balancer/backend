import { SwapKind, BaseToken, TokenAmount } from '@balancer/sdk';
import { PathGraph } from './pathGraph/pathGraph';
import { PathGraphTraversalConfig } from './pathGraph/pathGraphTypes';
import { max, min } from './utils/math';
import { BasePool } from './poolsV2/basePool';
import { PathLocal, PathWithAmount } from './path';
import { parseEther } from 'viem';
import { Chain } from '@prisma/client';
import { chainToChainId } from '../../network/chain-id-to-chain';

const SWAPS_GREATER_THAN_BUFFER_LIMIT_THRESHOLD = 2;
export class Router {
    private readonly pathGraph: PathGraph;

    constructor() {
        this.pathGraph = new PathGraph();
    }

    public getCandidatePaths(
        tokenIn: BaseToken,
        tokenOut: BaseToken,
        pools: BasePool[],
        swapAmount: TokenAmount,
        swapKind: SwapKind,
        enableAddRemoveLiquidityPaths: boolean,
        graphTraversalConfig?: Partial<PathGraphTraversalConfig>,
    ): PathLocal[] {
        this.pathGraph.buildGraph({ pools, enableAddRemoveLiquidityPaths });

        const candidatePaths = this.pathGraph.getCandidatePaths({
            tokenIn,
            tokenOut,
            swapAmount,
            swapKind,
            graphTraversalConfig,
        });

        return candidatePaths;
    }

    public getBestPaths(paths: PathLocal[], swapKind: SwapKind, swapAmount: TokenAmount): PathWithAmount[] | null {
        if (paths.length === 0) {
            throw new Error('No potential swap paths provided');
        }

        // break swapAmount into 25%, 50%, 75% and 100% ratios, so we're able to split quote into multiple paths
        let validPaths = [...paths];
        let selectedPaths: PathLocal[] = [];
        const swapAmounts = [
            swapAmount.mulDownFixed(parseEther(String(0.25))),
            swapAmount.mulDownFixed(parseEther(String(0.5))),
            swapAmount.mulDownFixed(parseEther(String(0.75))),
            swapAmount,
        ];

        // initialize quotePaths arrays for each swapAmount ratio
        const quotePathsByRatio: PathWithAmount[][] = swapAmounts.map(() => []);

        // Quote paths for each swapAmount ratio
        swapAmounts.forEach((amount, i) => {
            validPaths.forEach((path) => {
                try {
                    const pathWithAmount = new PathWithAmount(path.tokens, path.pools, path.isBuffer, amount);

                    // prevent paths with high gas cost on HyperEvm due to small blocks limitation
                    const isHyperEvm = swapAmount.token.chainId === parseInt(chainToChainId[Chain.HYPEREVM]);
                    const gasCostTooHigh =
                        isHyperEvm &&
                        pathWithAmount.swapStepsGreaterThanBufferLimit > SWAPS_GREATER_THAN_BUFFER_LIMIT_THRESHOLD;

                    /**
                     * Remove paths that return 0 amount
                     * It usually happens when low swapAmounts are provided and return amounts rounded down to zero
                     */
                    const calculatedAmount =
                        pathWithAmount.swapKind === SwapKind.GivenIn
                            ? pathWithAmount.outputAmount
                            : pathWithAmount.inputAmount;
                    if (calculatedAmount.amount > 0n && !gasCostTooHigh) {
                        quotePathsByRatio[i].push(pathWithAmount);
                        selectedPaths.push(path);
                    }
                } catch (error) {
                    // const pathString =
                    //     path.tokens[0].address +
                    //     ' ' +
                    //     path.pools.map((pool, index) => `[${pool.id}] ${path.tokens[index + 1].address}`).join(' ');
                    // console.log('Invalid path: ' + pathString);
                    // console.log(error);
                    return;
                }
            });

            validPaths = selectedPaths;
            selectedPaths = [];
        });

        // sort each quotePaths array by outputAmount or inputAmount
        quotePathsByRatio.forEach((quotePaths) => {
            quotePaths.sort((a, b) => {
                if (swapKind === SwapKind.GivenIn) {
                    if (b.outputAmount.amount > a.outputAmount.amount) {
                        return 1;
                    } else if (b.outputAmount.amount < a.outputAmount.amount) {
                        return -1;
                    } else {
                        return 0;
                    }
                } else {
                    if (a.inputAmount.amount > b.inputAmount.amount) {
                        return 1;
                    } else if (a.inputAmount.amount < b.inputAmount.amount) {
                        return -1;
                    } else {
                        return 0;
                    }
                }
            });
        });

        // select best split path candidates based on their ratio combination
        const quotePaths25 = quotePathsByRatio[0];
        const quotePaths50 = quotePathsByRatio[1];
        const quotePaths75 = quotePathsByRatio[2];
        const quotePaths100 = quotePathsByRatio[3];

        const splitPaths: PathWithAmount[][] = [];

        if (quotePaths100.length > 0) {
            splitPaths.push([quotePaths100[0]]);
        }

        if (quotePaths75.length > 0 && quotePaths25.length > 1) {
            // select first path from quotePaths25 that has no pool in common with quotePaths75[0]
            const bestPath25 = quotePaths25.find(
                (path) => !quotePaths75[0].pools.some((pool) => path.pools.includes(pool)),
            );
            if (bestPath25) {
                try {
                    splitPaths.push(this.splitPaths(swapAmount, bestPath25, quotePaths75[0])); // 25/75
                } catch (error) {
                    console.log('Error splitting paths 25/75: ', error);
                }
            }
        }

        if (quotePaths50.length > 1) {
            const secondBestPath50 = quotePaths50.find(
                (path) => !quotePaths50[0].pools.some((pool) => path.pools.includes(pool)),
            );
            if (secondBestPath50) {
                try {
                    splitPaths.push(this.splitPaths(swapAmount, quotePaths50[0], secondBestPath50)); // 50/50
                } catch (error) {
                    console.log('Error splitting paths 50/50: ', error);
                }
            }
        }

        if (splitPaths.length === 0) {
            // console.log('No valid paths found');
            return null;
        }

        // Find the split path that yields the best result (i.e. maxAmountOut on GivenIn, minAmountIn on GivenOut)
        let bestSplitPaths: PathWithAmount[] = [];
        if (swapKind === SwapKind.GivenIn) {
            const splitPathsAmountsOut = splitPaths.map((paths) =>
                paths.map((path) => path.outputAmount.amount).reduce((acc, amountOut) => acc + amountOut, 0n),
            );
            const maxAmountOutIndex = splitPathsAmountsOut.indexOf(max(splitPathsAmountsOut));
            bestSplitPaths = splitPaths[maxAmountOutIndex];
        } else {
            const splitPathsAmountsIn = splitPaths.map((paths) =>
                paths.map((path) => path.inputAmount.amount).reduce((acc, amountIn) => acc + amountIn, 0n),
            );
            const minAmountInIndex = splitPathsAmountsIn.indexOf(min(splitPathsAmountsIn));
            bestSplitPaths = splitPaths[minAmountInIndex];
        }

        console.log(`SOR_SPLIT_PATHS_${splitPaths.indexOf(bestSplitPaths)}`);

        return bestSplitPaths;
    }

    // split paths making sure there is no dust left behind from rounding swapAmount ratios
    private splitPaths(swapAmount: TokenAmount, pathA: PathWithAmount, pathB: PathWithAmount) {
        const swapAmountUp = pathA.swapAmount;
        const swapAmountDown = swapAmount.sub(swapAmountUp);

        // copy pools to avoid mutating the original pools
        const pools = [...new Set(pathA.pools.concat(pathB.pools))];
        const poolsCopy = pools.map((pool) => pool.copy());
        const poolsA = pathA.pools.map((pool) => poolsCopy.find((p) => p.id === pool.id)) as BasePool[];
        const poolsB = pathB.pools.map((pool) => poolsCopy.find((p) => p.id === pool.id)) as BasePool[];

        // create paths with copied pools and `mutateBalances = true` to make sure reusing pools works as expected
        const pathUp = new PathWithAmount(pathA.tokens, poolsA, pathA.isBuffer, swapAmountUp, true);
        const pathDown = new PathWithAmount(pathB.tokens, poolsB, pathB.isBuffer, swapAmountDown, true);

        return [pathUp, pathDown];
    }
}
