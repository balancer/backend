Here’s a structured deep-dive into what your PathGraph does, the architecture and algorithms at play, and where I’d tune it for correctness, performance, and maintainability.

Overview

-   Purpose: Build a directed token graph from pools and enumerate candidate swap paths between tokenIn → tokenOut. Then, for each token path, choose concrete pools per hop using a greedy, rank-based search, pruning by pool limits and config constraints.
-   Output: A set of PathLocal objects representing viable routes (token sequence + pool sequence + buffer flags), ready for a higher-level optimizer to decide splits.

Architecture and data model

-   Core data structures
    -   nodes: Map<string, { isPhantomBpt: boolean }>
        -   Keyed by token address (.wrapped). Marks tokens that are pool BPTs (isPhantomBpt).
    -   edges: Map<string, Map<string, PathGraphEdgeData[]>>
        -   Adjacency list. For each tokenIn, a map of tokenOut → a sorted array of candidate edges by normalizedLiquidity (top N per pair).
        -   PathGraphEdgeData contains: pool, tokenIn, tokenOut, normalizedLiquidity, isBuffer.
    -   poolAddressMap: Map<string, BasePool> for quick pool lookup by address.
-   Build phases
    1. Pool index: buildPoolAddressMap(pools)
    2. Nodes: addAllTokensAsGraphNodes
        - Optionally adds pool BPT tokens (enableAddRemoveLiquidityPaths).
    3. Edges: addTokenPairsAsGraphEdges
        - For each (tokenIn, tokenOut) pair within a pool, add an edge ranked by normalizedLiquidity.
        - Enforces per-pair cap maxPathsPerTokenPair, except when pool BPT is involved (isPhantomBpt).
-   Search phases
    1. Find all valid token paths (sequence of token addresses) honoring constraints (depth, boosted/non-boosted).
    2. For each token path, choose pool edges per hop via rank-search:
        - expandTokenPathWithBestRanks prioritizes higher-liquidity ranks first, checks path-level limit early, and prunes.

Key algorithms and where they’re used

1. Graph building

    - Edge ranking: “Top-K by normalizedLiquidity” per token pair. Internally, edges are kept sorted descending.
    - Phantom/BPT handling: Edges that involve a BPT token can bypass the Top-K cap to avoid pruning boosted paths.

2. Token path discovery

    - traverseBfs: Despite the name, this is actually a depth-first recursive traversal (DFS), not BFS.
    - Pruning rules inside isValidTokenPath:
        - Max length (maxDepth).
        - Non-boosted path depth cap (maxNonBoostedPathDepth).
        - If the path includes any pool BPT tokens (“boosted”), restrict number of non-boosted hops (maxNonBoostedHopTokensInBoostedPath).
        - No token revisited (checked before recursing).

3. Pool rank combination for a token path

    - expandTokenPathWithBestRanks:
        - Treats each hop as having “ranks” 0..(k-1) by liquidity.
        - Explores rank combinations via a queue of rank vectors (ranks[]), starting with all zeros (highest liquidity everywhere).
        - For each rank vector:
            - Build the concrete path (expandTokenPathWithRanks).
            - Compute path limit (getLimitAmountSwapForPath) and keep it if it clears minLimitThreshold.
            - Tracks “finalRanks” per segment as a stopping criterion to cap how many ranks you consider per segment (maxRanksPerSegment).
        - Adds new candidates by incrementing one segment’s rank at a time (addAlternativeRanks).

4. Capacity/limit computation for a path

    - getLimitAmountSwapForPath
        - Walk backward from the last hop to the first to compute the maximum feasible swap size for the whole path.
        - For an intermediate hop, compares GivenOut and GivenIn limits, and if needed, calls swapGivenOut to “pull” the input required for the downstream cap.
        - This effectively propagates the tightest capacity back to the path’s input.

5. Final filtering
    - sortAndFilterPaths:
        - Computes per-path limit, sorts descending by limit.
        - Attempts to remove paths that reuse any pool across the final selection and ensures no pool repeats within a path.

Correctness notes and potential bugs

-   traverseBfs is DFS

    -   The function name is misleading. Either rename it to traverseDfs or implement a real BFS with a queue.

