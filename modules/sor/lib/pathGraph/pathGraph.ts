import { Address, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathGraphEdgeData, PathGraphTraversalConfig } from './pathGraphTypes';
import { BasePool } from '../poolsV2/basePool';
import { PathLocal } from '../path';
import { formatUnits } from 'viem';

const DEFAULT_MAX_PATHS_PER_TOKEN_PAIR = 4;

export class PathGraph {
    private nodes: Set<string>;
    private edges: Map<string, Map<string, PathGraphEdgeData[]>>;
    private poolAddressMap: Map<string, BasePool>;

    constructor() {
        this.nodes = new Set();
        this.edges = new Map();
        this.poolAddressMap = new Map();
    }

    // We build a directed graph for all pools.
    // Nodes are tokens and edges are triads: [pool.id, tokenIn, tokenOut].
    // The current criterion for including a pool path into this graph is the following:
    // - For any token pair x -> y, we include only the most liquid ${maxPathsPerTokenPair}
    // pool pairs (default 2).
    public buildGraph({
        pools,
        maxPathsPerTokenPair = DEFAULT_MAX_PATHS_PER_TOKEN_PAIR,
        enableAddRemoveLiquidityPaths,
        swapKind,
        tokenPrices,
        minLimitThresholdUSD,
    }: {
        pools: BasePool[];
        maxPathsPerTokenPair?: number;
        enableAddRemoveLiquidityPaths: boolean;
        swapKind: SwapKind;
        tokenPrices: Map<string, number>;
        minLimitThresholdUSD: number;
    }) {
        this.poolAddressMap = new Map();
        this.nodes = new Set();
        this.edges = new Map();

        this.buildPoolAddressMap(pools);
        this.addAllTokensAsGraphNodes({ pools, enableAddRemoveLiquidityPaths });
        this.addTokenPairsAsGraphEdges({
            pools,
            maxPathsPerTokenPair,
            enableAddRemoveLiquidityPaths,
            swapKind,
            tokenPrices,
            minLimitThresholdUSD,
        });
    }

    // Since the path combinations here can get quite large, we use configurable parameters
    // to enforce upper limits across several dimensions, defined in the pathConfig.
    // (a) maxDepth - the max depth of the traversal (length of token path), defaults to 4.
    // (b) maxTokenPaths - the max number of token paths to search for, defaults to 50.
    // (c) maxBuffersInPath - the max number of buffers in a path, defaults to 5.
    // (d) approxPathsToReturn - search for up to this many paths. Since all paths for a single traversal
    // are added, its possible that the amount returned is larger than this number.
    // (e) minSwapAmountRatio - the min swap amount ratio, defaults to 0.5.
    // (f) poolIdsToInclude - Only include paths with these poolIds (optional)

    // Additionally, we impose the following requirements for a path to be considered valid
    // (a) It does not visit the same token twice
    // (b) It does not use the same pool twice
    public getCandidatePaths({
        tokenIn,
        tokenOut,
        swapAmount,
        swapKind,
        graphTraversalConfig,
    }: {
        tokenIn: Token;
        tokenOut: Token;
        swapAmount: TokenAmount;
        swapKind: SwapKind;
        graphTraversalConfig?: Partial<PathGraphTraversalConfig>;
    }): PathLocal[] {
        const isHyperEvm = tokenIn.chainId === 999;

        // apply defaults, allowing caller override whatever they'd like
        const config: PathGraphTraversalConfig = {
            maxDepth: 4,
            maxTokenPaths: 50,
            maxBuffersInPath: isHyperEvm ? 2 : 5, // limited only on HyperEvm due to gas cost limits on small blocks - virtually unlimited otherwise
            approxPathsToReturn: 20, // Default to 20 - likely won't be reached, but acts as a bound to the computation if needed
            minSwapAmountRatio: 0.5, // Default to 50% so we're sure selected paths support splitPath logic
            ...graphTraversalConfig,
        };

        // Calculate minimum limit threshold based on swap amount and ratio
        const minLimitThreshold = (swapAmount.amount * BigInt(Math.floor(config.minSwapAmountRatio * 100))) / 100n;

        const tokenPaths = this.findAllValidTokenPaths({
            tokenIn: tokenIn.wrapped,
            tokenOut: tokenOut.wrapped,
            config,
        });

        const paths: PathGraphEdgeData[][] = [];

        // Use the new greedy best-first approach for each token path
        for (const tokenPath of tokenPaths) {
            const expandedPaths = this.expandTokenPathWithBeamSearch({
                tokenPath,
                swapKind,
                minLimitThreshold,
                approxPathsToReturn: config.approxPathsToReturn,
                config,
            });

            for (const path of expandedPaths) {
                if (this.isValidPath({ path, config })) {
                    paths.push(path);
                }
            }
        }

        return paths.map((path) => {
            const pathTokens: Token[] = [...path.map((segment) => segment.tokenOut)];
            pathTokens.unshift(tokenIn);
            pathTokens[pathTokens.length - 1] = tokenOut;

            return new PathLocal(
                pathTokens,
                path.map((segment) => segment.pool),
                path.map((segment) => segment.isBuffer),
            );
        });
    }

