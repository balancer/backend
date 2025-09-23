import { formatUnits } from 'viem';
import { Address, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathGraphEdgeData, PathGraphTraversalConfig } from './pathGraphTypes';
import { BasePool } from '../poolsV2/basePool';
import { PathLocal } from '../path';

const DEFAULT_MAX_PATHS_PER_TOKEN_PAIR = 4;

export class PathGraphBfs {
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
        this.maxPathsPerTokenPair = maxPathsPerTokenPair;

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

        const tokenPaths = this.findAllValidTokenPaths({
            tokenIn: tokenIn.wrapped,
            tokenOut: tokenOut.wrapped,
            config,
        });
        console.log('tokenPaths found -> ', tokenPaths.length);

        const paths: PathGraphEdgeData[][] = [];
        const selectedPathIds: string[] = [];

        // Use the new greedy best-first approach for each token path
        for (const tokenPath of tokenPaths) {
            const expandedPaths = this.expandTokenPathWithBestRanks({
                tokenPath,
                swapKind,
                minLimitThreshold,
                approxPathsToReturn: config.approxPathsToReturn,
            });

            for (const path of expandedPaths) {
                if (this.isValidPath({ path, seenPoolAddresses: [], selectedPathIds, config })) {
                    selectedPathIds.push(this.getIdForPath(path));
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
            try {
                const limit = pool.getLimitAmountSwap(tokenIn, tokenOut, swapKind);
                const priceToken = (swapKind as any) === SwapKind.GivenIn ? tokenIn : tokenOut;
                const price = tokenPrices.get(priceToken.wrapped.toLowerCase());
                if (price !== undefined) {
                    const amount = Number(formatUnits(limit, priceToken.decimals));
                    limitUSD = amount * price;
                }
            } catch (_e) {
                // leave limitUSD undefined if anything fails
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
    private expandTokenPathWithBestRanks({
        tokenPath,
        swapKind,
        minLimitThreshold,
        approxPathsToReturn,
    }: {
        tokenPath: string[];
        swapKind: SwapKind;
        minLimitThreshold: bigint;
        approxPathsToReturn: number;
    }): PathGraphEdgeData[][] {
        const results: PathGraphEdgeData[][] = [];
        const seen = new Set<string>();

        const segmentCount = tokenPath.length - 1;
        if (segmentCount <= 0) return [];
        // Gather candidate edges per segment (already sorted by normalizedLiquidity desc).
        const perSegmentEdges: PathGraphEdgeData[][] = new Array(segmentCount);
        for (let i = 0; i < segmentCount; i++) {
            const edges = this.edges.get(tokenPath[i])?.get(tokenPath[i + 1]);
            if (!edges) return []; // path cannot be built
            perSegmentEdges[i] = edges;
        }

        // Start with all-segment rank 0
        const queue: number[][] = [new Array(tokenPath.length - 1).fill(0)];

        while (queue.length > 0 && results.length < approxPathsToReturn) {
            const ranks = queue.shift()!;

            try {
                const path = this.expandTokenPathWithRanks({ perSegmentEdges, ranks });
                const limit = this.getLimitAmountSwapForPath(path, swapKind);
                if (limit >= minLimitThreshold) {
                    results.push(path);
                }

                // enqueue "neighboring" rank choices — but bounded by maxRanksPerSegment
                for (let i = 0; i < ranks.length; i++) {
                    if (ranks[i] + 1 < this.maxPathsPerTokenPair) {
                        const newRanks = [...ranks];
                        newRanks[i]++;
                        queue.push(newRanks);
                    }
                }
            } catch {
                continue; // skip invalid rank combination
            }
        }

        return results;
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
