import { Address, SwapKind, TokenAmount, Token } from '@balancer/sdk';
import { PathSegment, PathGraphTraversalConfig } from './pathGraphTypes';
import { BasePool } from '../poolsV2/basePool';
import { PathLocal } from '../path';
import { formatUnits } from 'viem';
import { SorAbortError } from '../../errors';

const DEFAULT_MAX_PATH_SEGMENTS_PER_TOKEN_PAIR = 4;

type PathCandidateProps = { ranks: number[]; boundNL: bigint };

export class PathGraph {
    private nodes: Set<string>;
    private edges: Map<string, Map<string, PathSegment[]>>;
    private poolAddressMap: Map<string, BasePool>;

    /**
     * A directed graph used to find optimal swap paths between tokens.
     *
     * Graph structure:
     * - Nodes: token addresses
     * - Edges: connections between tokens (tokenIn -> tokenOut via pool)
     *
     * Each edge stores pool data enabling swaps between two tokens.
     * Multiple edges can exist between the same token pair (different pools),
     * sorted by normalized liquidity to prioritize the most liquid routes.
     */
    constructor() {
        this.nodes = new Set();
        this.edges = new Map();
        this.poolAddressMap = new Map();
    }

    /**
     * We build a directed graph for all pools.
     * Nodes are tokens and edges are triads: [tokenIn, tokenOut, pool].
     *
     * The current criterion for including a path segment into this graph is the
     * following:
     *
     * - For any token pair x -> y, we include only the most liquid ${maxPathSegmentsPerTokenPair}
     * pool that is able to support a swap size of at least ${minLimitThresholdUSD}
     */

