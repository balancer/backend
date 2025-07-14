import { Chain } from '@prisma/client';
import { CoingeckoPriceHandler } from './coingecko-price-handler';
import { TokenPriceData } from '../types';

describe('CoingeckoPriceHandler', () => {
    const mockConfig = {
        excludedTokenAddresses: [],
    };

    let handler: CoingeckoPriceHandler;

    beforeEach(() => {
        handler = new CoingeckoPriceHandler(mockConfig);
    });

    it('should calculate price for WETH token on mainnet', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                chain: Chain.MAINNET,
                coingeckoTokenId: 'weth',
                excludedFromCoingecko: false,
                types: [],
                underlyingTokenAddress: undefined,
                unwrapRate: undefined,
                underlyingTokenPrice: undefined,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
        expect(priceItems[0].chain).toBe(Chain.MAINNET);
        expect(priceItems[0].updatedBy).toBe('CoingeckoPriceHandlerService');
        expect(priceItems[0].updatedAt).toBeInstanceOf(Date);
        expect(Number.isFinite(priceItems[0].price)).toBe(true);
        expect(priceItems[0].price).toBeGreaterThan(0);
    });

    it('should return handler name', () => {
        expect(handler.id).toBe('CoingeckoPriceHandlerService');
    });

    it('should have exitIfFails set to true', () => {
        expect(handler.exitIfFails).toBe(true);
    });

    it('should exclude tokens without coingeckoTokenId', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                chain: Chain.MAINNET,
                coingeckoTokenId: undefined,
                excludedFromCoingecko: false,
                types: [],
                underlyingTokenAddress: undefined,
                unwrapRate: undefined,
                underlyingTokenPrice: undefined,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });

    it('should exclude tokens marked as excludedFromCoingecko', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                chain: Chain.MAINNET,
                coingeckoTokenId: 'weth',
                excludedFromCoingecko: true,
                types: [],
                underlyingTokenAddress: undefined,
                unwrapRate: undefined,
                underlyingTokenPrice: undefined,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });

    it('should exclude tokens in excludedTokenAddresses config', async () => {
        const handlerWithExclusion = new CoingeckoPriceHandler({
            excludedTokenAddresses: [{ address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', chain: Chain.MAINNET }],
        });

        const tokens: TokenPriceData[] = [
            {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                chain: Chain.MAINNET,
                coingeckoTokenId: 'weth',
                excludedFromCoingecko: false,
                types: [],
                underlyingTokenAddress: undefined,
                unwrapRate: undefined,
                underlyingTokenPrice: undefined,
            },
        ];

        const priceItems = await handlerWithExclusion.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });
});