    private buildPoolAddressMap(pools: BasePool[]) {
        for (const pool of pools) {
            this.poolAddressMap.set(pool.address.toLowerCase(), pool);
        }
    }

    private addAllTokensAsGraphNodes({
        pools,
        enableAddRemoveLiquidityPaths,
    }: {
        pools: BasePool[];
        enableAddRemoveLiquidityPaths: boolean;
    }) {
        for (const pool of pools) {
            const tokens = [...pool.tokens.map((t) => t.token)];
            if (enableAddRemoveLiquidityPaths && pool.poolType !== 'Buffer') {
                tokens.push(new Token(pool.tokens[0].token.chainId, pool.address.toLowerCase() as Address, 18)); // Add BPT as token nodes
            }
            for (const token of tokens) {
                if (!this.nodes.has(token.wrapped)) {
                    this.addNode(token);
                }
            }
        }
    }

    private addTokenPairsAsGraphEdges({
        pools,
        maxPathsPerTokenPair,
        enableAddRemoveLiquidityPaths,
        swapKind,
        tokenPrices,
        minLimitThresholdUSD,
    }: {
        pools: BasePool[];
        maxPathsPerTokenPair: number;
        enableAddRemoveLiquidityPaths: boolean;
        swapKind?: SwapKind;
        tokenPrices?: Map<string, number>;
        minLimitThresholdUSD?: number;
    }) {
        for (const pool of pools) {
            const tokens = [...pool.tokens.map((t) => t.token)];
            if (enableAddRemoveLiquidityPaths && pool.poolType !== 'Buffer') {
                tokens.push(new Token(pool.tokens[0].token.chainId, pool.address.toLowerCase() as Address, 18)); // Also consider BPT token pairs
            }
            for (const tokenIn of tokens) {
                for (const tokenOut of tokens) {
                    if (tokenIn === tokenOut) continue;
                    try {
                        const edgeProps = this.buildEdgeProps({ pool, tokenIn, tokenOut, swapKind, tokenPrices });
                        // Skip edges whose USD limit is known and below threshold; allow undefined to pass
                        if (
                            minLimitThresholdUSD !== undefined &&
                            edgeProps.limitUSD !== undefined &&
                            edgeProps.limitUSD < minLimitThresholdUSD
                        ) {
                            continue;
                        }
                        this.addEdge({ edgeProps, maxPathsPerTokenPair });
                    } catch (error) {
                        // leave edge undefined if anything fails
                    }
                }
            }
        }
    }

    // Build edge properties including optional limitUSD using tokenPrices for the given swapKind
    private buildEdgeProps({
        pool,
        tokenIn,
        tokenOut,
        swapKind,
        tokenPrices,
    }: {
        pool: BasePool;
        tokenIn: Token;
        tokenOut: Token;
        swapKind?: SwapKind;
        tokenPrices?: Map<string, number>;
    }): PathGraphEdgeData {
        let limitUSD: number | undefined = undefined;
        if (swapKind && tokenPrices) {
            const limit = pool.getLimitAmountSwap(tokenIn, tokenOut, swapKind);
            const priceToken = (swapKind as any) === SwapKind.GivenIn ? tokenIn : tokenOut;
            const price = tokenPrices.get(priceToken.wrapped.toLowerCase());
            if (price !== undefined) {
                const amount = Number(formatUnits(limit, priceToken.decimals));
                limitUSD = amount * price;
            }
        }

        return {
            pool,
            tokenIn,
            tokenOut,
            normalizedLiquidity: pool.getNormalizedLiquidity(tokenIn, tokenOut),
            isBuffer: pool.poolType === 'Buffer',
            limitUSD,
        };
    }

    private addNode(token: Token): void {
        this.nodes.add(token.wrapped);

        if (!this.edges.has(token.wrapped)) {
            this.edges.set(token.wrapped, new Map());
        }
    }