-   sortAndFilterPaths “seenPools” scoping bug

    -   The code resets seenPools to [] for every path in the loop, so you’re not actually preventing pool reuse across different selected paths.
    -   Fix by keeping a Set outside the loop.
    -   Suggested fix:

        ```ts
        private sortAndFilterPaths(paths: PathGraphEdgeData[][]): PathGraphEdgeData[][] {
          const pathsWithLimits = paths
            .map((path) => {
              try {
                const limit = this.getLimitAmountSwapForPath(path, SwapKind.GivenIn);
                return { path, limit };
              } catch {
                return undefined;
              }
            })
            .filter((x): x is { path: PathGraphEdgeData[]; limit: bigint } => !!x)
            .sort((a, b) => (a.limit < b.limit ? 1 : -1));

          const filtered: PathGraphEdgeData[][] = [];
          const usedPools = new Set<string>(); // persist across selections

          for (const { path } of pathsWithLimits) {
            const pools = path.map((s) => s.pool.id);

            // reject if path uses same pool twice
            if (new Set(pools).size !== pools.length) continue;

            // reject if any pool already used by a previously selected path
            if (pools.some((p) => usedPools.has(p))) continue;

            filtered.push(path);
            pools.forEach((p) => usedPools.add(p));
          }

          return filtered;
        }
        ```

-   isValidPath’s seenPoolAddresses is always []

    -   In getCandidatePaths you pass seenPoolAddresses: [] and never update it, so that check never filters anything. Either remove this parameter or wire it up properly.

-   getConnectedVertices return type mix

    -   It does const edges = this.edges.get(tokenAddress) || []; then for (const [otherToken] of edges).
    -   If edges is [], that loop is fine (no iterations), but the type is off and brittle.
    -   Prefer:
        ```ts
        private getConnectedVertices(tokenAddress: string): string[] {
          const edges = this.edges.get(tokenAddress);
          if (!edges) return [];
          return Array.from(edges.keys());
        }
        ```

-   BPT/phantom detection inconsistency

    -   nodes.set(... isPhantomBpt: !!this.poolAddressMap.get(token.wrapped)).
    -   isValidTokenPath uses poolAddressMap.has(token) to detect “boosted.”
    -   Consider using nodes.get(token).isPhantomBpt consistently, and differentiate “isBpt” from “isPhantomBpt” if you only want to bypass caps for phantom BPTs.

-   expandTokenPathWithBestRanks control flow with exceptions

    -   The code uses try/catch to detect missing ranks (edge[rank] undefined). This is control-flow via exceptions and will be costly.
    -   Pre-check rank existence before enqueuing:
        ```ts
        // when pushing a newRanks candidate
        const edgeCount = this.edges.get(tokenPath[segmentIndex])?.get(tokenPath[segmentIndex + 1])?.length ?? 0;
        if (currentRank + 1 < edgeCount) {
            // enqueue safely
        }
        ```

-   finalRanks logic is fragile
    -   It assumes segments are finalized in order (currentFinalRankIndex = finalRanks.length), which may not correlate to which segment’s ranks you’ve actually explored sufficiently.
    -   Track per-segment state explicitly.

Performance characteristics and complexity

-   Graph building
    -   addEdge sorts the edge array on every insertion (O(k log k)), where k ≤ maxPathsPerTokenPair. With many pools it adds up.
-   Token path enumeration
    -   Exponential in the worst case, bounded by:
        -   maxDepth
        -   maxNonBoostedPathDepth
        -   boosted constraints
        -   top-K edges per pair in graph construction
-   Rank combination search
    -   For a token path of length L, worst case explores up to min(maxRanksPerSegment, K)^L combinations (with pruning).
    -   Each combination calls getLimitAmountSwapForPath, which is O(L) but involves BasePool computations per hop.

Concrete improvements

1. Fix correctness issues

-   Rename traverseBfs → traverseDfs or implement BFS with a queue.
-   Fix seenPools scoping bug in sortAndFilterPaths (see code above).
-   Remove dead “seenPoolAddresses” parameter or make it effective (e.g., keep a Set across selection).
-   Use nodes.get(token).isPhantomBpt consistently for boosted detection; optionally add a separate isBpt flag.

2. Reduce sorting/insertion overhead when building edges

-   Instead of sorting on every insertion:
    -   Maintain a small “top-k” structure per pair:
        ```ts
        // Pseudo approach:
        const arr = tokenInNode.get(tokenOut) ?? [];
        insertIntoTopK(arr, edgeProps, k); // binary insert into sorted fixed-size array
        tokenInNode.set(tokenOut, arr);
        ```
    -   Or batch edges per pair, then sort once and slice to k after processing all pools.

3. Avoid exception-driven flow in expandTokenPathWithBestRanks

-   Do not enqueue rank vectors that reference non-existent ranks. You can precompute edge counts for each segment and bound ranks accordingly.

4. Make rank exploration more principled

-   Use a priority queue (best-first) keyed by a heuristic. Examples:
    -   Upper bound on path capacity: min of per-segment GivenIn capacity (fast to compute).
    -   Or min(normalizedLiquidity) across segments as a cheap proxy.
