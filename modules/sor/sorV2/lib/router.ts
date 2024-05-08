import { SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathGraph } from './pathGraph/pathGraph';
import { PathGraphTraversalConfig } from './pathGraph/pathGraphTypes';
import { WAD } from './utils/math';
import { BasePool } from './pools/basePool';
import { PathLocal, PathWithAmount } from './path';

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

        // If there is only one path, return it
        if (orderedQuotePaths.length === 1) {
            return orderedQuotePaths;
        }

        // Split swapAmount in half, making sure not to lose dust
        const swapAmount50up = swapAmount.mulDownFixed(WAD / 2n);
        const swapAmount50down = swapAmount.sub(swapAmount50up);

        const path50up = new PathWithAmount(orderedQuotePaths[0].tokens, orderedQuotePaths[0].pools, swapAmount50up);
        const path50down = new PathWithAmount(
            orderedQuotePaths[1].tokens,
            orderedQuotePaths[1].pools,
            swapAmount50down,
        );

        if (swapKind === SwapKind.GivenIn) {
            if (
                orderedQuotePaths[0].outputAmount.amount >
                path50up.outputAmount.amount + path50down.outputAmount.amount
            ) {
                return orderedQuotePaths.slice(0, 1);
            }
            return [path50up, path50down];
        }
        if (orderedQuotePaths[0].inputAmount.amount < path50up.inputAmount.amount + path50down.inputAmount.amount) {
            return orderedQuotePaths.slice(0, 1);
        }
        return [path50up, path50down];
    }
}
