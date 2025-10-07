import { BasePool } from '../../poolsV2/basePool';
import { Token, TokenAmount } from '@balancer/sdk';

export interface GraphTopology {
    name: 'hub-spoke' | 'dense-mesh' | 'chain-bridges' | 'realistic-defi';
    description: string;
    generator: (tokenCount: number, poolCount: number) => { tokens: Token[]; pools: BasePool[] };
}

export interface GraphSpec {
    name: string;
    tokens: number;
    pools: number;
    type: GraphTopology['name'];
}

export const topologies: Record<GraphTopology['name'], GraphTopology> = {
    'hub-spoke': {
        name: 'hub-spoke',
        description: 'Central hub with radiating spokes',
        generator: (tokenCount: number, poolCount: number) => {
            const tokens: Token[] = [];
            const pools: BasePool[] = [];

            // Hub token (WETH-like)
            const hubToken = new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18);
            tokens.push(hubToken);

            // Spoke tokens
            for (let i = 0; i < tokenCount - 1; i++) {
                tokens.push(new Token(1, `0x${(0x1000 + i).toString(16).padStart(40, '0')}`, 18));
            }

            let poolsCreated = 0;

            // Hub-to-spoke pools (high liquidity)
            for (let i = 1; i < tokenCount && poolsCreated < poolCount; i++) {
                pools.push(
                    createMockPool(`hub-${i}`, [hubToken, tokens[i]], {
                        getNormalizedLiquidity: () => BigInt(Math.floor(Math.random() * 5000) + 2000),
                        getLimitAmountSwap: () => BigInt(Math.floor(Math.random() * 10000000) + 1000000),
                    }),
                );
                poolsCreated++;
            }

            // Spoke-to-spoke pools (medium liquidity)
            while (poolsCreated < poolCount && tokenCount > 2) {
                const idx1 = 1 + Math.floor(Math.random() * (tokenCount - 1));
                const idx2 = 1 + Math.floor(Math.random() * (tokenCount - 1));
                if (idx1 !== idx2) {
                    pools.push(
                        createMockPool(`spoke-${poolsCreated}`, [tokens[idx1], tokens[idx2]], {
                            getNormalizedLiquidity: () => BigInt(Math.floor(Math.random() * 1000) + 200),
                            getLimitAmountSwap: () => BigInt(Math.floor(Math.random() * 5000000) + 500000),
                        }),
                    );
                    poolsCreated++;
                }
            }

            return { tokens, pools };
        },
    },
    'dense-mesh': {
        name: 'dense-mesh',
        description: 'High connectivity mesh network',
        generator: (tokenCount: number, poolCount: number) => {
            const tokens: Token[] = [];
            const pools: BasePool[] = [];

            for (let i = 0; i < tokenCount; i++) {
                tokens.push(new Token(1, `0x${(0x2000 + i).toString(16).padStart(40, '0')}`, 18));
            }

            const maxPossiblePools = (tokenCount * (tokenCount - 1)) / 2;
            const actualPoolCount = Math.min(poolCount, maxPossiblePools);
            const connections = new Set<string>();

            while (connections.size < actualPoolCount) {
                const i = Math.floor(Math.random() * tokenCount);
                const j = Math.floor(Math.random() * tokenCount);

                if (i !== j) {
                    const key = [i, j].sort().join('-');
                    if (!connections.has(key)) {
                        connections.add(key);
                        const liquidity = BigInt(Math.floor(Math.random() * 3000) + 100);
                        pools.push(
                            createMockPool(`mesh-${key}`, [tokens[i], tokens[j]], {
                                getNormalizedLiquidity: () => liquidity,
                                getLimitAmountSwap: () => liquidity * 1000n,
                            }),
                        );
                    }
                }
            }

            return { tokens, pools };
        },
    },
    'chain-bridges': {
        name: 'chain-bridges',
        description: 'Token chains with bridge connections',
        generator: (tokenCount: number, poolCount: number) => {
            const tokens: Token[] = [];
            const pools: BasePool[] = [];

            for (let i = 0; i < tokenCount; i++) {
                tokens.push(new Token(1, `0x${(0x3000 + i).toString(16).padStart(40, '0')}`, 18));
            }

            let poolsCreated = 0;

            // Main chain
            for (let i = 0; i < tokenCount - 1 && poolsCreated < poolCount; i++) {
                pools.push(
                    createMockPool(`chain-${i}`, [tokens[i], tokens[i + 1]], {
                        getNormalizedLiquidity: () => BigInt(Math.floor(Math.random() * 2000) + 500),
                        getLimitAmountSwap: () => BigInt(Math.floor(Math.random() * 8000000) + 1000000),
                    }),
                );
                poolsCreated++;
            }

            // Bridge connections (skip ahead)
            while (poolsCreated < poolCount) {
                const start = Math.floor(Math.random() * (tokenCount - 3));
                const skipDistance = Math.floor(Math.random() * 5) + 2;
                const end = Math.min(start + skipDistance, tokenCount - 1);

                pools.push(
                    createMockPool(`bridge-${poolsCreated}`, [tokens[start], tokens[end]], {
                        getNormalizedLiquidity: () => BigInt(Math.floor(Math.random() * 1500) + 300),
                        getLimitAmountSwap: () => BigInt(Math.floor(Math.random() * 6000000) + 800000),
                    }),
                );
                poolsCreated++;
            }

            return { tokens, pools };
        },
    },
    'realistic-defi': {
        name: 'realistic-defi',
        description: 'Simulates realistic DeFi token distribution',
        generator: (tokenCount: number, poolCount: number) => {
            const tokens: Token[] = [];
            const pools: BasePool[] = [];

            // Major tokens (ETH, USDC, USDT, DAI, WBTC equivalent)
            const majorTokens = [
                new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18), // WETH
                new Token(1, '0xA0b86a33E6441942b3B9F1c882e6F2A5A86E1B5F', 6), // USDC-like
                new Token(1, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6), // USDT-like
                new Token(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18), // DAI-like
                new Token(1, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 8), // WBTC-like
            ];

            tokens.push(...majorTokens.slice(0, Math.min(5, tokenCount)));

            // Add remaining tokens as smaller altcoins
            for (let i = majorTokens.length; i < tokenCount; i++) {
                tokens.push(new Token(1, `0x${(0x4000 + i).toString(16).padStart(40, '0')}`, 18));
            }

            let poolsCreated = 0;

            // Major-to-major pairs (highest liquidity)
            for (let i = 0; i < Math.min(5, tokens.length) && poolsCreated < poolCount; i++) {
                for (let j = i + 1; j < Math.min(5, tokens.length) && poolsCreated < poolCount; j++) {
                    pools.push(
                        createMockPool(`major-${i}-${j}`, [tokens[i], tokens[j]], {
                            getNormalizedLiquidity: () => BigInt(Math.floor(Math.random() * 10000) + 5000),
                            getLimitAmountSwap: () => BigInt(Math.floor(Math.random() * 50000000) + 10000000),
                            poolType: Math.random() > 0.5 ? 'Weighted' : 'Stable',
                        }),
                    );
                    poolsCreated++;
                }
            }

            // Major-to-altcoin pairs (medium liquidity)
            for (let i = 5; i < tokens.length && poolsCreated < poolCount; i++) {
                const majorIdx = Math.floor(Math.random() * Math.min(5, tokens.length));
                pools.push(
                    createMockPool(`major-alt-${i}`, [tokens[majorIdx], tokens[i]], {
                        getNormalizedLiquidity: () => BigInt(Math.floor(Math.random() * 2000) + 200),
                        getLimitAmountSwap: () => BigInt(Math.floor(Math.random() * 10000000) + 1000000),
                    }),
                );
                poolsCreated++;
            }

            // Altcoin-to-altcoin pairs (low liquidity)
            while (poolsCreated < poolCount && tokens.length > 5) {
                const i = 5 + Math.floor(Math.random() * (tokens.length - 5));
                const j = 5 + Math.floor(Math.random() * (tokens.length - 5));
                if (i !== j) {
                    pools.push(
                        createMockPool(`alt-alt-${poolsCreated}`, [tokens[i], tokens[j]], {
                            getNormalizedLiquidity: () => BigInt(Math.floor(Math.random() * 500) + 50),
                            getLimitAmountSwap: () => BigInt(Math.floor(Math.random() * 2000000) + 100000),
                        }),
                    );
                    poolsCreated++;
                }
            }

            return { tokens, pools };
        },
    },
};

function createMockPool(id: string, tokens: Token[], opts: Partial<BasePool> = {}): BasePool {
    return {
        id,
        address: id.startsWith('0x') ? id : `0x${id.padEnd(40, '0')}`,
        poolType: opts.poolType ?? 'Weighted',
        tokens: tokens.map((t) => ({ token: t })),
        getNormalizedLiquidity: opts.getNormalizedLiquidity ?? (() => 100n),
        getLimitAmountSwap: opts.getLimitAmountSwap ?? (() => 1_000_000n),
        swapGivenOut: opts.swapGivenOut ?? ((_in: Token, _out: Token, amt: TokenAmount) => amt),
        ...opts,
    } as unknown as BasePool;
}
