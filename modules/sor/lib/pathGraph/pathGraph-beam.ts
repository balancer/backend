import { Address, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathGraphEdgeData, PathGraphTraversalConfig } from './pathGraphTypes';
import { BasePool } from '../poolsV2/basePool';
import { PathLocal } from '../path';
import { formatUnits } from 'viem';

const DEFAULT_MAX_PATHS_PER_TOKEN_PAIR = 4;

export class PathGraphBeam {
    private nodes: Map<string, { isPhantomBpt: boolean }>;
    private edges: Map<string, Map<string, PathGraphEdgeData[]>>;
    private poolAddressMap: Map<string, BasePool>;

    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.poolAddressMap = new Map();
    }

    // We build a directed graph for all pools.
    // Nodes are tokens and edges are triads: [pool.id, tokenIn, tokenOut].
    // The current criterion for including a pool path into this graph is the following:
    // (a) We include every path that includes a phantom BPT.
    // (b) For any token pair x -> y, we include only the most liquid ${maxPathsPerTokenPair}
    // pool pairs (default 2).

    // In buildGraph() reset the cache so it doesn't leak across builds
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
        swapKind?: SwapKind;
        tokenPrices?: Map<string, number>;
        minLimitThresholdUSD?: number;
    }) {
        this.poolAddressMap = new Map();
        this.nodes = new Map();
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
    // (a) maxDepth - the max depth of the traversal (length of token path), defaults to 7.
    // (b) maxNonBoostedPathDepth - the max depth for any path that does not contain a phantom bpt.
    // (c) maxNonBoostedHopTokensInBoostedPath - The max number of non boosted hop tokens
    // allowed in a boosted path.
    // (d) approxPathsToReturn - search for up to this many paths. Since all paths for a single traversal
    // are added, its possible that the amount returned is larger than this number.
    // (e) poolIdsToInclude - Only include paths with these poolIds (optional)

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
        // early checks
        const hasEdgeWithTokenIn = this.edges.has(tokenIn.wrapped);
        const hasEdgeWithTokenOut = this.edges.has(tokenOut.wrapped);
        if (!hasEdgeWithTokenIn || !hasEdgeWithTokenOut) {
            return [];
        }

        const isHyperEvm = tokenIn.chainId === 999;

        // apply defaults, allowing caller override whatever they'd like
        const config: PathGraphTraversalConfig = {
            maxDepth: 4,
            maxTokenPaths: 50,
            maxBuffersInPath: isHyperEvm ? 2 : 5, // limited only on HyperEvm due to gas cost limits on small blocks - virtually unlimited otherwise
            approxPathsToReturn: 20, // Default to 20 - likely won't be reached, but acts as a bound to the computation if needed
            maxRanksPerSegment: 2, // Default 2 for diversity
            minSwapAmountRatio: 0.5, // Default to 50% so we're sure selected paths support splitPath logic
            ...graphTraversalConfig,
        };

        // Calculate minimum limit threshold based on swap amount and ratio
        const minLimitThreshold = (swapAmount.amount * BigInt(Math.floor(config.minSwapAmountRatio * 100))) / 100n;

        // time findAllValidTokenPaths
        const findAllValidTokenPathsStart = performance.now();
        const tokenPaths = this.findAllValidTokenPaths({
            tokenIn: tokenIn.wrapped,
            tokenOut: tokenOut.wrapped,
            config,
        });
        const findAllValidTokenPathsEnd = performance.now();
        console.log(
            `SOR:findAllValidTokenPaths: ${(findAllValidTokenPathsEnd - findAllValidTokenPathsStart).toFixed(2)}ms`,
        );
        console.log('tokenPaths found -> ', tokenPaths.length);

        const paths: PathGraphEdgeData[][] = [];

        // Use the new greedy best-first approach for each token path
        const expandTokenPathWithBestRanksStart = performance.now();
        for (const tokenPath of tokenPaths) {
            const expandedPaths = this.expandTokenPathWithBestRanks({
                tokenPath,
                swapKind,
                minLimitThreshold,
                approxPathsToReturn: config.approxPathsToReturn,
                config,
            });

            for (const path of expandedPaths) {
                paths.push(path);
            }
        }
        const expandTokenPathWithBestRanksEnd = performance.now();
        console.log(
            `SOR:expandTokenPathWithBestRanks: ${(
                expandTokenPathWithBestRanksEnd - expandTokenPathWithBestRanksStart
            ).toFixed(2)}ms`,
        );

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

    private addNode(token: Token): void {
        this.nodes.set(token.wrapped, {
            isPhantomBpt: !!this.poolAddressMap.get(token.wrapped),
        });

        if (!this.edges.has(token.wrapped)) {
            this.edges.set(token.wrapped, new Map());
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
        const tokenInVertex = this.nodes.get(edgeProps.tokenIn.wrapped);
        const tokenOutVertex = this.nodes.get(edgeProps.tokenOut.wrapped);
        const tokenInNode = this.edges.get(edgeProps.tokenIn.wrapped);

        if (!tokenInVertex || !tokenOutVertex || !tokenInNode) {
            throw new Error('Attempting to add invalid edge');
        }

        const existingEdges = tokenInNode.get(edgeProps.tokenOut.wrapped) || [];

        //TODO: ideally we don't call sort every time, this isn't performant
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

    // please add a description to how this function works internally
    /**
     * Calculates the maximum feasible swap size for a given path.
     * @param path - The path to calculate the limit for.
     * @param swapKind - The type of swap to calculate the limit for.
     * @returns The maximum feasible swap size for the path.
     *
     * This function works by starting with the last segment of the path and working backwards.
     * It calculates the limit for the last segment using the getLimitAmountSwap method.
     * Then, it iterates through the remaining segments, calculating the limit for each segment.
     * The limit for each segment is the minimum of the limit for the previous segment and the limit for the current segment.
     * If the limit for the current segment is greater than the limit for the previous segment, it means that the current segment is the bottleneck.
     * In this case, the function calculates the limit for the current segment by pulling the limit from the previous segment.
     * The function returns the limit for the first segment.
     *
     * This function is used to calculate the limit for a given path.
     * The limit is used to determine if a path is valid.
     * The limit is also used to determine the best path to use.
     *
     *
     */
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
     * Expands a token path using a greedy best-first approach with early limit checking.
     * Instead of exploring all rank combinations, this prioritizes highest liquidity options
     * and stops when paths meet the minimum limit threshold.
     */
    /**
     * Beam-search over ranks per segment.
     * - Precompute a cheap optimistic bound per edge using getLimitAmountSwap (cached).
     * - Expand only top candidates by that bound before evaluating expensive full-path limit.
     * - Keeps at most approxPathsToReturn candidates throughout.
     */
    private expandTokenPathWithBestRanks({
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
