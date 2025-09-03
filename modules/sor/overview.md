## Walkthrough

Here’s a layered walkthrough of what this code is doing and how the main algorithms fit together, from pool ingestion all the way to picking final split routes.

### High-level pipeline

-   SOR.getPathsWithPools: Ingests pools from DB, normalizes them into in-memory pool models, and calls the Router.
-   Router.getCandidatePaths: Builds a token–pool graph and searches for feasible token paths using bounded graph traversal + greedy edge-ranking.
-   Router.getBestPaths: Quotes candidate paths at multiple size splits (25/50/75/100%), keeps only promising/non-overlapping ones, and picks the best split combination.
-   Returns: A set of PathWithAmount objects that maximize output (GivenIn) or minimize input (GivenOut), possibly split across two paths.

#### Layer 1 — Pool ingestion & normalization (SOR)

-   Source: SOR.getPathsWithPools
-   What it does:
    -   Validates inputs and sets a “current time” (for pools with time-dependent state such as LBP or ReClamm).
    -   Converts PrismaPool entries into in-memory BasePool subclasses (Weighted, Stable/Composable, Gyro, FX, Quant, ReClamm, v3 variants, etc.). Skips unsupported/misconfigured pools.
    -   For protocol v3, also adds Buffer pools (used to connect fragmented liquidity segments).
    -   Chooses a PathGraph implementation version (original/beam/bfs) and delegates to Router.
-   Why: Separate I/O/domain data from routing logic. The rest of the system only sees BasePool interfaces with consistent methods (getNormalizedLiquidity, getLimitAmountSwap, swapGivenOut, etc.).

#### Layer 2 — Graph building (PathGraph.buildGraph)

-   Nodes: Tokens (by wrapped address). Phantom BPTs are also represented as token nodes if add/remove-liquidity paths are enabled.
-   Edges: Directed edges from tokenIn → tokenOut labeled with:
    -   pool (the BasePool connector)
    -   tokenIn, tokenOut
    -   normalizedLiquidity (used to rank edges per pair)
    -   isBuffer (true for buffer pools)
-   Edge curation (per token pair):
    -   For each pair, sort candidate pool edges by normalizedLiquidity.
    -   Keep only the top K (maxPathsPerTokenPair, default 10), except if either end is a phantom BPT—then include all to preserve boosted/add-liquidity routes.
-   Why: This prunes the search space early and encodes “best connectors first,” which the traversal/expansion later exploits.

#### Layer 3 — Token-path search (findAllValidTokenPaths)

-   Method: traverseBfs (despite the name, it’s recursive depth-first over neighbors with BFS-like constraints).
-   Constraints (PathGraphTraversalConfig, with sensible defaults):
    -   maxDepth: cap on hops, default 6.
    -   maxNonBoostedPathDepth: stricter cap if the path has no phantom BPT, default 3.
    -   maxNonBoostedHopTokensInBoostedPath: limits how many non-boosted hops can be in a “boosted” path.
    -   poolIdsToInclude: optional allowlist to restrict traversal.
    -   maxBuffersInPath: limits the number of Buffer pools in a path (tighter on HyperEvm).
-   Validity rules for token paths (before choosing the exact pool per hop):
    -   No repeated token visits.
    -   Respect the boosted/non-boosted depth rules above.
-   Output: A set of token-address sequences [t0, t1, ..., tn] from tokenIn to tokenOut that satisfy the high-level constraints.
-   Why: Separate “which tokens could we traverse through?” from “which specific pool edges should we pick for each token hop?”

#### Layer 4 — Greedy edge selection per token path (expandTokenPathWithBestRanks)

-   Goal: For a given token path [t0 → t1 → ... → tn], choose the best pool per hop (edge) quickly without exploring the full combinatorial space.
-   Edge ranking: Each hop has a ranked list of candidate edges (rank 0 = highest normalizedLiquidity).
-   Algorithm:
    -   Start with ranks = [0, 0, ..., 0] (the highest-liquidity edge at every hop).
    -   Expand combinations by incrementing ranks per segment (locally), but:
        -   Early prune using a per-path capacity test: compute the path’s limit amount (see next bullet) and drop if it’s less than minLimitThreshold.
        -   Lock segments once enough distinct ranks for that segment have produced acceptable paths or when ranks exceed available edges. This is tracked using finalRanks and maxRanksPerSegment (default 2).
    -   Keep going until approxPathsToReturn (default 20) or the queue is exhausted.
