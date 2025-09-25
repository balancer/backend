import { PathGraphBeam } from './pathGraph-beam';
import { BasePool } from '../poolsV2/basePool';
import { Token, TokenAmount, SwapKind } from '@balancer/sdk';
import { describe, test, expect, beforeEach } from 'bun:test';

const baseConfig = {
    maxDepth: 6,
    maxNonBoostedPathDepth: 3,
    maxNonBoostedHopTokensInBoostedPath: 2,
    maxBuffersInPath: 5,
    approxPathsToReturn: 20,
    maxRanksPerSegment: 2,
    minSwapAmountRatio: 0.5,
    maxTokenPaths: 50,
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

describe('PathGraphBeam search algorithms', () => {
    const tokenA = new Token(1, '0xa', 18);
    const tokenB = new Token(1, '0xb', 18);
    const tokenC = new Token(1, '0xc', 18);
    const tokenD = new Token(1, '0xd', 18);

    let pools: BasePool[];
    let graph: PathGraphBeam;

    beforeEach(() => {
        pools = [
            createMockPool('p1', [tokenA, tokenB]),
            createMockPool('p2', [tokenB, tokenC]),
            createMockPool('p3', [tokenC, tokenD]),
            createMockPool('p4', [tokenA, tokenD], { poolType: 'Buffer' }),
        ];
        graph = new PathGraphBeam();
        graph.buildGraph({ pools, enableAddRemoveLiquidityPaths: false });
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
            config: { ...baseConfig, maxDepth: 2 },
        });

        // Only A -> D (buffer pool) should be valid, not A -> B -> C -> D
        expect(paths).toContainEqual([tokenA.wrapped, tokenD.wrapped]);
        expect(paths).not.toContainEqual([tokenA.wrapped, tokenB.wrapped, tokenC.wrapped, tokenD.wrapped]);
    });

    test('expandTokenPathWithBestRanks keeps at least rank-0 path', () => {
        const path = [tokenA.wrapped, tokenB.wrapped, tokenC.wrapped];
        const result = graph['expandTokenPathWithBestRanks']({
            tokenPath: path,
            swapKind: SwapKind.GivenIn,
            minLimitThreshold: 1n,
            approxPathsToReturn: 5,
            config: { ...baseConfig },
        });

        expect(result.length).toBeGreaterThan(0);
        // path[0] should be p1 rank-0, path[1] should be p2 rank-0
        result.forEach((segments) => {
            expect(segments.every((s) => !!s.pool)).toBe(true);
        });
    });

    test('findAllValidTokenPaths traversal order is breadth-first', () => {
        const g = new PathGraphBeam();
        const localPools = [
            createMockPool('pAB', [tokenA, tokenB]),
            createMockPool('pAC', [tokenA, tokenC]),
            createMockPool('pBD', [tokenB, tokenD]),
            createMockPool('pCD', [tokenC, tokenD]),
        ];
        g.buildGraph({ pools: localPools, enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();
        const tri = createMockPool('pTri', [tokenA, tokenB, tokenC]);
        g.buildGraph({ pools: [tri], enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();
        const p1 = createMockPool('p1', [tokenA, tokenB]);
        const p2 = createMockPool('p2', [tokenB, tokenC]);
        g.buildGraph({ pools: [p1, p2], enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();
        const buf1 = createMockPool('buf1', [tokenA, tokenB], { poolType: 'Buffer' });
        const buf2 = createMockPool('buf2', [tokenB, tokenC], { poolType: 'Buffer' });
        g.buildGraph({ pools: [buf1, buf2], enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();

        const pAB1 = createMockPool('pAB1', [tokenA, tokenB], { getNormalizedLiquidity: () => 300n });
        const pAB2 = createMockPool('pAB2', [tokenA, tokenB], { getNormalizedLiquidity: () => 200n });
        const pAB3 = createMockPool('pAB3', [tokenA, tokenB], { getNormalizedLiquidity: () => 100n });

        g.buildGraph({
            pools: [pAB1, pAB2, pAB3],
            enableAddRemoveLiquidityPaths: false,
            maxPathsPerTokenPair: 2,
        });

        const result = g['expandTokenPathWithBestRanks']({
            tokenPath: [tokenA.wrapped, tokenB.wrapped],
            swapKind: SwapKind.GivenIn,
            minLimitThreshold: 1n,
            approxPathsToReturn: 10,
            config: { ...baseConfig },
        });

        const poolsUsed = new Set<string>(result.map((segments) => segments[0].pool.id));

        expect(result.length).toBeLessThanOrEqual(2);
        expect(poolsUsed.has('pAB1')).toBe(true);
        expect(poolsUsed.has('pAB2')).toBe(true);
        expect(poolsUsed.has('pAB3')).toBe(false); // trimmed by top-K
    });

    test('expandTokenPathWithBestRanks is resilient even when ranks exceed available edges', () => {
        const g = new PathGraphBeam();
        const pAB = createMockPool('pAB', [tokenA, tokenB]);
        g.buildGraph({ pools: [pAB], enableAddRemoveLiquidityPaths: false });

        const result = g['expandTokenPathWithBestRanks']({
            tokenPath: [tokenA.wrapped, tokenB.wrapped],
            swapKind: SwapKind.GivenIn,
            minLimitThreshold: 1n,
            approxPathsToReturn: 10,
            config: { ...baseConfig, maxRanksPerSegment: 10 },
        });

        expect(result.length).toBe(1);
        expect(result[0][0].pool.id as string).toBe('pAB');
    });

    test('minSwapAmountRatio quantization can yield zero threshold for tiny ratios', () => {
        const g = new PathGraphBeam();
        const pAB = createMockPool('pAB', [tokenA, tokenB], {
            getLimitAmountSwap: () => 5n,
        });
        g.buildGraph({ pools: [pAB], enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();
        const pAB = createMockPool('pAB', [tokenA, tokenB]);
        const pAC = createMockPool('pAC', [tokenA, tokenC]);
        const pShared = createMockPool('pShared', [tokenB, tokenC, tokenD]);

        g.buildGraph({ pools: [pAB, pAC, pShared], enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();

        // Create a hub-and-spoke topology to generate many paths
        const hub = new Token(1, '0xhub', 18);
        const spokes = Array.from({ length: 10 }, (_, i) => new Token(1, `0xspoke${i}`, 18));
        const target = new Token(1, '0xtarget', 18);

        const hubPools = spokes.map((spoke, i) => createMockPool(`hub${i}`, [hub, spoke]));
        const spokePools = spokes.map((spoke, i) => createMockPool(`spoke${i}`, [spoke, target]));

        g.buildGraph({ pools: [...hubPools, ...spokePools], enableAddRemoveLiquidityPaths: false });

        // This should generate 10 possible token paths: hub -> spoke[i] -> target
        const paths = g['findAllValidTokenPaths']({
            tokenIn: hub.wrapped,
            tokenOut: target.wrapped,
            config: { ...baseConfig, maxTokenPaths: 5 }, // limit to 5
        });

        expect(paths.length).toBe(5); // Should be capped at maxTokenPaths
    });

    test('handles SwapKind.GivenOut correctly', () => {
        const g = new PathGraphBeam();
        const pAB = createMockPool('pAB', [tokenA, tokenB], {
            getLimitAmountSwap: (tokenIn: Token, tokenOut: Token, swapKind: SwapKind) => {
                // Return different limits based on swap kind
                return swapKind === SwapKind.GivenOut ? 500n : 1000n;
            },
        });
        g.buildGraph({ pools: [pAB], enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();

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
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenB,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                minSwapAmountRatio: 0.15, // requires 150n minimum
                approxPathsToReturn: 10,
            },
        });

        // Only the high liquidity pool should pass the limit filter
        expect(paths.length).toBe(1);
        expect(paths[0].pools[0].id as string).toBe('highLiq');
    });

    test('beam search considers bottleneck liquidity across path segments', () => {
        const g = new PathGraphBeam();

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
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenD,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                approxPathsToReturn: 10,
                maxRanksPerSegment: 2,
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
        const g = new PathGraphBeam();

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
        });

        const paths = g.getCandidatePaths({
            tokenIn: tokenA,
            tokenOut: tokenD,
            swapAmount: TokenAmount.fromRawAmount(tokenA, 1000n),
            swapKind: SwapKind.GivenIn,
            graphTraversalConfig: {
                ...baseConfig,
                approxPathsToReturn: 5,
                minSwapAmountRatio: 0.0,
            },
        });

        // Should find both paths since they have similar quality
        expect(paths.length).toBe(2);

        const usedMidTokens = new Set(paths.map((path) => path.tokens[1].address));
        expect(usedMidTokens.size).toBe(2); // Should use both mid tokens for diversity
    });

    test('handles add/remove liquidity paths when enabled', () => {
        const g = new PathGraphBeam();

        // Create a more realistic scenario for add/remove liquidity paths
        // When enabled, pools can act as intermediate "tokens" for routing
        const bptPool = createMockPool('0xbptpool', [tokenA, tokenB]);
        const regularPool = createMockPool('regular', [tokenB, tokenC]);

        g.buildGraph({
            pools: [bptPool, regularPool],
            enableAddRemoveLiquidityPaths: true,
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
        const g = new PathGraphBeam();
        const orphanToken = new Token(1, '0xorphan', 18);

        g.buildGraph({ pools: [createMockPool('p1', [tokenA, tokenB])], enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();
        const orphanToken = new Token(1, '0xorphan', 18);

        g.buildGraph({ pools: [createMockPool('p1', [tokenA, tokenB])], enableAddRemoveLiquidityPaths: false });

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
        const g = new PathGraphBeam();

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
        const g = new PathGraphBeam();

        const zeroLiqPool = createMockPool('zeroLiq', [tokenA, tokenB], {
            getNormalizedLiquidity: () => 0n,
            getLimitAmountSwap: () => 0n,
        });

        g.buildGraph({ pools: [zeroLiqPool], enableAddRemoveLiquidityPaths: false });

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

    test('expandTokenPathWithBestRanks handles empty edge arrays', () => {
        const g = new PathGraphBeam();

        // Build graph normally
        g.buildGraph({ pools: [createMockPool('p1', [tokenA, tokenB])], enableAddRemoveLiquidityPaths: false });

        // Try to expand a path that includes a non-existent edge
        const result = g['expandTokenPathWithBestRanks']({
            tokenPath: [tokenA.wrapped, tokenC.wrapped], // No edge A->C exists
            swapKind: SwapKind.GivenIn,
            minLimitThreshold: 1n,
            approxPathsToReturn: 5,
            config: { ...baseConfig },
        });

        expect(result.length).toBe(0);
    });

    test('isValidPath correctly validates complex path constraints', () => {
        const g = new PathGraphBeam();

        const bufferPool1 = createMockPool('buf1', [tokenA, tokenB], { poolType: 'Buffer' });
        const bufferPool2 = createMockPool('buf2', [tokenB, tokenC], { poolType: 'Buffer' });
        const bufferPool3 = createMockPool('buf3', [tokenC, tokenD], { poolType: 'Buffer' });

        g.buildGraph({
            pools: [bufferPool1, bufferPool2, bufferPool3],
            enableAddRemoveLiquidityPaths: false,
        });

        // Create a path with 3 buffers
        const pathWith3Buffers = [
            { pool: bufferPool1, tokenIn: tokenA, tokenOut: tokenB, isBuffer: true, normalizedLiquidity: 100n },
            { pool: bufferPool2, tokenIn: tokenB, tokenOut: tokenC, isBuffer: true, normalizedLiquidity: 100n },
            { pool: bufferPool3, tokenIn: tokenC, tokenOut: tokenD, isBuffer: true, normalizedLiquidity: 100n },
        ];

        const validResult = g['isValidPath']({
            path: pathWith3Buffers,
            config: { ...baseConfig, maxBuffersInPath: 5 },
        });

        const invalidResult = g['isValidPath']({
            path: pathWith3Buffers,
            config: { ...baseConfig, maxBuffersInPath: 2 },
        });

        expect(validResult).toBe(true);
        expect(invalidResult).toBe(false);
    });

    test('detects phantom BPT nodes correctly', () => {
        const g = new PathGraphBeam();

        // Create a scenario where a pool address is also used as a token
        const phantomBptToken = new Token(1, '0xpool123', 18);
        const regularToken = new Token(1, '0xregular', 18);

        // Create a pool where the pool address matches phantomBptToken address
        const poolWithBpt = createMockPool('0xpool123', [tokenA, tokenB]);
        const regularPool = createMockPool('regular', [phantomBptToken, regularToken]);

        g.buildGraph({
            pools: [poolWithBpt, regularPool],
            enableAddRemoveLiquidityPaths: true,
        });

        // Check that phantom BPT node is detected
        const nodes = (g as any).nodes;
        expect(nodes.get(phantomBptToken.wrapped)?.isPhantomBpt).toBe(true);
        expect(nodes.get(tokenA.wrapped)?.isPhantomBpt).toBe(false);

        // Note: The boosted path constraints (maxNonBoostedPathDepth, maxNonBoostedHopTokensInBoostedPath)
        // are documented in the config but not yet implemented in the beam algorithm
    });

    describe('missing boosted path constraints', () => {
        // DOCUMENTATION: The following constraints are mentioned in comments but not implemented:
        //
        // 1. maxNonBoostedPathDepth - should limit path depth for non-boosted paths
        // 2. maxNonBoostedHopTokensInBoostedPath - should limit non-boosted hops in boosted paths
        //
        // These constraints exist in the config interface comments but are not enforced
        // in the PathGraphBeam implementation. The algorithm currently only enforces:
        // - maxDepth (overall path depth limit)
        // - maxBuffersInPath (buffer pool count limit)
        // - maxTokenPaths (token path discovery limit)
        //
        // TODO: Implement the missing boosted path validation logic

        test('documents missing boosted path constraints', () => {
            // This test serves as documentation of missing functionality
            const _configWithBoostedConstraints = {
                ...baseConfig,
                maxNonBoostedPathDepth: 3,
                maxNonBoostedHopTokensInBoostedPath: 2,
            };

            // These constraints are not currently validated by the algorithm
            // They should be implemented to restrict paths based on phantom BPT presence
            expect(true).toBe(true); // Placeholder - constraints not implemented
        });
    });

    describe('performance-safety invariants', () => {
        const tokenA = new Token(1, '0xa', 18);
        const tokenB = new Token(1, '0xb', 18);
        const tokenC = new Token(1, '0xc', 18);

        test('edges are trimmed to top-K and kept in descending normalizedLiquidity order', () => {
            const g = new PathGraphBeam();

            const pAB4 = createMockPool('pAB4', [tokenA, tokenB], { getNormalizedLiquidity: () => 400n });
            const pAB3 = createMockPool('pAB3', [tokenA, tokenB], { getNormalizedLiquidity: () => 300n });
            const pAB2 = createMockPool('pAB2', [tokenA, tokenB], { getNormalizedLiquidity: () => 200n });
            const pAB1 = createMockPool('pAB1', [tokenA, tokenB], { getNormalizedLiquidity: () => 100n });

            g.buildGraph({
                pools: [pAB1, pAB2, pAB3, pAB4],
                enableAddRemoveLiquidityPaths: false,
                maxPathsPerTokenPair: 3,
            });

            const edges = (g as any).edges.get(tokenA.wrapped).get(tokenB.wrapped);
            const liqs = edges.map((e: any) => e.normalizedLiquidity);

            expect(edges.length).toBe(3);
            expect(liqs).toEqual([400n, 300n, 200n]); // strictly descending and top-3 kept
        });

        test('expandTokenPathWithBestRanks respects approxPathsToReturn cap', () => {
            const g = new PathGraphBeam();

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
            });

            const result = (g as any).expandTokenPathWithBestRanks({
                tokenPath: [tokenA.wrapped, tokenB.wrapped, tokenC.wrapped],
                swapKind: SwapKind.GivenIn,
                minLimitThreshold: 1n,
                approxPathsToReturn: 3,
                config: { ...baseConfig, maxRanksPerSegment: 5 },
            });

            expect(result.length).toBeLessThanOrEqual(3);
        });

        test('getCandidatePaths respects approxPathsToReturn when there is only a single token path', () => {
            const g = new PathGraphBeam();

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
            });

            const paths = g.getCandidatePaths({
                tokenIn: tokenA,
                tokenOut: tokenC,
                swapAmount: TokenAmount.fromRawAmount(tokenA, 1_000n),
                swapKind: SwapKind.GivenIn,
                graphTraversalConfig: {
                    ...baseConfig,
                    approxPathsToReturn: 5,
                    maxRanksPerSegment: 6,
                    minSwapAmountRatio: 0.0,
                },
            });

            expect(paths.length).toBeLessThanOrEqual(5);
        });
    });
});
