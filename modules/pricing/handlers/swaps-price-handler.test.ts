import { Chain } from '@prisma/client';
import { SwapsPriceHandler } from './swaps-price-handler';
import { TokenPriceData } from '../types';
import { SwapEvent } from '../../../prisma/prisma-types';

describe('SwapsPriceHandler', () => {
    let handler: SwapsPriceHandler;

    const baseMockSwapEvent: SwapEvent = {
        id: 'swap-1',
        type: 'SWAP',
        chain: Chain.MAINNET,
        poolId: '0xpool',
        blockNumber: 123456,
        blockTimestamp: Date.now(),
        logIndex: 0,
        tx: '0xtx',
        userAddress: '0xuser',
        protocolVersion: 2,
        valueUSD: 1000,
        payload: {
            fee: {
                address: '0xfee',
                amount: '1',
                valueUSD: '1',
            },
            tokenIn: {
                address: '0xtoken-unknown',
                amount: '100',
            },
            tokenOut: {
                address: '0xtoken-usdc',
                amount: '200',
            },
        },
    };

    beforeEach(() => {
        handler = new SwapsPriceHandler();
    });

    it('should calculate price for token based on swap with other token price', async () => {
        const mockSwapEvent = {
            ...baseMockSwapEvent,
            payload: {
                ...(baseMockSwapEvent.payload as any),
                tokenIn: {
                    address: '0xtoken-unknown', // Token we want to price
                    amount: '100', // 100 unknown tokens
                },
                tokenOut: {
                    address: '0xtoken-usdc', // Token with known price
                    amount: '200', // 200 USDC
                },
            },
        };

        const tokens: TokenPriceData[] = [
            {
                address: '0xtoken-unknown',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                latestSwaps: [mockSwapEvent],
            },
            {
                address: '0xtoken-usdc',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                currentPrice: 1.0, // USDC = $1
            },
        ];

        const allPrices = new Map<string, number>();
        tokens.forEach((token) => {
            if (token.currentPrice) {
                allPrices.set(token.address, token.currentPrice);
            }
        });

        const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0xtoken-unknown');
        expect(priceItems[0].chain).toBe(Chain.MAINNET);
        expect(priceItems[0].price).toBe(2.0); // (200 USDC * $1) / 100 unknown tokens = $2
        expect(priceItems[0].updatedBy).toBe('SwapsPriceHandlerService');
        expect(priceItems[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should calculate price when token is tokenOut in swap', async () => {
        const mockSwapEvent = {
            ...baseMockSwapEvent,
            id: 'swap-2',
            payload: {
                ...(baseMockSwapEvent.payload as any),
                tokenIn: {
                    address: '0xtoken-usdc', // Token with known price
                    amount: '50', // 50 USDC
                },
                tokenOut: {
                    address: '0xtoken-unknown', // Token we want to price
                    amount: '10', // 10 unknown tokens
                },
            },
        };

        const tokens: TokenPriceData[] = [
            {
                address: '0xtoken-unknown',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                latestSwaps: [mockSwapEvent],
            },
            {
                address: '0xtoken-usdc',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                currentPrice: 1.0, // USDC = $1
            },
        ];

        const allPrices = new Map<string, number>();
        tokens.forEach((token) => {
            if (token.currentPrice) {
                allPrices.set(token.address, token.currentPrice);
            }
        });

        const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0xtoken-unknown');
        expect(priceItems[0].price).toBe(5.0); // (50 USDC * $1) / 10 unknown tokens = $5
    });

    it('should skip swaps with low value (≤ $1)', async () => {
        const mockSwapEvent = {
            ...baseMockSwapEvent,
            id: 'swap-3',
            payload: {
                ...(baseMockSwapEvent.payload as any),
                tokenIn: {
                    address: '0xtoken-unknown',
                    amount: '100',
                },
                tokenOut: {
                    address: '0xtoken-usdc',
                    amount: '0.5', // Only $0.5 value
                },
            },
        };

        const tokens: TokenPriceData[] = [
            {
                address: '0xtoken-unknown',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                latestSwaps: [mockSwapEvent],
            },
            {
                address: '0xtoken-usdc',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                currentPrice: 1.0,
            },
        ];

        const allPrices = new Map<string, number>();
        tokens.forEach((token) => {
            if (token.currentPrice) {
                allPrices.set(token.address, token.currentPrice);
            }
        });

        const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

        expect(priceItems).toHaveLength(0); // Should skip low value swaps
    });

    it('should skip tokens without latestSwaps', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0xtoken-unknown',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                // No latestSwaps
            },
        ];

        const allPrices = new Map<string, number>();
        tokens.forEach((token) => {
            if (token.currentPrice) {
                allPrices.set(token.address, token.currentPrice);
            }
        });

        const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

        expect(priceItems).toHaveLength(0);
    });

    it('should skip BPT tokens', async () => {
        const mockSwapEvent = {
            ...baseMockSwapEvent,
            id: 'swap-4',
            payload: {
                ...(baseMockSwapEvent.payload as any),
                tokenIn: {
                    address: '0xbpt-token',
                    amount: '100',
                },
                tokenOut: {
                    address: '0xtoken-usdc',
                    amount: '200',
                },
            },
        };

        const tokens: TokenPriceData[] = [
            {
                address: '0xbpt-token',
                chain: Chain.MAINNET,
                types: ['BPT'], // BPT token should be skipped
                latestSwaps: [mockSwapEvent],
            },
            {
                address: '0xtoken-usdc',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                currentPrice: 1.0,
            },
        ];

        const allPrices = new Map<string, number>();
        tokens.forEach((token) => {
            if (token.currentPrice) {
                allPrices.set(token.address, token.currentPrice);
            }
        });

        const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

        expect(priceItems).toHaveLength(0); // Should skip BPT tokens
    });

    it('should skip swaps when other token price is not available', async () => {
        const mockSwapEvent = {
            ...baseMockSwapEvent,
            id: 'swap-5',
            payload: {
                ...(baseMockSwapEvent.payload as any),
                tokenIn: {
                    address: '0xtoken-unknown',
                    amount: '100',
                },
                tokenOut: {
                    address: '0xtoken-unknown-2', // Other token with no price
                    amount: '200',
                },
            },
        };

        const tokens: TokenPriceData[] = [
            {
                address: '0xtoken-unknown',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                latestSwaps: [mockSwapEvent],
            },
            {
                address: '0xtoken-unknown-2',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                // No currentPrice
            },
        ];

        const allPrices = new Map<string, number>();
        tokens.forEach((token) => {
            if (token.currentPrice) {
                allPrices.set(token.address, token.currentPrice);
            }
        });

        const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

        expect(priceItems).toHaveLength(0); // Should skip when other token price unavailable
    });

    it('should return handler name', () => {
        expect(handler.id).toBe('SwapsPriceHandlerService');
    });

    it('should have exitIfFails set to false', () => {
        expect(handler.exitIfFails).toBe(false);
    });

    it('should use prices from allPrices map including prices from previous handlers', async () => {
        const mockSwapEvent = {
            ...baseMockSwapEvent,
            id: 'swap-6',
            payload: {
                ...(baseMockSwapEvent.payload as any),
                tokenIn: {
                    address: '0xtoken-unknown',
                    amount: '50',
                },
                tokenOut: {
                    address: '0xtoken-dai', // Token not in current tokens array
                    amount: '100',
                },
            },
        };

        const tokens: TokenPriceData[] = [
            {
                address: '0xtoken-unknown',
                chain: Chain.MAINNET,
                types: ['ERC20'],
                latestSwaps: [mockSwapEvent],
                // No currentPrice
            },
        ];

        // Simulate allPrices map with prices from previous handlers
        const allPrices = new Map<string, number>();
        allPrices.set('0xtoken-dai', 1.0); // DAI price from previous handler (e.g., CoinGecko)

        const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0xtoken-unknown');
        expect(priceItems[0].price).toBe(2.0); // (100 DAI * $1) / 50 unknown tokens = $2
    });
});
