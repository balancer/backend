import { PathGraph } from './pathGraph';
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
    maxTokenPaths: 5,
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
            createMockPool('p1', [tokenA, tokenB]),
            createMockPool('p2', [tokenB, tokenC]),
            createMockPool('p3', [tokenC, tokenD]),
            createMockPool('p4', [tokenA, tokenD], { poolType: 'Buffer' }),
        ];
        graph = new PathGraph();
        graph.buildGraph({ pools, enableAddRemoveLiquidityPaths: false });
    });

    test('finds direct path', () => {
        const paths = graph['findAllValidTokenPaths']({
            token: tokenA.wrapped,
            tokenIn: tokenA.wrapped,
            tokenOut: tokenB.wrapped,
            tokenPath: [tokenA.wrapped],
            config: { ...baseConfig },
        });

        expect(paths).toContainEqual([tokenA.wrapped, tokenB.wrapped]);
    });

    test('avoids revisiting tokens (no cycles)', () => {
        // path A -> B -> A -> B should not appear
        const paths = graph['findAllValidTokenPaths']({
            token: tokenA.wrapped,
            tokenIn: tokenA.wrapped,
            tokenOut: tokenC.wrapped,
            tokenPath: [tokenA.wrapped],
            config: { ...baseConfig },
        });

        for (const path of paths) {
            const visited = new Set(path);
            expect(visited.size).toBe(path.length); // ensures no duplicate token
        }
    });

    test('respects maxDepth limit', () => {
        const paths = graph['findAllValidTokenPaths']({
            token: tokenA.wrapped,
            tokenIn: tokenA.wrapped,
            tokenOut: tokenD.wrapped,
            tokenPath: [tokenA.wrapped],
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
            maxRanksPerSegment: 2,
            approxPathsToReturn: 5,
        });

        expect(result.length).toBeGreaterThan(0);
        // path[0] should be p1 rank-0, path[1] should be p2 rank-0
        result.forEach((segments) => {
            expect(segments.every((s) => !!s.pool)).toBe(true);
        });
    });

    //
    // Added tests start here
    //

    test('findAllValidTokenPaths traversal order is depth-first (naming mismatch: traverseBfs is DFS)', () => {
        // Build a simple diamond: A->B->D and A->C->D, ensure neighbor order is B then C
        const g = new PathGraph();
        const localPools = [
            createMockPool('pAB', [tokenA, tokenB]),
            createMockPool('pAC', [tokenA, tokenC]),
            createMockPool('pBD', [tokenB, tokenD]),
            createMockPool('pCD', [tokenC, tokenD]),
        ];
        g.buildGraph({ pools: localPools, enableAddRemoveLiquidityPaths: false });

        const paths = g['findAllValidTokenPaths']({
            token: tokenA.wrapped,
            tokenIn: tokenA.wrapped,
            tokenOut: tokenD.wrapped,
            tokenPath: [tokenA.wrapped],
            config: { ...baseConfig },
        });

        // Expect DFS-like order: first via B, then via C
        expect(paths[0]).toEqual([tokenA.wrapped, tokenB.wrapped, tokenD.wrapped]);
        expect(paths[1]).toEqual([tokenA.wrapped, tokenC.wrapped, tokenD.wrapped]);
    });

    test('isValidPath rejects paths that reuse the same pool within a single path', () => {
        // Single tri-token pool can service both hops -> would reuse same pool
        const g = new PathGraph();
        const tri = createMockPool('pTri', [tokenA, tokenB, tokenC]);
        g.buildGraph({ pools: [tri], enableAddRemoveLiquidityPaths: false });

        const tokenPath = [tokenA.wrapped, tokenB.wrapped, tokenC.wrapped];

        // Expand to segments (likely both segments from pTri)
        const expanded = g['expandTokenPathWithBestRanks']({
            tokenPath,
            swapKind: SwapKind.GivenIn,
            minLimitThreshold: 1n,
            maxRanksPerSegment: 2,
            approxPathsToReturn: 5,
        });

        // Ensure at least one candidate uses the same pool twice (pTri)
        const candidateThatReusesPool = expanded.find(
            (segs) => new Set(segs.map((s) => s.pool.id)).size !== segs.length,
        );
        expect(candidateThatReusesPool).toBeDefined();

        // Validate isValidPath returns false for that candidate
        const isValid = g['isValidPath']({
            path: candidateThatReusesPool!,
            seenPoolAddresses: [],
            selectedPathIds: [],
            config: { ...baseConfig },
        });
        expect(isValid).toBe(false);
    });

    test('getCandidatePaths respects poolIdsToInclude whitelist (filters mixed paths)', () => {
        // A->B->C exists via p1 then p2, but we only allow p2 -> should filter out
        const g = new PathGraph();
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
        // Two buffer pools in sequence, but limit maxBuffersInPath=1 => filtered out
        const g = new PathGraph();
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
        // Three pools for the same pair A<->B with different liquidity; cap at K=2
        const g = new PathGraph();

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
            maxRanksPerSegment: 5, // try to explore more
            approxPathsToReturn: 10,
        });

        const poolsUsed = new Set<string>(result.map((segments) => segments[0].pool.id));

        expect(result.length).toBeLessThanOrEqual(2);
        expect(poolsUsed.has('pAB1')).toBe(true);
        expect(poolsUsed.has('pAB2')).toBe(true);
        expect(poolsUsed.has('pAB3')).toBe(false); // trimmed by top-K
    });

    test('expandTokenPathWithBestRanks is resilient even when ranks exceed available edges', () => {
        // Only one edge exists for A->B, but exploration limits are high
        const g = new PathGraph();
        const pAB = createMockPool('pAB', [tokenA, tokenB]);
        g.buildGraph({ pools: [pAB], enableAddRemoveLiquidityPaths: false });

        const result = g['expandTokenPathWithBestRanks']({
            tokenPath: [tokenA.wrapped, tokenB.wrapped],
            swapKind: SwapKind.GivenIn,
            minLimitThreshold: 1n,
            maxRanksPerSegment: 10, // > available edge ranks
            approxPathsToReturn: 10,
        });

        expect(result.length).toBe(1);
        expect(result[0][0].pool.id as string).toBe('pAB');
    });

    // Optional: illustrate the quantization issue in minSwapAmountRatio (tiny ratios < 0.01 become zero threshold)
    test('minSwapAmountRatio quantization can yield zero threshold for tiny ratios', () => {
        const g = new PathGraph();
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

        // Should return at least the direct path; this passes now,
        // but demonstrates that the threshold is effectively zero for tiny ratios.
        expect(paths.length).toBeGreaterThan(0);
    });

    test('reuses a pool across selected paths', () => {
        const g = new PathGraph();
        // pShared contains [B, C, D], so both B->D and C->D can use the same pool
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
            });

            const edges = (g as any).edges.get(tokenA.wrapped).get(tokenB.wrapped);
            const liqs = edges.map((e: any) => e.normalizedLiquidity);

            expect(edges.length).toBe(3);
            expect(liqs).toEqual([400n, 300n, 200n]); // strictly descending and top-3 kept
        });

        test('expandTokenPathWithBestRanks respects approxPathsToReturn cap', () => {
            const g = new PathGraph();

            // Create multiple ranks for both segments A->B and B->C
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
                maxRanksPerSegment: 5,
                approxPathsToReturn: 3,
            });

            expect(result.length).toBeLessThanOrEqual(3);
            expect(result.length).toBeGreaterThan(0);
        });

        test('getCandidatePaths respects approxPathsToReturn when there is only a single token path', () => {
            const g = new PathGraph();

            // Single token path A->B->C but many rank combinations per hop
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
                    minSwapAmountRatio: 0.0, // keep threshold minimal so many ranks qualify
                },
            });

            // Because there is only one token path, this should not exceed approxPathsToReturn.
            expect(paths.length).toBeLessThanOrEqual(5);
            expect(paths.length).toBeGreaterThan(0);
        });
    });
});