    /**
     * Adds a directed edge from a source vertex to a destination
     */
    private addEdge({
        edgeProps,
        maxPathsPerTokenPair,
    }: {
        edgeProps: PathGraphEdgeData;
        maxPathsPerTokenPair: number;
    }): void {
        const tokenInVertex = this.nodes.has(edgeProps.tokenIn.wrapped);
        const tokenOutVertex = this.nodes.has(edgeProps.tokenOut.wrapped);
        const tokenInNode = this.edges.get(edgeProps.tokenIn.wrapped);

        if (!tokenInVertex || !tokenOutVertex || !tokenInNode) {
            throw new Error('Attempting to add invalid edge');
        }

        const existingEdges = tokenInNode.get(edgeProps.tokenOut.wrapped) || [];

        const sorted = [...existingEdges, edgeProps].sort((a, b) =>
            a.normalizedLiquidity > b.normalizedLiquidity ? -1 : 1,
        );

        tokenInNode.set(
            edgeProps.tokenOut.wrapped,
            sorted.length > maxPathsPerTokenPair ? sorted.slice(0, maxPathsPerTokenPair) : sorted,
        );
    }

    private findAllValidTokenPaths({
        tokenIn,
        tokenOut,
        config,
    }: {
        tokenIn: string;
        tokenOut: string;
        config: PathGraphTraversalConfig;
    }): string[][] {
        const results: string[][] = [];
        const queue: { node: string; path: string[] }[] = [{ node: tokenIn, path: [tokenIn] }];

        while (queue.length > 0 && results.length < config.maxTokenPaths) {
            const { node, path } = queue.shift()!;

            const neighbors = this.edges.get(node);
            if (!neighbors) continue;

            for (const [neighbor] of neighbors) {
                // small hot-path optimization: check length bounds before cloning array
                if (path.length + 1 > config.maxDepth) continue;

                // no cycles
                if (path.includes(neighbor)) continue;

                const newPath = [...path, neighbor];

                if (neighbor === tokenOut) {
                    results.push(newPath);
                } else {
                    // push longer path into queue
                    queue.push({ node: neighbor, path: newPath });
                }
            }
        }

        return results;
    }

    private isValidPath({ path, config }: { path: PathGraphEdgeData[]; config: PathGraphTraversalConfig }) {
        const poolIdsInPath = path.map((segment) => segment.pool.id);

        if (config.poolIdsToInclude) {
            for (const poolId of poolIdsInPath) {
                if (!config.poolIdsToInclude.map((id) => id.toLowerCase()).includes(poolId.toLowerCase())) {
                    //path includes a pool that is not allowed for this traversal
                    return false;
                }
            }
        }

        //dont include any path that hops through the same pool twice
        const uniquePools = [...new Set(poolIdsInPath)];
        if (uniquePools.length !== poolIdsInPath.length) {
            return false;
        }

        //dont include any path that has more than maxBuffersInPath buffers
        if (path.filter((segment) => segment.isBuffer).length > config.maxBuffersInPath) {
            return false;
        }

        return true;
    }

    private getIdForPath(path: PathGraphEdgeData[]): string {
        let id = '';

        for (const segment of path) {
            if (id.length > 0) {
                id += '_';
            }

            id += `${segment.pool.id}-${segment.tokenIn}-${segment.tokenOut}`;
        }

        return id;
    }

    private getLimitAmountSwapForPath(path: PathGraphEdgeData[], swapKind: SwapKind): bigint {
        let limit = path[path.length - 1].pool.getLimitAmountSwap(
            path[path.length - 1].tokenIn,
            path[path.length - 1].tokenOut,
            swapKind,
        );

        for (let i = path.length - 2; i >= 0; i--) {
            const poolLimitExactIn = path[i].pool.getLimitAmountSwap(
                path[i].tokenIn,
                path[i].tokenOut,
                SwapKind.GivenIn,
            );
            const poolLimitExactOut = path[i].pool.getLimitAmountSwap(
                path[i].tokenIn,
                path[i].tokenOut,
                SwapKind.GivenOut,
            );

            if (poolLimitExactOut <= limit) {
                limit = poolLimitExactIn;
            } else {
                const pulledLimit = path[i].pool.swapGivenOut(
                    path[i].tokenIn,
                    path[i].tokenOut,
                    TokenAmount.fromRawAmount(path[i].tokenOut, limit),
                ).amount;

                limit = pulledLimit > poolLimitExactIn ? poolLimitExactIn : pulledLimit;
            }
        }

        return limit;
    }