    public buildGraph({
        pools,
        maxPathSegmentsPerTokenPair = DEFAULT_MAX_PATH_SEGMENTS_PER_TOKEN_PAIR,
        enableAddRemoveLiquidityPaths,
        swapKind,
        tokenPrices,
        minLimitThresholdUSD,
    }: {
        pools: BasePool[];
        maxPathSegmentsPerTokenPair?: number;
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
            maxPathSegmentsPerTokenPair,
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
    // (b) maxQueue - an extra emergency brake to cut off exploration time with too many partial paths
    // (c) maxBuffersInPath - the max number of buffers in a path, defaults to 5.
    // (d) maxCandidatesPerTokenPath - search for up to this many candidates within a single token path
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
        signal,
    }: {
        tokenIn: Token;
        tokenOut: Token;
        swapAmount: TokenAmount;
        swapKind: SwapKind;
        graphTraversalConfig?: Partial<PathGraphTraversalConfig>;
        signal?: AbortSignal;
    }): PathLocal[] {
        // Check if already aborted
        if (signal?.aborted) {
            throw new SorAbortError();
        }

        const isHyperEvm = tokenIn.chainId === 999;

        // apply defaults, allowing caller override whatever they'd like
        const config: PathGraphTraversalConfig = {
            maxDepth: 8,
            maxDepthFallback: 10,
            maxQueue: 1_000_000,
            maxTokenPaths: 50,
            maxBuffersInPath: isHyperEvm ? 2 : 5, // limited only on HyperEvm due to gas cost limits on small blocks - virtually unlimited otherwise
            maxCandidatesPerTokenPath: 20,
            minSwapAmountRatio: 0.5, // Default to 50% so we're sure selected paths support splitPath logic
            ...graphTraversalConfig,
        };

        // Calculate minimum limit threshold based on swap amount and ratio
        const minLimitThreshold = (swapAmount.amount * BigInt(Math.floor(config.minSwapAmountRatio * 100))) / 100n;

        const tokenPaths = this.findAllValidTokenPaths({
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            config,
            signal,
        });

        // Check if aborted after finding token paths
        if (signal?.aborted) {
            throw new SorAbortError();
        }

        // Step 1: Generate all candidate combinations across all token paths
        const allPathCandidates: Array<{
            tokenPath: string[];
            pathSegmentsPerTokenPair: PathSegment[][];
            pathCandidateProps: PathCandidateProps;
        }> = [];

        for (const tokenPath of tokenPaths) {
            // Check for abort periodically
            if (signal?.aborted) {
                throw new SorAbortError();
            }

            const segmentCount = tokenPath.length - 1;
            if (segmentCount <= 0) continue;

            // Gather candidate edges per segment (already sorted by normalizedLiquidity desc)
            const pathSegmentsPerTokenPair: PathSegment[][] = Array.from(
                { length: segmentCount },
                (_, i) => this.edges.get(tokenPath[i])?.get(tokenPath[i + 1]) || [],
            );

            // Generate all combinations for this token path using beam search
            const pathCandidates = this.selectTopCandidatesPerTokenPath(
                pathSegmentsPerTokenPair,
                config.maxCandidatesPerTokenPath,
            );

            for (const pathCandidateProps of pathCandidates) {
                allPathCandidates.push({
                    tokenPath,
                    pathSegmentsPerTokenPair,
                    pathCandidateProps,
                });
            }
        }

        // Check if aborted before validation
        if (signal?.aborted) {
            throw new SorAbortError();
        }

        // Step 2: Expand and validate the selected candidates
        const paths = this.expandAndValidateCandidates(allPathCandidates, swapKind, minLimitThreshold, config, signal);

        return paths.map((path) => {
            const pathTokens: Token[] = path.map((segment) => segment.tokenOut);
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
            const tokens = pool.tokens.map((t) => t.token);
            if (enableAddRemoveLiquidityPaths && pool.poolType !== 'Buffer') {
                tokens.push(new Token(pool.tokens[0].token.chainId, pool.address.toLowerCase() as Address, 18)); // Add BPT as token nodes
            }
            for (const token of tokens) {
                if (!this.nodes.has(token.address)) {
                    this.addNode(token);
                }
            }
        }
    }

    private addTokenPairsAsGraphEdges({
        pools,
        maxPathSegmentsPerTokenPair,
        enableAddRemoveLiquidityPaths,
        swapKind,
        tokenPrices,
        minLimitThresholdUSD,
    }: {
        pools: BasePool[];
        maxPathSegmentsPerTokenPair: number;
        enableAddRemoveLiquidityPaths: boolean;
        swapKind?: SwapKind;
        tokenPrices?: Map<string, number>;
        minLimitThresholdUSD?: number;
    }) {
        for (const pool of pools) {
            const tokens = pool.tokens.map((t) => t.token);
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
                        this.addEdge({ edgeProps, maxPathSegmentsPerTokenPair });
                    } catch {
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
    }): PathSegment {
        let limitUSD: number | undefined = undefined;
        if (swapKind !== undefined && tokenPrices) {
            const limit = pool.getLimitAmountSwap(tokenIn, tokenOut, swapKind);
            const priceToken = (swapKind as SwapKind) === SwapKind.GivenIn ? tokenIn : tokenOut;
            const price = tokenPrices.get(priceToken.address.toLowerCase());
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
        this.nodes.add(token.address);

        if (!this.edges.has(token.address)) {
            this.edges.set(token.address, new Map());
        }
    }

    /**
     * Adds a directed edge from a source vertex to a destination
     */
    private addEdge({
        edgeProps,
        maxPathSegmentsPerTokenPair,
    }: {
        edgeProps: PathSegment;
        maxPathSegmentsPerTokenPair: number;
    }): void {
        const tokenInVertex = this.nodes.has(edgeProps.tokenIn.address);
        const tokenOutVertex = this.nodes.has(edgeProps.tokenOut.address);
        const tokenInNode = this.edges.get(edgeProps.tokenIn.address);

        if (!tokenInVertex || !tokenOutVertex || !tokenInNode) {
            throw new Error('Attempting to add invalid edge');
        }

        const existingEdgeProps = tokenInNode.get(edgeProps.tokenOut.address) || [];

        const sorted = [...existingEdgeProps, edgeProps].sort((a, b) =>
            a.normalizedLiquidity > b.normalizedLiquidity ? -1 : 1,
        );

        tokenInNode.set(
            edgeProps.tokenOut.address,
            sorted.length > maxPathSegmentsPerTokenPair ? sorted.slice(0, maxPathSegmentsPerTokenPair) : sorted,
        );
    }

    private findAllValidTokenPaths({
        tokenIn,
        tokenOut,
        config,
        signal,
    }: {
        tokenIn: string;
        tokenOut: string;
        config: PathGraphTraversalConfig;
        signal?: AbortSignal;
    }): string[][] {
        const results: string[][] = [];
        const queue: { node: string; tokenPath: string[] }[] = [{ node: tokenIn, tokenPath: [tokenIn] }];

        while (queue.length > 0 && results.length < config.maxTokenPaths && queue.length < config.maxQueue) {
            // Check for abort in the main loop
            if (signal?.aborted) {
                throw new SorAbortError();
            }

            const { node, tokenPath } = queue.shift()!;

            const neighbors = this.edges.get(node);
            if (!neighbors) continue;

            for (const [neighbor] of neighbors) {
                // small hot-path optimization: check length bounds before cloning array
                const maxDepth = results.length > 0 ? config.maxDepth : config.maxDepthFallback;
                if (tokenPath.length + 1 > maxDepth) continue;

                // no cycles
                if (tokenPath.includes(neighbor)) continue;

                const newTokenPath = [...tokenPath, neighbor];

                if (neighbor === tokenOut) {
                    results.push(newTokenPath);
                } else {
                    // push longer path into queue
                    queue.push({ node: neighbor, tokenPath: newTokenPath });
                }
            }
        }

        return results;
    }

    private isValidPath({
        path,
        config,
        swapKind,
        minLimitThreshold,
    }: {
        path: PathSegment[];
        config: PathGraphTraversalConfig;
        swapKind: SwapKind;
        minLimitThreshold: bigint;
    }) {
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

        if (this.getLimitAmountSwapForPath(path, swapKind) < minLimitThreshold) {
            return false;
        }

        return true;
    }

    private getLimitAmountSwapForPath(path: PathSegment[], swapKind: SwapKind): bigint {
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
     * Generates candidate combinations for a single token path using beam search.
     *
     * @param pathSegmentsPerTokenPair - Array of edge arrays for each segment
     * @param beamWidth - Maximum number of candidates to keep
     * @returns Array of candidate rank combinations
     */
    private selectTopCandidatesPerTokenPath(
        pathSegmentsPerTokenPair: PathSegment[][],
        beamWidth: number,
    ): PathCandidateProps[] {
        const segmentCount = pathSegmentsPerTokenPair.length;
        if (segmentCount <= 0) return [];

        // Beam search: keep only the top K partial combos by bottleneck normalizedLiquidity
        let pathCandidateProps: PathCandidateProps[] = [{ ranks: [], boundNL: 0n }];

        for (let seg = 0; seg < segmentCount; seg++) {
            const edges = pathSegmentsPerTokenPair[seg];
            const next: PathCandidateProps[] = [];

            for (const p of pathCandidateProps) {
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
            pathCandidateProps = next.slice(0, beamWidth);
        }

        return pathCandidateProps;
    }

    /**
     * Applies global beam search to select the top candidates across all token paths.
     *
     * This method aggregates all candidates from different token paths and applies beam search
     * globally to select the most promising candidates based on bottleneck normalized liquidity.
     *
     * @param allCandidates - Array of candidate groups from all token paths
     * @param beamWidth - Maximum number of candidates to select globally
     * @returns Array of top candidates with their associated data
     */
    private selectTopCandidatesGlobally(
        allCandidates: Array<{
            tokenPath: string[];
            pathSegmentsPerTokenPair: PathSegment[][];
            candidates: { ranks: number[]; boundNL: bigint }[];
        }>,
        beamWidth: number,
    ): Array<{
        tokenPath: string[];
        pathSegmentsPerTokenPair: PathSegment[][];
        candidate: { ranks: number[]; boundNL: bigint };
    }> {
        // Flatten all candidates with their associated data
        const flattenedCandidates = allCandidates.flatMap(({ tokenPath, pathSegmentsPerTokenPair, candidates }) =>
            candidates.map((candidate) => ({
                tokenPath,
                pathSegmentsPerTokenPair,
                candidate,
            })),
        );

        // Sort by bottleneck normalized liquidity (descending) and take top K
        flattenedCandidates.sort((a, b) => (a.candidate.boundNL < b.candidate.boundNL ? 1 : -1));

        return flattenedCandidates.slice(0, beamWidth);
    }

    /**
     * Expands and validates the selected candidates to return final paths.
     *
     * This method takes the top candidates selected by global beam search and performs
     * the expensive path expansion and validation only for these candidates.
     *
     * @param pathCandidates - Array of top candidates with their associated data
     * @param swapKind - Type of swap (exact input or exact output)
     * @param minLimitThreshold - Minimum swap limit threshold
     * @param config - Path graph traversal configuration
     * @param signal - AbortSignal for cancellation
     * @returns Array of valid paths that meet the criteria
     */
    private expandAndValidateCandidates(
        pathCandidates: Array<{
            tokenPath: string[];
            pathSegmentsPerTokenPair: PathSegment[][];
            pathCandidateProps: PathCandidateProps;
        }>,
        swapKind: SwapKind,
        minLimitThreshold: bigint,
        config: PathGraphTraversalConfig,
        signal?: AbortSignal,
    ): PathSegment[][] {
        const validPaths: PathSegment[][] = [];

        for (const { pathSegmentsPerTokenPair, pathCandidateProps } of pathCandidates) {
            // Check for abort periodically
            if (signal?.aborted) {
                throw new SorAbortError();
            }

            try {
                const path = this.expandTokenPathWithRanks({
                    pathSegmentsPerTokenPair,
                    ranks: pathCandidateProps.ranks,
                });
                if (this.isValidPath({ path, config, swapKind, minLimitThreshold })) {
                    validPaths.push(path);
                }
            } catch {
                // getLimitAmountSwapForPath failed (likely due to trade/wrap amount too small)
                continue;
            }
        }

        return validPaths;
    }

    /**
     * Expands a token path using different liquidity ranks for each segment.
     * This allows exploring all combinations of pool liquidity ranks for different token pairs in a path.
     * @param tokenPath - Array of token addresses representing the path
     * @param ranks - Array of liquidity ranks to use for each segment (must match path length - 1)
     */
    private expandTokenPathWithRanks({
        pathSegmentsPerTokenPair,
        ranks,
    }: {
        pathSegmentsPerTokenPair: PathSegment[][];
        ranks: number[];
    }) {
        const segments: PathSegment[] = [];

        for (let i = 0; i < pathSegmentsPerTokenPair.length; i++) {
            const edgeChoices = pathSegmentsPerTokenPair[i];
            const rank = ranks[i];
            if (!edgeChoices[rank]) {
                throw new Error('Missing rank on edge for segment');
            }
            segments.push(edgeChoices[rank]);
        }

        return segments;
    }
}
