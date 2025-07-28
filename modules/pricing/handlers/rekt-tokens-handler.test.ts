import { Chain } from '@prisma/client';
import { RektTokensHandler } from './rekt-tokens-handler';
import { TokenPriceData } from '../types';

describe('RektTokensHandler', () => {
    let handler: RektTokensHandler;

    beforeEach(() => {
        handler = new RektTokensHandler();
    });

    it('should set LQDR token price to 0', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9',
                chain: Chain.FANTOM,
                coingeckoTokenId: 'liquid-driver',
                excludedFromCoingecko: false,
                types: [],
                underlyingTokenAddress: undefined,
                unwrapRate: undefined,
                underlyingTokenPrice: undefined,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9');
        expect(priceItems[0].chain).toBe(Chain.FANTOM);
        expect(priceItems[0].price).toBe(0);
        expect(priceItems[0].updatedBy).toBe('RektTokensHandlerService');
        expect(priceItems[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should return handler name', () => {
        expect(handler.id).toBe('RektTokensHandlerService');
    });

    it('should have exitIfFails set to false', () => {
        expect(handler.exitIfFails).toBe(false);
    });

    it('should ignore non-LQDR tokens', async () => {
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

        expect(priceItems).toHaveLength(0);
    });

    it('should handle multiple tokens but only process LQDR', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9',
                chain: Chain.FANTOM,
                coingeckoTokenId: 'liquid-driver',
                excludedFromCoingecko: false,
                types: [],
                underlyingTokenAddress: undefined,
                unwrapRate: undefined,
                underlyingTokenPrice: undefined,
            },
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
        expect(priceItems[0].address).toBe('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9');
        expect(priceItems[0].price).toBe(0);
    });
});