-   Path capacity test (getLimitAmountSwapForPath):
    -   Compute the path’s maximum feasible swap size, accounting for pool-specific limits per hop.
    -   Done backwards:
        -   Start from the last hop’s limit for the requested swapKind (GivenIn or GivenOut).
        -   For each preceding hop, pull back the limit either by using pool limits or by simulating swapGivenOut to determine how much input is needed to produce the downstream limit, then cap by pool’s GivenIn limit.
-   minLimitThreshold: A quick heuristic bound to reduce noise:
    -   minLimitThreshold = swapAmount \* minSwapAmountRatio (default ~50%)
    -   Paths must be able to handle at least that fraction of the request to be considered during greedy expansion.
-   Why: Liquidity-ranked greedy selection plus capacity pruning finds strong candidates fast without full-blown exponential exploration.

#### Layer 5 — Path validity and final filtering (sortAndFilterPaths, isValidPath)

-   Validate:
    -   No pool is used twice inside a path.
    -   Not already selected (by a composite path ID built from pool+tokenIn+tokenOut).
    -   Respect maxBuffersInPath from config.
    -   If poolIdsToInclude is set, ensure every hop uses an allowed pool.
-   Rank/sort:
    -   Compute each path’s limit (GivenIn) and sort descending by that limit.
    -   Deduplicate by ID and keep uniqueness again.
-   Output: PathLocal objects, which carry the token sequence, the chosen pools per hop, and buffer flags per hop.
-   Why: Ensure uniqueness, feasibility, and prioritize the most “capable” paths.

#### Layer 6 — Quoting and split-route selection (Router.getBestPaths)

-   Input: Candidate PathLocal[]; the final swapAmount and swapKind.
-   Split strategy:
    -   Consider 4 sizes: 25%, 50%, 75%, 100% of the requested amount.
    -   For each size and each path:
        -   Build a PathWithAmount (which quotes amounts using pool math).
        -   Filter out zero-amount results (common at tiny sizes) and paths that are too gas-expensive on HyperEvm if they include too many buffer steps.
    -   Sort each bucket (25/50/75/100) by best quote:
        -   GivenIn: descending by outputAmount.
        -   GivenOut: ascending by inputAmount.
-   Construct split candidates:
    -   100% on the best 100% path.
    -   75/25 split: try best 75% path + a 25% path that shares no pool with it.
    -   50/50 split: try best 50% path + the best disjoint 50% path.
    -   Copy pools and enable mutateBalances so that using the same pool across split legs is safe in simulation.
-   Choose the winner:
    -   GivenIn: maximize sum of outputs.
    -   GivenOut: minimize sum of inputs.
-   Output: The best one- or two-path combination (PathWithAmount[]), or null if nothing valid.
-   Why: Small set of split heuristics captures most gains from routing across independent liquidity sources without heavy combinatorics.

_Important knobs and heuristics_

-   Graph pruning: maxPathsPerTokenPair (top-K edges by normalizedLiquidity) and boosted (phantom BPT) exceptions to keep important structural routes.
-   Traversal constraints: maxDepth, boosted/non-boosted depth rules, maxBuffersInPath (tighter on HyperEvm).
-   Greedy edge expansion: approxPathsToReturn, maxRanksPerSegment, minSwapAmountRatio for early-capacity pruning.
-   Split routing: limited to 100, 75/25, 50/50 with disjoint-pool preference to avoid self-competition and to improve capacity.

_Correctness and complexity notes_

-   Token-path search is bounded depth-first traversal with domain-specific constraints that prevent cycles and overlong paths.
-   Pool selection per hop is a greedy best-first scheme over ranked edges with early capacity filtering; it doesn’t enumerate all combinations (by design).
-   Path capacity is computed exactly via backward propagation with pool-specific limits and swap simulations (swapGivenOut).
-   Split-route selection explores only a few combinations but covers the common sweet spots for multi-path improvements.
-   Naming note: traverseBfs is recursive and behaves more like depth-first enumeration over neighbors (it’s bounded/filtered, so the practical difference is small here).

