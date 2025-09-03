import { Address, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathGraphEdgeData, PathGraphTraversalConfig } from './pathGraphTypes';
import { BasePool } from '../poolsV2/basePool';
import { PathLocal } from '../path';

const DEFAULT_MAX_PATHS_PER_TOKEN_PAIR = 10;

export class PathGraphBeam {
    private nodes: Map<string, { isPhantomBpt: boolean }>;
    private edges: Map<string, Map<string, PathGraphEdgeData[]>>;
    private poolAddressMap: Map<string, BasePool>;
    private maxPathsPerTokenPair = DEFAULT_MAX_PATHS_PER_TOKEN_PAIR;

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

    // Add this private cache in the class
    private edgeLimitCache: Map<string, bigint> = new Map();

    // In buildGraph() reset the cache so it doesn't leak across builds
    public buildGraph({
        pools,
        maxPathsPerTokenPair = DEFAULT_MAX_PATHS_PER_TOKEN_PAIR,
        enableAddRemoveLiquidityPaths,
    }: {
        pools: BasePool[];
        maxPathsPerTokenPair?: number;
        enableAddRemoveLiquidityPaths: boolean;
    }) {
        this.poolAddressMap = new Map();
        this.nodes = new Map();
        this.edges = new Map();
        this.edgeLimitCache = new Map(); // <-- reset cache
        this.maxPathsPerTokenPair = maxPathsPerTokenPair;

        this.buildPoolAddressMap(pools);
        this.addAllTokensAsGraphNodes({ pools, enableAddRemoveLiquidityPaths });
        this.addTokenPairsAsGraphEdges({ pools, maxPathsPerTokenPair, enableAddRemoveLiquidityPaths });
    }