-   Replace finalRanks with per-segment caps tracked explicitly:

    ```ts
    const perSegmentMaxExploredRank = Array(numSegments).fill(-1);
    const perSegmentUniqueRanks = Array.from({ length: numSegments }, () => new Set<number>());

    // When accepting a path:
    ranks.forEach((r, i) => {
        perSegmentUniqueRanks[i].add(r);
        if (perSegmentUniqueRanks[i].size >= maxRanksPerSegment) {
            perSegmentMaxExploredRank[i] = Math.max(perSegmentMaxExploredRank[i], r);
        }
    });

    // When enqueuing rank alternatives:
    if (ranks[i] + 1 < Math.min(edgeCount[i], perSegmentMaxExploredRank[i] + 1 || Infinity)) {
        // enqueue
    }
    ```

5. Cache pool-level limits used inside getLimitAmountSwapForPath

-   Per search call, memoize for each edge:
    -   poolLimitExactIn = pool.getLimitAmountSwap(GivenIn)
    -   poolLimitExactOut = pool.getLimitAmountSwap(GivenOut)
-   This reduces repeated calls when evaluating many rank combinations for the same segments.
    ```ts
    const limitCache = new Map<string, { in: bigint; out: bigint }>();
    const key = `${pool.id}-${tokenIn}-${tokenOut}`;
    // fetch or compute once
    ```

6. Improve token path enumeration

-   If you really want BFS behavior (shortest paths first), use a queue and layer-by-layer expansion. It often yields better early exits if you limit approxPathsToReturn.
-   Additional pruning heuristics:
    -   Early stop if the best possible edgeCount across remaining segments can’t reach minLimitThreshold (needs a simple upper-bound function).
    -   Optional whitelist of “core” tokens to reduce the branching factor.

7. Use Sets for membership checks and IDs

-   selectedPathIds can be a Set<string> instead of an array for O(1) membership.
-   During path validation, use Sets for pools/tokens to avoid repeated O(n) includes checks.

8. Ratio arithmetic to BigInt

-   minLimitThreshold uses floor(minSwapAmountRatio \* 100) / 100n. This loses precision for ratios not aligned to 1/100.
-   Use basis points or bps×1e4:
    ```ts
    // e.g., if using 10_000 bps scaling
    const bps = Math.round(config.minSwapAmountRatio * 10_000);
    const minLimitThreshold = (swapAmount.amount * BigInt(bps)) / 10_000n;
    ```

9. Separate “isBPT” vs “isPhantomBPT”

-   Your TODO suggests concern about v3. Track both flags:
    -   isBpt: token address equals a pool address (BPT token node)
    -   isPhantomBpt: specifically phantom
-   Use isPhantomBpt only to bypass Top-K pruning. Use isBpt to apply boosted constraints.

10. Observability

-   Replace console.log in the catch with a debug logger and include pool/path IDs.
-   Count/emit metrics: number of token paths explored, rank combos tried, pruned by limit, etc.

Small code nits

-   getConnectedVertices: return Array.from(map.keys()) as noted.
-   addAlternativeRanks: bound by the actual edge counts per segment instead of this.maxPathsPerTokenPair.
-   In getCandidatePaths, consider wiring an overall cap (e.g., stop once you’ve gathered enough qualified paths globally, not just per token path).

What algorithms you’re effectively using

-   Graph modeling + constrained DFS for simple paths (no repeated tokens).
-   Top-K per pair edge reduction using normalizedLiquidity.
-   Greedy/best-first-ish local search over rank combinations, with pruning by:
    -   Early capacity limit check (minLimitThreshold)
    -   Diversity cap per segment (maxRanksPerSegment)
-   Backward limit propagation along a path to determine feasible swap size.

When to consider heavier graph algorithms

-   If you need more principled “best K simple paths” at the token level, consider:
    -   Yen’s algorithm (K-shortest simple paths)
    -   Eppstein’s algorithm (K-shortest paths efficiently)
-   You’d still need to layer on pool-rank selection per hop, but token-level path enumeration would be more controlled and optimal.

Summary of high-impact changes

-   Fix sortAndFilterPaths pooled dedupe bug (Set outside loop).
-   Make rank exploration safer (no exceptions, correct per-segment caps).
-   Use Sets for selectedPathIds and validation membership.
-   Reduce sort-on-insert overhead for edges (top-K maintenance).
-   Add caching for pool limits during limit propagation.
-   Rename traverseBfs or implement proper BFS for clarity and potential early termination benefits.
-   Improve precision for minLimitThreshold computation.

If you want, I can sketch a refactor of expandTokenPathWithBestRanks using a priority queue and per-segment caps, or a batched top-K edge construction that avoids sorting each time.