### Layer responsibilities summary

-   SOR (integration/orchestration):
    -   Transforms DB pools into in-memory BasePool instances.
    -   Adds v3 Buffer pools.
    -   Wires up router, returns best split paths.
-   Router (coordination + path scoring/splitting):
    -   Builds the graph via PathGraph.
    -   Gets candidate paths.
    -   Quotes and selects best split combination.
-   PathGraph (graph + search):
    -   Nodes/edges creation with ranked edges per token pair.
    -   Token-path enumeration with depth/boosted constraints.
    -   Greedy edge selection per token path with capacity checks.
    -   Path validation, de-dup, and limit-based sorting.
-   BasePool family (math/quoting primitives):
    -   Expose normalizedLiquidity for ranking.
    -   Provide getLimitAmountSwap, swapGivenOut, etc., to compute per-hop and path capacities and quotes.

If you want, I can draw a quick call graph or walk through a concrete example (e.g., 3-hop path with two ranks per segment) to illustrate the rank queue and limit propagation.

## Review

Here’s a blunt review, then a prioritized set of optimizations with tradeoffs, plus how this compares to state-of-the-art DEX routing.

### What’s solid

-   Clear layering and clean separation of concerns (pool ingestion → graph → candidate pathing → quoting/split selection).
-   Aggressive but sensible pruning (top-K by normalizedLiquidity, bounded depth, boosted path constraints, max buffers).
-   Capacity-aware pruning during edge selection (minLimitThreshold) prevents wasting time on tiny-capacity routes.
-   Backwards limit propagation per path is correct in spirit and avoids overestimating path capacity.
-   Disjoint split preference in 75/25 and 50/50 is good.

### issues and pitfalls

Correctness/suboptimality

-   Split routing is extremely coarse. Only 100%, 75/25, and 50/50 are tried, and only one disjoint candidate per split is considered. This will routinely miss large improvements. State-of-the-art does continuous allocation across more than two paths.
-   Silent path filtering across ratios is likely wrong:
    -   In getBestPaths you do validPaths = selectedPaths after each ratio. This throws away paths that might be bad at 25% (rounding-to-zero) but great at 100%. You’re biasing later ratios toward “survived” paths rather than “best” paths.
-   The “greedy ranks” expander can finalize the wrong segment:
    -   In expandTokenPathWithBestRanks, currentFinalRankIndex = finalRanks.length assumes segments are finalized left→right. Errors thrown in expandTokenPathWithRanks (missing rank) could originate from any segment, but you finalize the “next” segment regardless. That can prematurely prune good combinations.
-   Hard caps (maxBuffersInPath) are blunt. Gas impact should be modeled in the objective, not only as a strict cutoff (except where chain limits force it). You can mistakenly exclude profitable-but-buffer-heavy paths with low gas.
-   traverseBfs is actually DFS-with-constraints. That’s fine, but the name is misleading and it doesn’t prioritize promising neighbors first. You could be exploring mediocre branches before clearly better ones.

### Performance/engineering

-   Re-sorting edges on every addEdge insert (TODO note present). With large graphs this is a hotspot. Keep a fixed-size min-heap or do binary insertion and cap to K to avoid full re-sorts.
-   Limit computation duplication:
    -   getLimitAmountSwapForPath is called in the greedy phase and again in sortAndFilterPaths. There’s no memoization keyed by pathId+swapKind. This is an easy win.
-   addAlternativeRanks uses global maxPathsPerTokenPair to decide whether to add next rank for a segment. That can push out-of-range ranks for segments with fewer edges, generate errors, and then rely on catch to prune. Check per-segment max ranks up front.
-   getConnectedVertices fallback uses [] but the loop expects a Map iterator. It works only because addNode initializes edges for all tokens, but the fallback is type-inconsistent and one missed init becomes a subtle runtime bug.
-   selectedPathIds duplication check is repeated in both getCandidatePaths and sortAndFilterPaths; do it once with consistent ordering.
-   isValidPath’s seenPoolAddresses is always an empty array at call sites; it never affects selection. If you don’t intend to do global pool de-dup across selected paths, remove it or actually maintain it across chosen paths per tokenPath to encourage diversity.
-   Building BPT tokens ad hoc (decimals hardcoded to 18) may be wrong for some variants.