    // Small helper for cached per-edge limit (optimistic bound)
    private getEdgeLimitCached(edge: PathGraphEdgeData, swapKind: SwapKind): bigint {
        const key = `${edge.pool.id}|${edge.tokenIn}|${edge.tokenOut}|${swapKind}`;
        let v = this.edgeLimitCache.get(key);
        if (v === undefined) {
            v = edge.pool.getLimitAmountSwap(edge.tokenIn, edge.tokenOut, swapKind);
            this.edgeLimitCache.set(key, v);
        }
        return v;
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
        const isHyperEvm = tokenIn.chainId === 999;

        // apply defaults, allowing caller override whatever they'd like
        const config: PathGraphTraversalConfig = {
            maxDepth: 6,
            maxNonBoostedPathDepth: 3,
            maxNonBoostedHopTokensInBoostedPath: 2,
            maxBuffersInPath: isHyperEvm ? 2 : 5, // limited only on HyperEvm due to gas cost limits on small blocks - virtually unlimited otherwise
            approxPathsToReturn: 20, // Default to 20 - likely won't be reached, but acts as a bound to the computation if needed
            maxRanksPerSegment: 2, // Default 2 for diversity
            minSwapAmountRatio: 0.5, // Default to 50% so we're sure selected paths support splitPath logic
            ...graphTraversalConfig,
        };

        // Calculate minimum limit threshold based on swap amount and ratio
        const minLimitThreshold = (swapAmount.amount * BigInt(Math.floor(config.minSwapAmountRatio * 100))) / 100n;

        const tokenPaths = this.findAllValidTokenPaths({
            token: tokenIn.wrapped,
            tokenIn: tokenIn.wrapped,
            tokenOut: tokenOut.wrapped,
            config,
            tokenPath: [tokenIn.wrapped],
        }).sort((a, b) => (a.length < b.length ? -1 : 1));

        const paths: PathGraphEdgeData[][] = [];
        const selectedPathIds: string[] = [];

        // Use the new greedy best-first approach for each token path
        for (const tokenPath of tokenPaths) {
            const expandedPaths = this.expandTokenPathWithBestRanks({
                tokenPath,
                swapKind,
                minLimitThreshold,
                maxRanksPerSegment: config.maxRanksPerSegment,
                approxPathsToReturn: config.approxPathsToReturn,
            });

            for (const path of expandedPaths) {
                if (this.isValidPath({ path, seenPoolAddresses: [], selectedPathIds, config })) {
                    selectedPathIds.push(this.getIdForPath(path));
                    paths.push(path);
                }
            }
        }

        return this.sortAndFilterPaths(paths).map((path) => {
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

    private sortAndFilterPaths(paths: PathGraphEdgeData[][]): PathGraphEdgeData[][] {
        const pathsWithLimits = paths
            .map((path) => {
                try {
                    const limit = this.getLimitAmountSwapForPath(path, SwapKind.GivenIn);
                    return { path, limit };
                } catch (_e) {
                    console.log('Error getting limit for path', path.map((p) => p.pool.id).join(' -> '));
                    return undefined;
                }
            })
            .filter((path): path is { path: PathGraphEdgeData[]; limit: bigint } => !!path)
            .sort((a, b) => (a.limit < b.limit ? 1 : -1));

        const filtered: PathGraphEdgeData[][] = [];

        // Remove any paths with duplicate pools. since the paths are now sorted by limit,
        // selecting the first path will always be the optimal.
        for (const { path } of pathsWithLimits) {
            let seenPools: string[] = [];
            let isValid = true;

            for (const segment of path) {
                if (seenPools.includes(segment.pool.id)) {
                    isValid = false;
                    break;
                }
            }

            if (isValid) {
                filtered.push(path);
                seenPools = [...seenPools, ...path.map((segment) => segment.pool.id)];
            }
        }

        return filtered;
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
    }: {
        pools: BasePool[];
        maxPathsPerTokenPair: number;
        enableAddRemoveLiquidityPaths: boolean;
    }) {
        for (const pool of pools) {
            const tokens = [...pool.tokens.map((t) => t.token)];
            if (enableAddRemoveLiquidityPaths && pool.poolType !== 'Buffer') {
                tokens.push(new Token(pool.tokens[0].token.chainId, pool.address.toLowerCase() as Address, 18)); // Also consider BPT token pairs
            }
            for (const tokenIn of tokens) {
                for (const tokenOut of tokens) {
                    if (tokenIn === tokenOut) continue;
                    this.addEdge({
                        edgeProps: {
                            pool,
                            tokenIn,
                            tokenOut,
                            normalizedLiquidity: pool.getNormalizedLiquidity(tokenIn, tokenOut),
                            isBuffer: pool.poolType === 'Buffer',
                        },
                        maxPathsPerTokenPair,
                    });
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

        const hasPhantomBpt = tokenInVertex.isPhantomBpt || tokenOutVertex.isPhantomBpt;
        const existingEdges = tokenInNode.get(edgeProps.tokenOut.wrapped) || [];

        //TODO: ideally we don't call sort every time, this isn't performant
        const sorted = [...existingEdges, edgeProps].sort((a, b) =>
            a.normalizedLiquidity > b.normalizedLiquidity ? -1 : 1,
        );

        // TODO: double check if the hasPhantomBpt issue is not affecting v3 liquidity more frequently (considering all
        // pools have their BPT artificially added so we consider them for add/remove liquidity steps)
        tokenInNode.set(
            edgeProps.tokenOut.wrapped,
            sorted.length > maxPathsPerTokenPair && !hasPhantomBpt ? sorted.slice(0, maxPathsPerTokenPair) : sorted,
        );
    }

    private findAllValidTokenPaths(args: {
        token: string;
        tokenIn: string;
        tokenOut: string;
        tokenPath: string[]; // unused in refactor; we always start from tokenIn
        config: PathGraphTraversalConfig;
    }): string[][] {
        const { tokenIn, tokenOut, config } = args;

        const results: string[][] = [];
        if (tokenIn === tokenOut) return [[tokenIn]];

        // State tracked incrementally to avoid rescanning the whole path
        const path: string[] = [tokenIn];
        const visited = new Set<string>([tokenIn]);

        // We use an iterative DFS (non-recursive) for performance.
        // Ordering doesn’t matter since caller sorts by length later.
        type Frame = {
            token: string;
            iter: IterableIterator<[string, PathGraphEdgeData[]]>;
            isBoosted: boolean;
            numStandardHopTokens: number;
        };

        const startNeighbors = this.edges.get(tokenIn)?.entries() ?? new Map<string, PathGraphEdgeData[]>().entries();
        let current: Frame = {
            token: tokenIn,
            iter: startNeighbors,
            isBoosted: this.poolAddressMap.has(tokenIn),
            numStandardHopTokens: 0,
        };
        const stack: Frame[] = [];

        // Respect the "approxPathsToReturn" as an upper bound (per docs).
        const maxTokenPaths = Math.max(1, config.approxPathsToReturn);

        outer: while (true) {
            const step = current.iter.next();

            if (step.done) {
                // backtrack
                if (stack.length === 0) break;
                const lastNode = path.pop()!;
                visited.delete(lastNode);
                current = stack.pop()!;
                continue;
            }

            const neighbor = step.value[0];

            // No revisiting the same token
            if (visited.has(neighbor)) continue;

            const nextDepth = path.length + 1;
            if (nextDepth > config.maxDepth) continue;

            const neighborIsPhantom = this.poolAddressMap.has(neighbor);
            const nextIsBoosted = current.isBoosted || neighborIsPhantom;

            // Count hop tokens excluding endpoints
            const isHopToken = neighbor !== tokenIn && neighbor !== tokenOut;
            const nextNumStandardHopTokens = current.numStandardHopTokens + (isHopToken && !neighborIsPhantom ? 1 : 0);

            // Prune using the same rules as isValidTokenPath but incrementally
            if (nextIsBoosted && nextNumStandardHopTokens > config.maxNonBoostedHopTokensInBoostedPath) continue;

            if (
                nextDepth > config.maxNonBoostedPathDepth &&
                nextNumStandardHopTokens > config.maxNonBoostedHopTokensInBoostedPath
            ) {
                continue;
            }

            if (neighbor === tokenOut) {
                // Complete path checks
                if (!nextIsBoosted && nextDepth > config.maxNonBoostedPathDepth) continue;
                results.push([...path, neighbor]);
                if (results.length >= maxTokenPaths) break outer;
                continue;
            }

            // Go deeper
            path.push(neighbor);
            visited.add(neighbor);

            // Save current frame and descend
            stack.push(current);
            current = {
                token: neighbor,
                iter: this.edges.get(neighbor)?.entries() ?? new Map<string, PathGraphEdgeData[]>().entries(),
                isBoosted: nextIsBoosted,
                numStandardHopTokens: nextNumStandardHopTokens,
            };
        }

        return results;
    }

    private isValidPath({
        path,
        seenPoolAddresses,
        selectedPathIds,
        config,
    }: {
        path: PathGraphEdgeData[];
        seenPoolAddresses: string[];
        selectedPathIds: string[];
        config: PathGraphTraversalConfig;
    }) {
        const poolIdsInPath = path.map((segment) => segment.pool.id);
        const uniquePools = [...new Set(poolIdsInPath)];

        if (config.poolIdsToInclude) {
            for (const poolId of poolIdsInPath) {
                if (!config.poolIdsToInclude.map((id) => id.toLowerCase()).includes(poolId.toLowerCase())) {
                    //path includes a pool that is not allowed for this traversal
                    return false;
                }
            }
        }

        //dont include any path that hops through the same pool twice
        if (uniquePools.length !== poolIdsInPath.length) {
            return false;
        }

        for (const segment of path) {
            if (seenPoolAddresses.includes(segment.pool.address)) {
                //this path contains a pool that has already been used
                return false;
            }
        }

        //this is a duplicate path
        if (selectedPathIds.includes(this.getIdForPath(path))) {
            return false;
        }

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
        maxRanksPerSegment,
        approxPathsToReturn,
    }: {
        tokenPath: string[];
        swapKind: SwapKind;
        minLimitThreshold: bigint;
        maxRanksPerSegment: number;
        approxPathsToReturn: number;
    }): PathGraphEdgeData[][] {
        const segmentCount = tokenPath.length - 1;
        if (segmentCount <= 0) return [];

        // Gather candidate edges per segment (already sorted by normalizedLiquidity desc).
        const perSegmentEdges: PathGraphEdgeData[][] = new Array(segmentCount);
        for (let i = 0; i < segmentCount; i++) {
            const edges = this.edges.get(tokenPath[i])?.get(tokenPath[i + 1]) ?? [];
            if (edges.length === 0) return []; // path cannot be built
            // Limit choices per segment
            perSegmentEdges[i] = edges.slice(0, Math.min(edges.length, maxRanksPerSegment, this.maxPathsPerTokenPair));
        }

        // Precompute optimistic bound per candidate edge (cached)
        const perSegmentEdgeBounds: bigint[][] = perSegmentEdges.map((edges) =>
            edges.map((e) => this.getEdgeLimitCached(e, swapKind)),
        );

        // Beam search: keep only the top K partial combos by optimistic bound
        type Partial = { ranks: number[]; bound: bigint };
        let partials: Partial[] = [{ ranks: [], bound: 0n }]; // bound will be set on first expansion

        // Make the beam wider than the final number to ensure diversity
        const beamWidth = Math.max(approxPathsToReturn * 3, approxPathsToReturn);

        for (let seg = 0; seg < segmentCount; seg++) {
            const edges = perSegmentEdges[seg];
            const bounds = perSegmentEdgeBounds[seg];
            const next: Partial[] = [];

            for (const p of partials) {
                for (let r = 0; r < edges.length; r++) {
                    // optimistic bound for extended partial is min of previous bound and this edge bound
                    const newBound = p.ranks.length === 0 ? bounds[r] : bounds[r] < p.bound ? bounds[r] : p.bound;

                    // Early prune by minLimitThreshold
                    if (newBound < minLimitThreshold) continue;

                    const ranks = p.ranks.length === 0 ? [r] : [...p.ranks, r];
                    next.push({ ranks, bound: newBound });
                }
            }

            if (next.length === 0) return [];

            // Keep only the best by optimistic bound (desc)
            next.sort((a, b) => (a.bound < b.bound ? 1 : -1));
            partials = next.slice(0, beamWidth);
        }

        // Evaluate real limits only for the finalists and filter by threshold
        // This is the expensive part; we limited it by beamWidth.
        const pathsWithRealLimit: { path: PathGraphEdgeData[]; limit: bigint }[] = [];
        const seenCombos = new Set<string>();

        for (const p of partials) {
            const key = p.ranks.join(',');
            if (seenCombos.has(key)) continue;
            seenCombos.add(key);

            try {
                const path = this.expandTokenPathWithRanks({ tokenPath, ranks: p.ranks });
                const limit = this.getLimitAmountSwapForPath(path, swapKind);
                if (limit >= minLimitThreshold) {
                    pathsWithRealLimit.push({ path, limit });
                    if (pathsWithRealLimit.length >= approxPathsToReturn) {
                        // We can stop early if we already have enough
                        // candidates meeting the threshold.
                        // We will still sort below for determinism.
                        // This keeps CPU in check on large graphs.
                        break;
                    }
                }
            } catch {
                // Missing rank or edge; skip
                continue;
            }
        }

        if (pathsWithRealLimit.length === 0) return [];

        // Return top approxPathsToReturn by real limit
        pathsWithRealLimit.sort((a, b) => (a.limit < b.limit ? 1 : -1));
        return pathsWithRealLimit.slice(0, approxPathsToReturn).map((x) => x.path);
    }

    /**
     * Expands a token path using different liquidity ranks for each segment.
     * This allows exploring all combinations of pool liquidity ranks for different token pairs in a path.
     * @param tokenPath - Array of token addresses representing the path
     * @param ranks - Array of liquidity ranks to use for each segment (must match path length - 1)
     */
    private expandTokenPathWithRanks({ tokenPath, ranks }: { tokenPath: string[]; ranks: number[] }) {
        const segments: PathGraphEdgeData[] = [];

        for (let i = 0; i < tokenPath.length - 1; i++) {
            const edge = this.edges.get(tokenPath[i])?.get(tokenPath[i + 1]);

            if (!edge || edge.length === 0) {
                throw new Error(`Missing edge for pair ${tokenPath[i]} -> ${tokenPath[i + 1]}`);
            }

            const rank = ranks[i];

            if (!edge[rank]) {
                throw new Error(`Missing rank ${rank} on edge for pair ${tokenPath[i]} -> ${tokenPath[i + 1]}`);
            }

            segments.push(edge[rank]);
        }

        return segments;
    }
}
