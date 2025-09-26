import { PathGraph } from './pathGraph';
import { BasePool } from '../poolsV2/basePool';
import { Token, TokenAmount, SwapKind } from '@balancer/sdk';
import { describe, test, expect, beforeEach } from 'bun:test';

const baseConfig = {
    maxDepth: 6,
    maxDepthFallback: 5,
    maxTokenPaths: 50,
    maxBuffersInPath: 5,
    maxCandidatesPerTokenPath: 20,
    minSwapAmountRatio: 0.5,
};

function createMockPool(id: string, tokens: Token[], opts: Partial<BasePool> = {}): BasePool {
    return {
        id,
        address: id,
        poolType: opts.poolType ?? 'Weighted',
        tokens: tokens.map((t) => ({ token: t })),
        getNormalizedLiquidity: opts.getNormalizedLiquidity ?? (() => 100n),
        getLimitAmountSwap: opts.getLimitAmountSwap ?? (() => 1_000_000n),
        swapGivenOut: opts.swapGivenOut ?? ((_in: Token, _out: Token, amt: TokenAmount) => amt),
        ...opts,
    } as unknown as BasePool;
}

describe('PathGraph search algorithms', () => {
    const tokenA = new Token(1, '0xa', 18);
    const tokenB = new Token(1, '0xb', 18);
    const tokenC = new Token(1, '0xc', 18);
    const tokenD = new Token(1, '0xd', 18);

    let pools: BasePool[];
    let graph: PathGraph;

    beforeEach(() => {
        pools = [
            createMockPool('0xp1', [tokenA, tokenB]),
            createMockPool('0xp2', [tokenB, tokenC]),
            createMockPool('0xp3', [tokenC, tokenD]),
            createMockPool('0xp4', [tokenA, tokenD], { poolType: 'Buffer' }),
        ];
        graph = new PathGraph();
        graph.buildGraph({
            pools,
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });
    });

    test('finds direct path', () => {
        const paths = graph['findAllValidTokenPaths']({
            tokenIn: tokenA.wrapped,
            tokenOut: tokenB.wrapped,
            config: { ...baseConfig },
        });

        expect(paths).toContainEqual([tokenA.wrapped, tokenB.wrapped]);
    });

    test('avoids revisiting tokens (no cycles)', () => {
        // path A -> B -> A -> B should not appear
        const paths = graph['findAllValidTokenPaths']({
            tokenIn: tokenA.wrapped,
            tokenOut: tokenC.wrapped,
            config: { ...baseConfig },
        });

        for (const path of paths) {
            const visited = new Set(path);
            expect(visited.size).toBe(path.length); // ensures no duplicate token
        }
    });

    test('respects maxDepth limit', () => {
        const paths = graph['findAllValidTokenPaths']({
            tokenIn: tokenA.wrapped,
            tokenOut: tokenD.wrapped,
            config: { ...baseConfig, maxDepth: 2, maxDepthFallback: 2 },
        });

        // Only A -> D (buffer pool) should be valid, not A -> B -> C -> D
        expect(paths).toContainEqual([tokenA.wrapped, tokenD.wrapped]);
        expect(paths).not.toContainEqual([tokenA.wrapped, tokenB.wrapped, tokenC.wrapped, tokenD.wrapped]);
    });

    test('expandTokenPathWithRanks expands a simple path', () => {
        const edgesAB = (graph as any).edges.get(tokenA.wrapped).get(tokenB.wrapped);
        const edgesBC = (graph as any).edges.get(tokenB.wrapped).get(tokenC.wrapped);

        const result = graph['expandTokenPathWithRanks']({
            perSegmentEdges: [edgesAB, edgesBC],
            ranks: [0, 0],
        });

        expect(result.length).toBe(2);
        expect(result[0].pool.id).toBe('0xp1');
        expect(result[1].pool.id).toBe('0xp2');
    });

    test('findAllValidTokenPaths traversal order is breadth-first', () => {
        const g = new PathGraph();
        const localPools = [
            createMockPool('pAB', [tokenA, tokenB]),
            createMockPool('pAC', [tokenA, tokenC]),
            createMockPool('pBD', [tokenB, tokenD]),
            createMockPool('pCD', [tokenC, tokenD]),
        ];
        g.buildGraph({
            pools: localPools,
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g['findAllValidTokenPaths']({
            tokenIn: tokenA.wrapped,
            tokenOut: tokenD.wrapped,
            config: { ...baseConfig },
        });

        // Expect BFS-like order
        expect(paths[0]).toEqual([tokenA.wrapped, tokenB.wrapped, tokenD.wrapped]);
        expect(paths[1]).toEqual([tokenA.wrapped, tokenC.wrapped, tokenD.wrapped]);
    });

    test('isValidPath rejects paths that reuse the same pool within a single path', () => {
        const g = new PathGraph();
        const tri = createMockPool('pTri', [tokenA, tokenB, tokenC]);
        g.buildGraph({
            pools: [tri],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenC,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1_000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: { ...baseConfig },
        });

        let foundPathWithReusedPool = false;
        for (const path of paths) {
            const poolIds = path.pools.map((p) => p.id);
            if (new Set(poolIds).size !== poolIds.length) {
                foundPathWithReusedPool = true;
                break;
            }
        }

        expect(foundPathWithReusedPool).toBe(false);
    });

    test('getCandidatePaths respects poolIdsToInclude whitelist (filters mixed paths)', () => {
        const g = new PathGraph();
        const p1 = createMockPool('p1', [tokenA, tokenB]);
        const p2 = createMockPool('p2', [tokenB, tokenC]);
        g.buildGraph({
            pools: [p1, p2],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenC,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1_000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                poolIdsToInclude: ['p2'], // p1 not allowed
            },
        });

        expect(paths.length).toBe(0);
    });

    test('maxBuffersInPath is enforced', () => {
        const g = new PathGraph();
        const buf1 = createMockPool('buf1', [tokenA, tokenB], { poolType: 'Buffer' });
        const buf2 = createMockPool('buf2', [tokenB, tokenC], { poolType: 'Buffer' });
        g.buildGraph({
            pools: [buf1, buf2],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenC,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1_000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                maxBuffersInPath: 1, // path has 2 buffers -> invalid
            },
        });

        expect(paths.length).toBe(0);
    });

    test('respects maxPathsPerTokenPair (keeps only top-K ranked edges for a pair)', () => {
        const g = new PathGraph();

        const pAB1 = createMockPool('pAB1', [tokenA, tokenB], { getNormalizedLiquidity: () => 300n });
        const pAB2 = createMockPool('pAB2', [tokenA, tokenB], { getNormalizedLiquidity: () => 200n });
        const pAB3 = createMockPool('pAB3', [tokenA, tokenB], { getNormalizedLiquidity: () => 100n });

        g.buildGraph({
            pools: [pAB1, pAB2, pAB3],
            enableAddRemoveLiquidityPaths: false,
            maxPathsPerTokenPair: 2,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const edges = (g as any).edges.get(tokenA.wrapped).get(tokenB.wrapped);
        expect(edges.length).toBe(2);
        expect(edges.map((e: any) => e.pool.id)).toEqual(['pAB1', 'pAB2']);
    });

    test('expandTokenPathWithRanks throws on invalid rank', () => {
        const edgesAB = (graph as any).edges.get(tokenA.wrapped).get(tokenB.wrapped);
        expect(() => {
            graph['expandTokenPathWithRanks']({
                perSegmentEdges: [edgesAB],
                ranks: [10], // rank 10 does not exist
            });
        }).toThrow('Missing rank on edge for segment');
    });

    test('minSwapAmountRatio quantization can yield zero threshold for tiny ratios', () => {
        const g = new PathGraph();
        const pAB = createMockPool('pAB', [tokenA, tokenB], {
            getLimitAmountSwap: () => 5n,
        });
        g.buildGraph({
            pools: [pAB],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const tinyRatio = 0.009; // floor(0.9)/100 = 0 => zero threshold with current logic
        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenB,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 100n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: { ...baseConfig, minSwapAmountRatio: tinyRatio },
        });

        expect(paths.length).toBeGreaterThan(0);
    });

    test('reuses a pool across selected paths', () => {
        const g = new PathGraph();
        const pAB = createMockPool('pAB', [tokenA, tokenB]);
        const pAC = createMockPool('pAC', [tokenA, tokenC]);
        const pShared = createMockPool('pShared', [tokenB, tokenC, tokenD]);

        g.buildGraph({
            pools: [pAB, pAC, pShared],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenD,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 10_000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: { ...baseConfig },
        });

        expect(paths.length).toBe(2);
    });

    test('enforces maxTokenPaths limit during token path discovery', () => {
        const g = new PathGraph();

        // Create a hub-and-spoke topology to generate many paths
        const hub = new Token(1, '0xhub', 18);
        const spokes = Array.from({ length: 10 }, (_, i) => new Token(1, `0xspoke${i}`, 18));
        const target = new Token(1, '0xtarget', 18);

        const hubPools = spokes.map((spoke, i) => createMockPool(`hub${i}`, [hub, spoke]));
        const spokePools = spokes.map((spoke, i) => createMockPool(`spoke${i}`, [spoke, target]));

        g.buildGraph({
            pools: [...hubPools, ...spokePools],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        // This should generate 10 possible token paths: hub -> spoke[i] -> target
        const paths = g['findAllValidTokenPaths']({
            tokenIn: hub.wrapped,
            tokenOut: target.wrapped,
            config: { ...baseConfig, maxTokenPaths: 5 }, // limit to 5
        });

        expect(paths.length).toBe(5); // Should be capped at maxTokenPaths
    });

    test('handles SwapKind.GivenOut correctly', () => {
        const g = new PathGraph();
        const pAB = createMockPool('pAB', [tokenA, tokenB], {
            getLimitAmountSwap: (tokenIn: Token, tokenOut: Token, swapKind: SwapKind) => {
                // Return different limits based on swap kind
                return swapKind === SwapKind.GivenOut ? 500n : 1000n;
            },
        });
        g.buildGraph({
            pools: [pAB],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const pathsGivenIn = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenB,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: { ...baseConfig, minSwapAmountRatio: 0.8 }, // requires 800n
        });

        const pathsGivenOut = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenB,
            swapAmount: TokenAmount.fromRawAmount(tokenB, 1000n),
            swapKind: SwapKind.GivenOut,
            graphTraversalConfig: { ...baseConfig, minSwapAmountRatio: 0.8 }, // requires 800n
        });

        expect(pathsGivenIn.length).toBe(1); // 1000n >= 800n threshold
        expect(pathsGivenOut.length).toBe(0); // 500n < 800n threshold
    });

    test('filters paths based on limit amount calculations', () => {
        const g = new PathGraph();

        const highLiquidityPool = createMockPool('highLiq', [tokenA, tokenB], {
            getNormalizedLiquidity: () => 1000n,
            getLimitAmountSwap: () => 2000n, // High limit
        });

        const lowLiquidityPool = createMockPool('lowLiq', [tokenA, tokenB], {
            getNormalizedLiquidity: () => 999n, // Slightly lower NL so it's ranked second
            getLimitAmountSwap: () => 100n, // Low limit
        });

        g.buildGraph({
            pools: [highLiquidityPool, lowLiquidityPool],
            enableAddRemoveLiquidityPaths: false,
            maxPathsPerTokenPair: 2,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenB,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                minSwapAmountRatio: 0.15, // requires 150n minimum
                maxCandidatesPerTokenPath: 10,
            },
        });

        // Only the high liquidity pool should pass the limit filter
        expect(paths.length).toBe(1);
        expect(paths[0].pools[0].id as string).toBe('highLiq');
    });

    test('filters edges based on minLimitThresholdUSD', () => {
        graph = new PathGraph();

        const pool1 = createMockPool('p1', [tokenA, tokenB], {
            getLimitAmountSwap: () => 1000n * 10n ** 18n, // 1000 tokens
        });

        const tokenPrices = new Map<string, number>();
        tokenPrices.set(tokenA.wrapped.toLowerCase(), 1.5);
        tokenPrices.set(tokenB.wrapped.toLowerCase(), 1.0);

        // swapKind = GivenIn
        // A->B: priceToken=A, price=1.5, limitUSD=1500
        // B->A: priceToken=B, price=1.0, limitUSD=1000
        graph.buildGraph({
            pools: [pool1],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices,
            minLimitThresholdUSD: 1200,
        });

        // A->B should be created (1500 > 1200)
        const edgesAB = graph['edges'].get(tokenA.wrapped)?.get(tokenB.wrapped);
        expect(edgesAB?.length).toBe(1);
        expect(edgesAB && edgesAB[0].limitUSD).toBe(1500);

        // B->A should NOT be created (1000 < 1200)
        const edgesBA = graph['edges'].get(tokenB.wrapped)?.get(tokenA.wrapped);
        expect(edgesBA).toBeUndefined();
    });

    test('beam search considers bottleneck liquidity across path segments', () => {
        const g = new PathGraph();

        // Create a scenario to test beam search behavior
        const midToken = new Token(1, '0xmid', 18);

        // Path 1: A -> mid -> D (high first hop, low second hop)
        const highFirst = createMockPool('highFirst', [tokenA, midToken], {
            getNormalizedLiquidity: () => 1000n,
        });
        const lowSecond = createMockPool('lowSecond', [midToken, tokenD], {
            getNormalizedLiquidity: () => 200n,
        });

        // Path 2: A -> mid -> D (medium first hop, high second hop)
        const medFirst = createMockPool('medFirst', [tokenA, midToken], {
            getNormalizedLiquidity: () => 800n,
        });
        const highSecond = createMockPool('highSecond', [midToken, tokenD], {
            getNormalizedLiquidity: () => 900n,
        });

        g.buildGraph({
            pools: [highFirst, lowSecond, medFirst, highSecond],
            enableAddRemoveLiquidityPaths: false,
            maxPathsPerTokenPair: 2,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenD,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                maxCandidatesPerTokenPath: 10,
                minSwapAmountRatio: 0.0,
            },
        });

        expect(paths.length).toBeGreaterThan(0);

        // Test that beam search generates multiple path combinations when available
        // The algorithm should explore different combinations of pools across segments
        const pathPools = paths.map((path) => path.pools.map((p) => p.id));

        // Should have at least one path (the algorithm always returns some result)
        expect(pathPools.length).toBeGreaterThanOrEqual(1);

        // Verify that valid pool combinations are created
        for (const poolIds of pathPools) {
            expect(poolIds.length).toBe(2); // Two-hop path
            expect(['highFirst', 'medFirst']).toContain(poolIds[0]);
            expect(['lowSecond', 'highSecond']).toContain(poolIds[1]);
        }
    });

    test('beam search maintains diversity across multiple good paths', () => {
        const g = new PathGraph();

        // Create multiple paths with similar quality to test diversity
        const mid1 = new Token(1, '0xmid1', 18);
        const mid2 = new Token(1, '0xmid2', 18);

        // Path 1: A -> mid1 -> D
        const path1_seg1 = createMockPool('p1s1', [tokenA, mid1], { getNormalizedLiquidity: () => 900n });
        const path1_seg2 = createMockPool('p1s2', [mid1, tokenD], { getNormalizedLiquidity: () => 850n });

        // Path 2: A -> mid2 -> D
        const path2_seg1 = createMockPool('p2s1', [tokenA, mid2], { getNormalizedLiquidity: () => 880n });
        const path2_seg2 = createMockPool('p2s2', [mid2, tokenD], { getNormalizedLiquidity: () => 870n });

        g.buildGraph({
            pools: [path1_seg1, path1_seg2, path2_seg1, path2_seg2],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenD,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                maxCandidatesPerTokenPath: 5,
                minSwapAmountRatio: 0.0,
            },
        });

        // Should find both paths since they have similar quality
        expect(paths.length).toBe(2);

        const usedMidTokens = new Set(paths.map((path) => path.tokens[1].address));
        expect(usedMidTokens.size).toBe(2); // Should use both mid tokens for diversity
    });

    test('handles add/remove liquidity paths when enabled', () => {
        const g = new PathGraph();

        // Create a more realistic scenario for add/remove liquidity paths
        // When enabled, pools can act as intermediate "tokens" for routing
        const bptPool = createMockPool('0xbptpool', [tokenA, tokenB]);
        const regularPool = createMockPool('regular', [tokenB, tokenC]);

        g.buildGraph({
            pools: [bptPool, regularPool],
            enableAddRemoveLiquidityPaths: true,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenC,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: { ...baseConfig },
        });

        // Should find the regular path A -> B -> C
        expect(paths.length).toBeGreaterThan(0);

        // Verify we can route through the intermediate token
        const pathExists = paths.some(
            (path) =>
                path.tokens.length === 3 &&
                path.tokens[0].address === tokenA.address &&
                path.tokens[1].address === tokenB.address &&
                path.tokens[2].address === tokenC.address,
        );
        expect(pathExists).toBe(true);

        // When enableAddRemoveLiquidityPaths is true, the pool address should be added as a potential node
        const nodes = (g as any).nodes;
        expect(nodes.has('0xbptpool')).toBe(true);
    });

    test('returns empty array when no edges exist for input token', () => {
        const g = new PathGraph();
        const orphanToken = new Token(1, '0xorphan', 18);

        g.buildGraph({
            pools: [createMockPool('p1', [tokenA, tokenB])],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: orphanToken, // Not connected to any pool
            tokenOut: tokenB,
            swapAmount: TokenAmount.fromRawAmount(orphanToken, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: { ...baseConfig },
        });

        expect(paths.length).toBe(0);
    });

    test('returns empty array when no edges exist for output token', () => {
        const g = new PathGraph();
        const orphanToken = new Token(1, '0xorphan', 18);

        g.buildGraph({
            pools: [createMockPool('p1', [tokenA, tokenB])],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: orphanToken, // Not connected to any pool
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: { ...baseConfig },
        });

        expect(paths.length).toBe(0);
    });

    test('handles pool swap failures gracefully during limit calculation', () => {
        const g = new PathGraph();

        const flakyPool = createMockPool('flaky', [tokenA, tokenB], {
            getLimitAmountSwap: () => {
                throw new Error('Pool swap failed');
            },
        });

        const goodPool = createMockPool('good', [tokenA, tokenB], {
            getLimitAmountSwap: () => 1000n,
        });

        g.buildGraph({
            pools: [flakyPool, goodPool],
            enableAddRemoveLiquidityPaths: false,
            maxPathsPerTokenPair: 2,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenB,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                minSwapAmountRatio: 0.5, // requires 500n
            },
        });

        // Should only return the good pool path, flaky pool should be filtered out
        expect(paths.length).toBe(1);
        expect(paths[0].pools[0].id as string).toBe('good');
    });

    test('handles zero normalizedLiquidity pools correctly', () => {
        const g = new PathGraph();

        const zeroLiqPool = createMockPool('zeroLiq', [tokenA, tokenB], {
            getNormalizedLiquidity: () => 0n,
            getLimitAmountSwap: () => 0n,
        });

        g.buildGraph({
            pools: [zeroLiqPool],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenB,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                minSwapAmountRatio: 0.1, // requires 100n
            },
        });

        expect(paths.length).toBe(0); // Should be filtered out due to insufficient limit
    });

    test('selectTopCandidatesPerTokenPath handles empty edge arrays', () => {
        const g = new PathGraph();
        g.buildGraph({
            pools: [createMockPool('p1', [tokenA, tokenB])],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        const edgesAB = (g as any).edges.get(tokenA.wrapped).get(tokenB.wrapped);
        const result = (g as any).selectTopCandidatesPerTokenPath(
            [edgesAB, []], // second segment has no edges
            5,
        );

        expect(result.length).toBe(0);
    });

    test('isValidPath correctly validates complex path constraints', () => {
        const g = new PathGraph();

        const bufferPool1 = createMockPool('buf1', [tokenA, tokenB], { poolType: 'Buffer' });
        const bufferPool2 = createMockPool('buf2', [tokenB, tokenC], { poolType: 'Buffer' });
        const bufferPool3 = createMockPool('buf3', [tokenC, tokenD], { poolType: 'Buffer' });

        g.buildGraph({
            pools: [bufferPool1, bufferPool2, bufferPool3],
            enableAddRemoveLiquidityPaths: false,
            swapKind: SwapKind.GivenIn,
            tokenPrices: new Map<string, number>(),
            minLimitThresholdUSD: 0,
        });

        // Create a path with 3 buffers
        const pathWith3Buffers = [
            {
                pool: bufferPool1,
                tokenIn: tokenA,
                tokenOut: tokenB,
                isBuffer: true,
                normalizedLiquidity: 100n,
                limitUSD: 1000,
            },
            {
                pool: bufferPool2,
                tokenIn: tokenB,
                tokenOut: tokenC,
                isBuffer: true,
                normalizedLiquidity: 100n,
                limitUSD: 1000,
            },
            {
                pool: bufferPool3,
                tokenIn: tokenC,
                tokenOut: tokenD,
                isBuffer: true,
                normalizedLiquidity: 100n,
                limitUSD: 1000,
            },
        ];

        const validResult = g['isValidPath']({
            path: pathWith3Buffers,
            config: { ...baseConfig, maxBuffersInPath: 5 },
            swapKind: SwapKind.GivenIn,
            minLimitThreshold: 0n,
        });

        const invalidResult = g['isValidPath']({
            path: pathWith3Buffers,
            config: { ...baseConfig, maxBuffersInPath: 2 },
            swapKind: SwapKind.GivenIn,
            minLimitThreshold: 0n,
        });

        expect(validResult).toBe(true);
        expect(invalidResult).toBe(false);
    });

    describe('performance-safety invariants', () => {
        const tokenA = new Token(1, '0xa', 18);
        const tokenB = new Token(1, '0xb', 18);
        const tokenC = new Token(1, '0xc', 18);

        test('edges are trimmed to top-K and kept in descending normalizedLiquidity order', () => {
            const g = new PathGraph();

            const pAB4 = createMockPool('pAB4', [tokenA, tokenB], { getNormalizedLiquidity: () => 400n });
            const pAB3 = createMockPool('pAB3', [tokenA, tokenB], { getNormalizedLiquidity: () => 300n });
            const pAB2 = createMockPool('pAB2', [tokenA, tokenB], { getNormalizedLiquidity: () => 200n });
            const pAB1 = createMockPool('pAB1', [tokenA, tokenB], { getNormalizedLiquidity: () => 100n });

            g.buildGraph({
                pools: [pAB1, pAB2, pAB3, pAB4],
                enableAddRemoveLiquidityPaths: false,
                maxPathsPerTokenPair: 3,
                swapKind: SwapKind.GivenIn,
                tokenPrices: new Map<string, number>(),
                minLimitThresholdUSD: 0,
            });

            const edges = (g as any).edges.get(tokenA.wrapped).get(tokenB.wrapped);
            const liqs = edges.map((e: any) => e.normalizedLiquidity);

            expect(edges.length).toBe(3);
            expect(liqs).toEqual([400n, 300n, 200n]); // strictly descending and top-3 kept
        });

        test('selectTopCandidatesPerTokenPath respects beamWidth cap', () => {
            const g = new PathGraph();

            const abPools = Array.from({ length: 5 }, (_, i) =>
                createMockPool(`pAB${i}`, [tokenA, tokenB], { getNormalizedLiquidity: () => BigInt(1000 - i) }),
            );
            const bcPools = Array.from({ length: 5 }, (_, i) =>
                createMockPool(`pBC${i}`, [tokenB, tokenC], { getNormalizedLiquidity: () => BigInt(1000 - i) }),
            );

            g.buildGraph({
                pools: [...abPools, ...bcPools],
                enableAddRemoveLiquidityPaths: false,
                maxPathsPerTokenPair: 5,
                swapKind: SwapKind.GivenIn,
                tokenPrices: new Map<string, number>(),
                minLimitThresholdUSD: 0,
            });

            const edgesAB = (g as any).edges.get(tokenA.wrapped).get(tokenB.wrapped);
            const edgesBC = (g as any).edges.get(tokenB.wrapped).get(tokenC.wrapped);

            const result = (g as any).selectTopCandidatesPerTokenPath(
                [edgesAB, edgesBC],
                3, // beamWidth
            );

            expect(result.length).toBeLessThanOrEqual(3);
        });

        test('getCandidatePaths respects maxCandidatesPerTokenPath when there is only a single token path', () => {
            const g = new PathGraph();

            const abPools = Array.from({ length: 6 }, (_, i) =>
                createMockPool(`pAB${i}`, [tokenA, tokenB], { getNormalizedLiquidity: () => BigInt(1000 - i) }),
            );
            const bcPools = Array.from({ length: 6 }, (_, i) =>
                createMockPool(`pBC${i}`, [tokenB, tokenC], { getNormalizedLiquidity: () => BigInt(1000 - i) }),
            );

            g.buildGraph({
                pools: [...abPools, ...bcPools],
                enableAddRemoveLiquidityPaths: false,
                maxPathsPerTokenPair: 6,
                swapKind: SwapKind.GivenIn,
                tokenPrices: new Map<string, number>(),
                minLimitThresholdUSD: 0,
            });

            const paths = g.getCandidatePaths({
                tokenIn: tokenA,
                tokenOut: tokenC,
                swapAmount: TokenAmount.fromRawAmount(tokenA, 1_000n),
                swapKind: SwapKind.GivenIn,
                graphTraversalConfig: {
                    ...baseConfig,
                    maxCandidatesPerTokenPath: 5,
                    minSwapAmountRatio: 0.0,
                },
            });

            expect(paths.length).toBeLessThanOrEqual(5);
        });
    });
});
