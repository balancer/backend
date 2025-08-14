import { describe, it, expect, beforeEach } from 'bun:test';
import { FallbackPriceHandler } from './fallback-price-handler';
import { Chain } from '@prisma/client';
import { TokenPriceData } from '../types';

describe('FallbackPriceHandler', () => {
    let handler: FallbackPriceHandler;

    beforeEach(() => {
        handler = new FallbackPriceHandler();
    });

    describe('calculatePricesForTokens', () => {
        it('should return prices for tokens that exist in allPrices map', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xtoken2',
                    chain: Chain.ARBITRUM,
                    types: ['ERC20'],
                },
                {
                    address: '0xtoken3',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xtoken1', { price: 1.5, updatedBy: 'initial' });
            allPrices.set('0xtoken2', { price: 2.0, updatedBy: 'initial' });
            // token3 not in allPrices

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(2);
            expect(priceItems[0]).toEqual({
                address: '0xtoken1',
                chain: Chain.MAINNET,
                price: 1.5,
                updatedAt: expect.any(Date),
                updatedBy: 'FallbackHandlerService',
            });
            expect(priceItems[1]).toEqual({
                address: '0xtoken2',
                chain: Chain.ARBITRUM,
                price: 2.0,
                updatedAt: expect.any(Date),
                updatedBy: 'FallbackHandlerService',
            });
        });

        it('should return empty array when no tokens are provided', async () => {
            const tokens: TokenPriceData[] = [];
            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xtoken1', { price: 1.5, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should return empty array when allPrices is not provided', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0);
        });

        it('should return empty array when allPrices is empty', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should return empty array when no tokens have prices in allPrices', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xtoken2',
                    chain: Chain.ARBITRUM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xtoken3', { price: 1.5, updatedBy: 'initial' }); // Different token

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle multiple chains correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xtoken2',
                    chain: Chain.ARBITRUM,
                    types: ['ERC20'],
                },
                {
                    address: '0xtoken3',
                    chain: Chain.POLYGON,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xtoken1', { price: 1.0, updatedBy: 'initial' });
            allPrices.set('0xtoken2', { price: 2.0, updatedBy: 'initial' });
            allPrices.set('0xtoken3', { price: 3.0, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(3);
            expect(priceItems.find((p) => p.address === '0xtoken1')?.chain).toBe(Chain.MAINNET);
            expect(priceItems.find((p) => p.address === '0xtoken2')?.chain).toBe(Chain.ARBITRUM);
            expect(priceItems.find((p) => p.address === '0xtoken3')?.chain).toBe(Chain.POLYGON);
        });

        it('should handle high precision prices correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xtoken1', { price: 1.123456789, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].price).toBe(1.123456789);
        });

        it('should handle zero prices correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xtoken1', { price: 0, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].price).toBe(0);
        });

        it('should accept all token types', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xtoken2',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
                {
                    address: '0xtoken3',
                    chain: Chain.MAINNET,
                    types: ['ERC4626'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xtoken1', { price: 1.0, updatedBy: 'initial' });
            allPrices.set('0xtoken2', { price: 2.0, updatedBy: 'initial' });
            allPrices.set('0xtoken3', { price: 3.0, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(3);
        });
    });

    describe('handler properties', () => {
        it('should have correct handler ID', () => {
            expect(handler.id).toBe('FallbackHandlerService');
        });

        it('should have exitIfFails set to false', () => {
            expect(handler.exitIfFails).toBe(false);
        });
    });
});