### Algorithmic and modeling gaps

-   Ranking edges purely by normalizedLiquidity is a weak proxy. It ignores price, fee structures, and current reserves’ marginal price. For many AMMs, “higher normalized liquidity” != “better output for this size.”
-   Phantom/BPT exception “include unlimited edges” can explode branching on some topologies.
-   No gas-aware scoring except a HyperEvm hard limit. For L1 or gas-heavy chains, you need gas in the objective to avoid long fragile routes.
-   No global route diversity mechanism beyond “disjoint for splits.” Candidate generation may return many near-duplicates.

## What I’d change: optimizations by effort level

### Quick wins (low risk, high ROI)

-   Fix split filtering bug:
    -   Don’t set validPaths = selectedPaths between split ratios. Compute 25/50/75/100 on the full candidate set. If you need to cap runtime, limit per-ratio to top M candidates rather than shrinking the universe across ratios.
-   Memoize path limits and quotes:
    -   Cache getLimitAmountSwapForPath(pathId, swapKind) and simple path quotes for recurring (path, amount) pairs or a small set of sample points per path. You call limits multiple times (greedy + sorting).
-   Edge insertion perf:
    -   Maintain a fixed-size top-K structure per token pair:
        -   If size < K: insert (binary insert or push+single pass).
        -   Else if newEdge.liq <= smallest.liq: drop.
        -   Else insert and drop smallest.
    -   Avoid full sort per insertion.
-   Correct rank exploration bounds:
    -   Precompute segmentsMaxRanks[i] = edges(token[i], token[i+1]).length.
    -   In addAlternativeRanks, only push new ranks if currentRank + 1 < segmentsMaxRanks[i].
    -   Remove the try/catch-as-control-flow for “missing rank.”
-   Improve greedy rank exploration:
    -   Switch to a proper beam search per tokenPath:
        -   Define a score: e.g., clamp(limit) or a fast sample quote at the target amount (or at min(amount, pathLimit)).
        -   Keep a priority queue of rank vectors ordered by score, expand by bumping one segment’s rank at a time, keep top B candidates (beam width).
        -   Enforce maxRanksPerSegment by counting distinct ranks per segment among kept candidates.
    -   This gives better coverage and removes the “finalRanks guessing” bug.
-   Use gas-aware path scoring:
    -   Estimate gas per hop by pool type, compute netOut = amountOut - gasCostInTokenOut (via price oracle or current mid-price). Use netOut as sorting metric for selection and split decisions.

### Medium effort (structural improvements)

-   Better path split optimization (continuous rather than fixed 25/50/75/100):
    -   Waterfilling/Lagrange multiplier method over a small set of top paths (N=3–6):
        -   For each path, define f_i(x) = output for input x (monotone, diminishing returns in most CFMMs).
        -   Allocate x_i to equalize marginal returns f_i’(x_i) subject to sum x_i = X and 0 ≤ x_i ≤ limit_i.
        -   Numerically approximate f_i’ with finite diffs and solve via binary search on a shared λ (or do iterative greedy in small chunks).
        -   This is how Balancer SOR v2-class and several aggregators approximate optimal splitting.
    -   Tradeoff: a few more quotes per iteration but it’s still cheap with N small; outcome is significantly closer to optimal.
-   Candidate path diversity and dedup:
    -   When collecting candidates, prefer pool-disjoint or minimally-overlapping paths and drop dominated ones (strictly lower limit and worse estimated output).
-   Gas as a soft constraint:
    -   Replace hard maxBuffersInPath (except HyperEvm hard rule) with a penalty in the score, e.g., score = amountOut - alpha \* gasInOutToken. Choose alpha from on-chain gas and token price.

### High effort (approaching state-of-the-art)

-   Path-based piecewise-linear modeling + LP:
    -   For each selected path, sample (x, f_i(x)) at 4–8 points to build a concave PWL approximation. Solve a small LP to maximize sum f_i(x_i) with sum x_i = X and x_i within knots. This finds near-optimal splits over many paths cleanly and quickly.
    -   Tradeoff: Slight complexity to build PWL and solve LP (but with N ≤ 6 it’s trivial).
