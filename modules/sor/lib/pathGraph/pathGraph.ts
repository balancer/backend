import { Address, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathGraphEdgeData, PathGraphTraversalConfig } from './pathGraphTypes';
import { BasePool } from '../poolsV2/basePool';
import { PathLocal } from '../path';

const DEFAULT_MAX_PATHS_PER_TOKEN_PAIR = 10;

export class PathGraph {
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
    }: {
        pools: BasePool[];
        maxPathsPerTokenPair?: number;
        enableAddRemoveLiquidityPaths: boolean;
    }) {
        this.poolAddressMap = new Map();
        this.nodes = new Map();
        this.edges = new Map();
        this.maxPathsPerTokenPair = maxPathsPerTokenPair;

        this.buildPoolAddressMap(pools);

        this.addAllTokensAsGraphNodes({ pools, enableAddRemoveLiquidityPaths });

        this.addTokenPairsAsGraphEdges({ pools, maxPathsPerTokenPair, enableAddRemoveLiquidityPaths });
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
        // apply defaults, allowing caller override whatever they'd like
        const config: PathGraphTraversalConfig = {
            maxDepth: 6,
            maxNonBoostedPathDepth: 3,
            maxNonBoostedHopTokensInBoostedPath: 2,
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
     * Returns the vertices connected to a given vertex
     */
    private getConnectedVertices(tokenAddress: string): string[] {
        const result: string[] = [];
        const edges = this.edges.get(tokenAddress) || [];

        for (const [otherToken] of edges) {
            result.push(otherToken);
        }

        return result;
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
        tokenPath: string[];
        config: PathGraphTraversalConfig;
    }): string[][] {
        const tokenPaths: string[][] = [];

        this.traverseBfs({
            ...args,
            callback: (tokenPath) => {
                tokenPaths.push(tokenPath);
            },
        });

        return tokenPaths;
    }

    private traverseBfs({
        token,
        tokenIn,
        tokenOut,
        tokenPath,
        callback,
        config,
    }: {
        token: string;
        tokenIn: string;
        tokenOut: string;
        tokenPath: string[];
        callback: (tokenPath: string[]) => void;
        config: PathGraphTraversalConfig;
    }): void {
        const neighbors = this.getConnectedVertices(token);

        for (const neighbor of neighbors) {
            const validTokenPath = this.isValidTokenPath({
                tokenPath: [...tokenPath, neighbor],
                tokenIn,
                tokenOut,
                config,
            });

            if (validTokenPath && neighbor === tokenOut) {
                callback([...tokenPath, neighbor]);
            } else if (validTokenPath && !tokenPath.includes(neighbor)) {
                this.traverseBfs({
                    tokenPath: [...tokenPath, neighbor],
                    token: neighbor,
                    tokenIn,
                    tokenOut,
                    callback,
                    config,
                });
            }
        }
    }

    private isValidTokenPath({
        tokenPath,
        config,
        tokenIn,
        tokenOut,
    }: {
        tokenPath: string[];
        config: PathGraphTraversalConfig;
        tokenIn: string;
        tokenOut: string;
    }) {
        const isCompletePath = tokenPath[tokenPath.length - 1] === tokenOut;
        const hopTokens = tokenPath.filter((token) => token !== tokenIn && token !== tokenOut);
        const numStandardHopTokens = hopTokens.filter((token) => !this.poolAddressMap.has(token)).length;
        const isBoostedPath = tokenPath.filter((token) => this.poolAddressMap.has(token)).length > 0;

        if (tokenPath.length > config.maxDepth) {
            return false;
        }

        if (isBoostedPath && numStandardHopTokens > config.maxNonBoostedHopTokensInBoostedPath) {
            return false;
        }

        // if the path length is greater than maxNonBoostedPathDepth, then this path
        // will only be valid if its a boosted path, so it must honor maxNonBoostedHopTokensInBoostedPath
        if (
            tokenPath.length > config.maxNonBoostedPathDepth &&
            numStandardHopTokens > config.maxNonBoostedHopTokensInBoostedPath
        ) {
            return false;
        }

        if (isCompletePath && !isBoostedPath && tokenPath.length > config.maxNonBoostedPathDepth) {
            return false;
        }

        return true;
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
        maxRanksPerSegment,
        approxPathsToReturn,
    }: {
        tokenPath: string[];
        swapKind: SwapKind;
        minLimitThreshold: bigint;
        maxRanksPerSegment: number;
        approxPathsToReturn: number;
    }): PathGraphEdgeData[][] {
        const paths: PathGraphEdgeData[][] = [];
        // Ranks respective to each valid path
        const pathsRanks: number[][] = [];

        // Start with highest liquidity rank for each segment
        const initialRanks = new Array(tokenPath.length - 1).fill(0);
        // Array that will be used to identify when to stop exploring ranks for a segment
        const finalRanks: number[] = [];

        // Use a queue to explore rank combinations
        let rankQueue: number[][] = [initialRanks];
        const exploredCombinations = new Set<string>();

        while (rankQueue.length > 0 && paths.length < approxPathsToReturn) {
            const ranks = rankQueue.shift()!;
            const combinationKey = ranks.join(',');

            if (exploredCombinations.has(combinationKey)) continue;
            exploredCombinations.add(combinationKey);

            try {
                const path = this.expandTokenPathWithRanks({ tokenPath, ranks });
                const limit = this.getLimitAmountSwapForPath(path, swapKind);
                if (limit >= minLimitThreshold) {
                    paths.push(path);
                    pathsRanks.push(ranks);

                    // if reached limit of maxRanksPerSegment, set final rank for current segment
                    const currentFinalRankIndex = finalRanks.length;
                    const uniqueRanksForCurrentSegment = new Set(pathsRanks.map((rank) => rank[currentFinalRankIndex]));
                    if (uniqueRanksForCurrentSegment.size >= maxRanksPerSegment) {
                        finalRanks.push(ranks[currentFinalRankIndex]);
                        // remove ranks from rankQueue that are greater than the final rank for this segment
                        rankQueue = rankQueue.filter(
                            (rank) => rank[currentFinalRankIndex] <= finalRanks[currentFinalRankIndex],
                        );
                    }
                }
            } catch (error) {
                // this error means the code reached a rank that does not exist for a pathSegment
                // we can add it to finalRanks array to stop exploring ranks for this segment
                const currentFinalRankIndex = finalRanks.length;
                const currentFinalRank = ranks[currentFinalRankIndex] - 1;
                if (currentFinalRank !== undefined) {
                    finalRanks.push(currentFinalRank);
                    // remove ranks from rankQueue that are greater than the final rank for this segment
                    rankQueue = rankQueue.filter(
                        (rank) => rank[currentFinalRankIndex] <= finalRanks[currentFinalRankIndex],
                    );
                }
            }
            this.addAlternativeRanks(rankQueue, ranks, finalRanks, maxRanksPerSegment);
        }

        return paths;
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

    /**
     * Adds alternative rank combinations to the queue for path diversity.
     * For each segment, tries the next highest rank if available.
     */
    private addAlternativeRanks(
        rankQueue: number[][],
        currentRanks: number[],
        finalRanks: number[],
        maxRanksPerSegment: number,
    ): void {
        // For each segment, try the next highest rank if available
        for (let segmentIndex = 0; segmentIndex < currentRanks.length; segmentIndex++) {
            // if already reached the final rank for this segment, skip
            if (finalRanks[segmentIndex] !== undefined) {
                continue;
            }

            const currentRank = currentRanks[segmentIndex];
            if (currentRank + 1 < this.maxPathsPerTokenPair) {
                const newRanks = [...currentRanks];
                newRanks[segmentIndex] = currentRank + 1;
                rankQueue.push(newRanks);
            }
        }
    }
}
