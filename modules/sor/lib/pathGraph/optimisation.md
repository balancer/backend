Here’s a drop-in refactor that makes token-path search and rank expansion much faster, without changing your public API. It removes recursion, minimizes array copies, incrementally tracks constraints, and uses a beam-search to prune rank combinations early using cheap per-edge limits.

What you get

-   Non-recursive, allocation-light token-path search (iterative DFS with incremental constraints).
-   Early bounding using approxPathsToReturn (as your docs suggest).
-   Beam search for rank expansion:
    -   Precomputes and caches per-edge swap limits (cheap optimistic bound).
    -   Prunes combinations aggressively before running expensive getLimitAmountSwapForPath.
    -   Returns the top candidates meeting the minLimitThreshold.

Code changes

1. Add a small cache for per-edge limits (used by the new beam search).
2. Replace findAllValidTokenPaths with an iterative search that’s faster and honors approxPathsToReturn.
3. Replace expandTokenPathWithBestRanks with a beam search that uses cached, optimistic bounds.

You can paste these changes into your class. Comments explain the logic.

```ts
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
```

Replace findAllValidTokenPaths with this (iterative, allocation-light)

```ts
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
```

Replace expandTokenPathWithBestRanks with a fast beam search

```ts
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
```

Why this is faster

-   No recursion or repeated array copies in token-path search; we push/pop on a single shared path and visited set.
-   Incremental constraint tracking avoids O(len(path)) scans on each step.
-   Early stop based on approxPathsToReturn (as your comments suggest) keeps the search bounded.
-   Beam search on ranks uses cached per-edge limits to prune aggressively before running the expensive full-path limit calculation.
-   At most approxPathsToReturn full getLimitAmountSwapForPath evaluations per token path, instead of exploring all rank combinations.

Optional micro-optimizations

-   If you want even less GC pressure, switch visited to a bitset by indexing tokens, but that’s a larger refactor (you’d assign an integer index to each token once in buildGraph and use a Uint8Array or BigInt bitmask).
-   You can nudge beamWidth up or down depending on how much diversity you want versus speed.

If you want, I can wire a small benchmark harness around getCandidatePaths to measure the speedups against your pool sizes and typical configurations.
