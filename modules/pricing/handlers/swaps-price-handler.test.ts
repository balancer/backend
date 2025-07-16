import { Chain } from '@prisma/client';
import { SwapsPriceHandler } from './swaps-price-handler';
import { TokenPriceData } from '../types';
import { SwapEvent } from '../../../prisma/prisma-types';

describe('SwapsPriceHandler', () => {
    let handler: SwapsPriceHandler;

    beforeEach(() => {
        handler = new SwapsPriceHandler();
    });

    it('should calculate price for token based on swap with other token price', async () => {
        const mockSwapEvent: SwapEvent = {
            id: 'swap-1',
            type: 'SWAP',
            chain: Chain.MAINNET,
            poolId: '0xpool',
            blockNumber: 123456,
            blockTimestamp: Date.now(),
            logIndex: 0,
            transactionHash: '0xtx',
            userAddress: '0xuser',
            valueUSD: '1000',
            payload: {
                fee: {
                    address: '0xfee',
                    amount: '1',
                    valueUSD: '1',
                },
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

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0xtoken-unknown');
        expect(priceItems[0].chain).toBe(Chain.MAINNET);
        expect(priceItems[0].price).toBe(2.0); // (200 USDC * $1) / 100 unknown tokens = $2
        expect(priceItems[0].updatedBy).toBe('SwapsPriceHandlerService');
        expect(priceItems[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should calculate price when token is tokenOut in swap', async () => {
        const mockSwapEvent: SwapEvent = {
            id: 'swap-2',
            type: 'SWAP',
            chain: Chain.MAINNET,
            poolId: '0xpool',
            blockNumber: 123456,
            blockTimestamp: Date.now(),
            logIndex: 0,
            transactionHash: '0xtx',
            userAddress: '0xuser',
            valueUSD: '1000',
            payload: {
                fee: {
                    address: '0xfee',
                    amount: '1',
                    valueUSD: '1',
                },
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

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0xtoken-unknown');
        expect(priceItems[0].price).toBe(5.0); // (50 USDC * $1) / 10 unknown tokens = $5
    });

    it('should skip swaps with low value (≤ $1)', async () => {
        const mockSwapEvent: SwapEvent = {
            id: 'swap-3',
            type: 'SWAP',
            chain: Chain.MAINNET,
            poolId: '0xpool',
            blockNumber: 123456,
            blockTimestamp: Date.now(),
            logIndex: 0,
            transactionHash: '0xtx',
            userAddress: '0xuser',
            valueUSD: '1000',
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

        const priceItems = await handler.calculatePricesForTokens(tokens);

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

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });

    it('should skip BPT tokens', async () => {
        const mockSwapEvent: SwapEvent = {
            id: 'swap-4',
            type: 'SWAP',
            chain: Chain.MAINNET,
            poolId: '0xpool',
            blockNumber: 123456,
            blockTimestamp: Date.now(),
            logIndex: 0,
            transactionHash: '0xtx',
            userAddress: '0xuser',
            valueUSD: '1000',
            payload: {
                fee: {
                    address: '0xfee',
                    amount: '1',
                    valueUSD: '1',
                },
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

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0); // Should skip BPT tokens
    });

    it('should skip swaps when other token price is not available', async () => {
        const mockSwapEvent: SwapEvent = {
            id: 'swap-5',
            type: 'SWAP',
            chain: Chain.MAINNET,
            poolId: '0xpool',
            blockNumber: 123456,
            blockTimestamp: Date.now(),
            logIndex: 0,
            transactionHash: '0xtx',
            userAddress: '0xuser',
            valueUSD: '1000',
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

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0); // Should skip when other token price unavailable
    });

    it('should return handler name', () => {
        expect(handler.id).toBe('SwapsPriceHandlerService');
    });

    it('should have exitIfFails set to false', () => {
        expect(handler.exitIfFails).toBe(false);
    });
});