-   Multi-source graph search with better heuristics:
    -   Use A\* or best-first search over tokens prioritizing neighbors with higher aggregate liquidity and better indicative spot price to the target token. This finds shorter, better paths earlier and reduces combinatorics.
    -   Consider k-shortest simple paths (Yen/Eppstein) over a cost metric like -log(normalizedLiquidity) + hop penalty, then refine each with pool-level selection.
-   Global gas-awareness:
    -   Calibrate per-pool-type gas constants empirically and include them consistently in both candidate selection and final optimization.

### Comparing to state-of-the-art

-   1inch Pathfinder / ParaSwap / 0x:
    -   They explore many more sources, build richer candidate sets, and then solve for continuous splits (or a very fine discrete approximation). They account for gas in the objective and often use beam/best-first techniques with heuristics tied to marginal price and liquidity.
    -   Your approach is fast and predictable but much coarser: fixed-ratio splits, limited rank exploration, and liquidity-only ranking. You’ll leave meaningful edge on the table on complex pairs or larger sizes.
-   Balancer SOR v2-like methods:
    -   Historically used continuous split optimization across a small set of candidate paths (waterfilling/Lagrange), and included gas costs in the objective. Your code improves on search pruning for v3/phantom routes, but the split step regressed in optimality due to the coarse 25/50/75/100 scheme.

### Concrete fixes (actionable)

-   Bug/logic
    -   Don’t shrink validPaths across ratios. Compute all four ratios over the full candidate set.
    -   Fix rank-finalization logic. Replace try/catch with explicit bounds and move to a beam search prioritized by a real score.
    -   Tighten addAlternativeRanks to respect per-segment edge counts.
    -   Memoize getLimitAmountSwapForPath by pathId+swapKind.
-   Performance
    -   Replace per-insert sort with top-K maintenance (heap or bounded ordered array).
    -   Cache normalizedLiquidity results per (pool, tokenIn, tokenOut) while building edges.
-   Quality
    -   Add gas-aware scoring and selection. Apply as a penalty rather than just a hard cap (except where necessary on HyperEvm).
    -   Consider adding a quick two-path continuous splitter (waterfilling) as a drop-in replacement for the 75/25 and 50/50 discrete tests. Then generalize to 3–4 paths.
    -   Prefer diversity: when expanding per tokenPath, deprioritize edges that reuse pools from already-selected good candidates unless they bring a clearly higher score.

### Sketches

-   Beam search on ranks (per token path)
    -   Keep priority queue of rank vectors scored by min(limit, quoteAtTarget) - gasPenalty.
    -   Pop best, expand by incrementing one segment’s rank (within available edges).
    -   Stop at beam width B or cap of candidates.
-   Continuous split (two-path quick version)
    -   Binary search over x in [0, X] maximizing f1(x) + f2(X-x) - gasPenalty. Generalize to N paths via Lagrange waterfilling or small PWL+LP.

### Tradeoffs

-   More accurate splitting (waterfilling/PWL+LP) vs. latency: adds a handful of extra quotes per candidate path. With N ≤ 6 it’s negligible relative to network/db overhead and pays back in better execution.
-   Beam/best-first vs. current greedy ranks: slightly more bookkeeping, but avoids the segment-finalization pitfalls and gets better candidates for roughly the same bound (approxPathsToReturn).
-   Gas-aware objective vs. hard constraints: better real-world outcomes but requires maintaining gas estimates and token price conversions.

### Prioritized roadmap

1. Fix split filtering and add memoization + top-K edge maintenance. Easy wins.
2. Replace greedy ranks with a beam search scored by limit-adjusted quote; enforce per-segment rank bounds explicitly.
3. Add gas-aware scoring and remove maxBuffersInPath except where chain-specific constraints force it.
4. Implement two-path continuous splitter; then extend to 3–4 paths or PWL+LP for N paths.
5. Consider A\*/k-shortest for token-path discovery if you need more throughput or quality on very large graphs.

If you want, I can:

-   Draft a beam-search drop-in for expandTokenPathWithBestRanks.
-   Implement a two-path waterfilling splitter to replace 75/25 + 50/50.
-   Add a small memoization layer around getLimitAmountSwapForPath and PathWithAmount quotes.
