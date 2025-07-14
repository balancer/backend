import { Chain } from '@prisma/client';
import { AavePriceHandler } from './aave-price-handler';
import { TokenPriceData } from '../types';
import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock the config
mock.module('../../../config', () => ({
    default: {
        ARBITRUM: {
            aprHandlers: {
                ybAprHandler: {
                    aave: {
                        v3: {
                            tokens: {
                                USDC: {
                                    underlyingAssetAddress: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
                                    aTokenAddress: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
                                    wrappedTokens: {
                                        waUSDC: '0xe719aef17468c7e10c0c205be62c990754dff7e5',
                                        stataArbUSDC: '0x3a301e7917689b8e8a19498b8a28fc912583490c',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}));

describe('AavePriceHandler', () => {
    let handler: AavePriceHandler;
    let mockViemClient: any;

    beforeEach(() => {
        const mockMulticall = mock().mockResolvedValue([
            { status: 'success', result: 1050000000000000000000000000n }, // 1.05 in RAY
            { status: 'success', result: 1100000000000000000000000000n }, // 1.1 in RAY
        ]);

        mockViemClient = mock(() => ({
            multicall: mockMulticall,
        }));

        handler = new AavePriceHandler(mockViemClient);
    });

    it('should calculate price for Aave tokens using contract rates', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0xe719aef17468c7e10c0c205be62c990754dff7e5', // waUSDC
                chain: Chain.ARBITRUM,
                types: [],
                underlyingTokenPrice: 1.0,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0xe719aef17468c7e10c0c205be62c990754dff7e5');
        expect(priceItems[0].chain).toBe(Chain.ARBITRUM);
        expect(priceItems[0].price).toBe(1.05); // 1.0 * 1.05
        expect(priceItems[0].updatedBy).toBe('AavePriceHandlerService');
        expect(priceItems[0].updatedAt).toBeInstanceOf(Date);

        // Note: mockViemClient was called with Chain.ARBITRUM
    });

    it('should calculate price for ERC4626 Aave tokens using unwrap rate', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0x3a301e7917689b8e8a19498b8a28fc912583490c', // stataArbUSDC
                chain: Chain.ARBITRUM,
                types: ['ERC4626'],
                unwrapRate: '1.08',
                underlyingTokenPrice: 1.0,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(1);
        expect(priceItems[0].address).toBe('0x3a301e7917689b8e8a19498b8a28fc912583490c');
        expect(priceItems[0].price).toBe(1.08); // 1.0 * 1.08 (ERC4626 unwrap rate)

        // Note: ERC4626 tokens use unwrap rate, not contract calls
    });

    it('should return handler name', () => {
        expect(handler.id).toBe('AavePriceHandlerService');
    });

    it('should have exitIfFails set to false', () => {
        expect(handler.exitIfFails).toBe(false);
    });

    it('should ignore non-Aave tokens', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
                chain: Chain.ARBITRUM,
                types: [],
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });

    it('should skip tokens without underlying price data', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0xe719aef17468c7e10c0c205be62c990754dff7e5', // waUSDC
                chain: Chain.ARBITRUM,
                types: [],
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(0);
    });

    it('should handle mixed ERC4626 and contract rate tokens', async () => {
        const tokens: TokenPriceData[] = [
            {
                address: '0xe719aef17468c7e10c0c205be62c990754dff7e5', // waUSDC (contract rate)
                chain: Chain.ARBITRUM,
                types: [],
                underlyingTokenPrice: 1.0,
            },
            {
                address: '0x3a301e7917689b8e8a19498b8a28fc912583490c', // stataArbUSDC (ERC4626)
                chain: Chain.ARBITRUM,
                types: ['ERC4626'],
                unwrapRate: '1.08',
                underlyingTokenPrice: 1.0,
            },
        ];

        const priceItems = await handler.calculatePricesForTokens(tokens);

        expect(priceItems).toHaveLength(2);

        const waUSDCPrice = priceItems.find((item) => item.address === '0xe719aef17468c7e10c0c205be62c990754dff7e5');
        const stataPrice = priceItems.find((item) => item.address === '0x3a301e7917689b8e8a19498b8a28fc912583490c');

        expect(waUSDCPrice?.price).toBe(1.05); // Contract rate
        expect(stataPrice?.price).toBe(1.08); // ERC4626 unwrap rate
    });
});
