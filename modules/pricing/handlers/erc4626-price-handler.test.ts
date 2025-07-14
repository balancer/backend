import { Chain } from '@prisma/client';
import { ERC4626PriceHandler } from './erc4626-price-handler';
import { TokenPriceData } from '../types';

describe('ERC4626PriceHandler', () => {
    let handler: ERC4626PriceHandler;

    beforeEach(() => {
        handler = new ERC4626PriceHandler();
    });

    it('should calculate price for ERC4626 token based on underlying price and unwrap rate', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0x1234567890123456789012345678901234567890',
                chain: Chain.MAINNET,
                types: ['ERC4626'],
                underlyingTokenAddress: '0xA0b86a33E6441b8E4D6d3E7b8A0b86A33e6441B8',
                unwrapRate: '1.05', // 5% premium
                underlyingTokenPrice: 100,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0x1234567890123456789012345678901234567890');
        expect(priceItems[0].chain).toBe(Chain.MAINNET);
        expect(priceItems[0].price).toBe(105); // 100 * 1.05
        expect(priceItems[0].updatedBy).toBe('ERC4626PriceHandlerService');
        expect(priceItems[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should return handler name', () => {
        expect(handler.id).toBe('ERC4626PriceHandlerService');
    });

    it('should have exitIfFails set to false', () => {
        expect(handler.exitIfFails).toBe(false);
    });

    it('should ignore non-ERC4626 tokens', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0x1234567890123456789012345678901234567890',
                chain: Chain.MAINNET,
                types: ['BPT'],
                underlyingTokenAddress: '0xA0b86a33E6441b8E4D6d3E7b8A0b86A33e6441B8',
                unwrapRate: '1.05',
                underlyingTokenPrice: 100,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });

    it('should skip tokens without underlying token address', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0x1234567890123456789012345678901234567890',
                chain: Chain.MAINNET,
                types: ['ERC4626'],
                unwrapRate: '1.05',
                underlyingTokenPrice: undefined,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });

    it('should skip tokens without underlying price data', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0x1234567890123456789012345678901234567890',
                chain: Chain.MAINNET,
                types: ['ERC4626'],
                underlyingTokenAddress: '0xA0b86a33E6441b8E4D6d3E7b8A0b86A33e6441B8',
                unwrapRate: '1.05',
                underlyingTokenPrice: undefined, // No underlying price
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });

    it('should handle default unwrap rate of 1', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0x1234567890123456789012345678901234567890',
                chain: Chain.MAINNET,
                types: ['ERC4626'],
                underlyingTokenAddress: '0xA0b86a33E6441b8E4D6d3E7b8A0b86A33e6441B8',
                // unwrapRate not provided, should default to 1
                underlyingTokenPrice: 100,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].price).toBe(100); // 100 * 1 (default rate)
    });
});