    /**
     * Performs beam search to find optimal token swap paths by exploring combinations of pool liquidity ranks.
     *
     * This method uses a beam search algorithm to efficiently find the best swap paths without exhaustively
     * exploring all possible combinations. The algorithm works by:
     *
     * 1. For each segment in the token path, it considers pools ranked by normalized liquidity
     * 2. It maintains a beam of the best partial path combinations, limited by beam width
     * 3. It uses bottleneck normalized liquidity as the heuristic to rank partial paths
     * 4. Only the most promising candidates are expanded to the next segment
     * 5. Finally, it evaluates the real swap limits only for the top candidates
     *
     * This approach balances exploration of diverse paths with computational efficiency by avoiding
     * expensive full-path limit calculations until the final candidate selection phase.
     */
    private expandTokenPathWithBeamSearch({
        tokenPath,
        swapKind,
        minLimitThreshold,
        approxPathsToReturn,
        config,
    }: {
        tokenPath: string[];
        swapKind: SwapKind;
        minLimitThreshold: bigint;
        approxPathsToReturn: number;
        config: PathGraphTraversalConfig;
    }): PathGraphEdgeData[][] {
        const segmentCount = tokenPath.length - 1;
        if (segmentCount <= 0) return [];

        // Gather candidate edges per segment (already sorted by normalizedLiquidity desc).
        const perSegmentEdges: PathGraphEdgeData[][] = new Array(segmentCount);
        for (let i = 0; i < segmentCount; i++) {
            const edges = this.edges.get(tokenPath[i])?.get(tokenPath[i + 1]);
            if (!edges) return []; // path cannot be built
            perSegmentEdges[i] = edges;
        }

        // Beam search: keep only the top K partial combos by bottleneck normalizedLiquidity
        type Partial = { ranks: number[]; boundNL: bigint };
        let partials: Partial[] = [{ ranks: [], boundNL: 0n }];

        // Make the beam wider than the final number to ensure diversity
        const beamWidth = Math.max(approxPathsToReturn * 2, approxPathsToReturn);

        for (let seg = 0; seg < segmentCount; seg++) {
            const edges = perSegmentEdges[seg];
            const next: Partial[] = [];

            for (const p of partials) {
                for (let r = 0; r < edges.length; r++) {
                    const edge = edges[r];

                    // bottleneck normalizedLiquidity across segments so far
                    const edgeNL = edge.normalizedLiquidity;
                    const newBoundNL = p.boundNL < edgeNL ? p.boundNL : edgeNL;

                    const ranks = p.ranks.length === 0 ? [r] : [...p.ranks, r];
                    next.push({ ranks, boundNL: newBoundNL });
                }
            }

            if (next.length === 0) return [];

            // Keep only the best by bottleneck NL (desc)
            next.sort((a, b) => (a.boundNL < b.boundNL ? 1 : -1));
            partials = next.slice(0, beamWidth);
        }

        // Evaluate real limits only for the finalists and filter by threshold
        // This is the expensive part; we limited it by beamWidth.
        const pathsWithRealLimit: { path: PathGraphEdgeData[]; limit: bigint }[] = [];

        for (const p of partials) {
            try {
                const path = this.expandTokenPathWithRanks({ perSegmentEdges, ranks: p.ranks });
                if (!this.isValidPath({ path, config })) {
                    continue;
                }
                const limit = this.getLimitAmountSwapForPath(path, swapKind);
                if (limit >= minLimitThreshold) {
                    pathsWithRealLimit.push({ path, limit });
                    if (pathsWithRealLimit.length >= approxPathsToReturn) {
                        // We can stop early if we already have enough candidates meeting the threshold.
                        break;
                    }
                }
            } catch {
                // getLimitAmountSwapForPath failed (likely due to trade/wrap amount too small)
                continue;
            }
        }

        return pathsWithRealLimit.map((x) => x.path);
    }

    /**
     * Expands a token path using different liquidity ranks for each segment.
     * This allows exploring all combinations of pool liquidity ranks for different token pairs in a path.
     * @param tokenPath - Array of token addresses representing the path
     * @param ranks - Array of liquidity ranks to use for each segment (must match path length - 1)
     */
    private expandTokenPathWithRanks({
        perSegmentEdges,
        ranks,
    }: {
        perSegmentEdges: PathGraphEdgeData[][];
        ranks: number[];
    }) {
        const segments: PathGraphEdgeData[] = [];

        for (let i = 0; i < perSegmentEdges.length; i++) {
            const edgeChoices = perSegmentEdges[i];
            const rank = ranks[i];
            if (!edgeChoices[rank]) {
                throw new Error('Missing rank on edge for segment');
            }
            segments.push(edgeChoices[rank]);
        }

        return segments;
    }
}
