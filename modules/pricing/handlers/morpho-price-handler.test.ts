import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { IMorphoBlueApiClient, BlueApiResponse, MorphoPriceHandler } from './morpho-price-handler';
import { Chain } from '@prisma/client';
import { TokenPriceData } from '../types';

// Mock API client
const mockGetVaults = mock<() => Promise<BlueApiResponse>>();
const mockApiClient: IMorphoBlueApiClient = {
    getVaults: mockGetVaults,
};

describe('MorphoPriceHandler', () => {
    let handler: MorphoPriceHandler;

    beforeEach(() => {
        handler = new MorphoPriceHandler(mockApiClient);
        mockGetVaults.mockClear();
    });

    describe('calculatePricesForTokens', () => {
        it('should calculate prices for Morpho vault tokens when API data is available', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xvault1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xvault2',
                    chain: Chain.BASE,
                    types: ['ERC20'],
                },
            ];

            const mockApiResponse = {
                vaults: {
                    items: [
                        {
                            address: '0xvault1',
                            chain: { network: 'ethereum' as const },
                            state: { sharePriceUsd: 1.05 },
                        },
                        {
                            address: '0xvault2',
                            chain: { network: 'base' as const },
                            state: { sharePriceUsd: 1.12 },
                        },
                    ],
                },
            };

            mockGetVaults.mockResolvedValue(mockApiResponse);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(2);
            expect(priceItems[0]).toEqual({
                address: '0xvault1',
                chain: Chain.MAINNET,
                price: 1.05,
                updatedAt: expect.any(Date),
                updatedBy: 'MorphoPriceHandlerService',
            });
            expect(priceItems[1]).toEqual({
                address: '0xvault2',
                chain: Chain.BASE,
                price: 1.12,
                updatedAt: expect.any(Date),
                updatedBy: 'MorphoPriceHandlerService',
            });
        });

        it('should return empty array when no vault tokens are found', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xnonvault',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const mockApiResponse = {
                vaults: {
                    items: [],
                },
            };

            mockGetVaults.mockResolvedValue(mockApiResponse);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0);
        });

        it('should only process tokens on supported chains (MAINNET and BASE)', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xvault1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xvault2',
                    chain: Chain.FANTOM, // Unsupported chain
                    types: ['ERC20'],
                },
            ];

            const mockApiResponse = {
                vaults: {
                    items: [
                        {
                            address: '0xvault1',
                            chain: { network: 'ethereum' as const },
                            state: { sharePriceUsd: 1.05 },
                        },
                    ],
                },
            };

            mockGetVaults.mockResolvedValue(mockApiResponse);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].chain).toBe(Chain.MAINNET);
        });

        it('should handle chain mismatch correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xvault1',
                    chain: Chain.BASE, // Token is on BASE
                    types: ['ERC20'],
                },
            ];

            const mockApiResponse = {
                vaults: {
                    items: [
                        {
                            address: '0xvault1',
                            chain: { network: 'ethereum' as const }, // API says it's on ethereum
                            state: { sharePriceUsd: 1.05 },
                        },
                    ],
                },
            };

            mockGetVaults.mockResolvedValue(mockApiResponse);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0); // Should filter out due to chain mismatch
        });

        it('should handle API errors gracefully', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xvault1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            mockGetVaults.mockRejectedValue(new Error('API Error'));

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle multiple vault tokens correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xvault1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xvault2',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xvault3',
                    chain: Chain.BASE,
                    types: ['ERC20'],
                },
            ];

            const mockApiResponse = {
                vaults: {
                    items: [
                        {
                            address: '0xvault1',
                            chain: { network: 'ethereum' as const },
                            state: { sharePriceUsd: 1.05 },
                        },
                        {
                            address: '0xvault3',
                            chain: { network: 'base' as const },
                            state: { sharePriceUsd: 1.25 },
                        },
                        // vault2 not in API response
                    ],
                },
            };

            mockGetVaults.mockResolvedValue(mockApiResponse);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(2);
            expect(priceItems.find((p) => p.address === '0xvault1')).toBeDefined();
            expect(priceItems.find((p) => p.address === '0xvault3')).toBeDefined();
            expect(priceItems.find((p) => p.address === '0xvault2')).toBeUndefined();
        });

        it('should handle high precision prices correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xvault1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const mockApiResponse = {
                vaults: {
                    items: [
                        {
                            address: '0xvault1',
                            chain: { network: 'ethereum' as const },
                            state: { sharePriceUsd: 1.123456789 },
                        },
                    ],
                },
            };

            mockGetVaults.mockResolvedValue(mockApiResponse);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].price).toBe(1.123456789);
        });
    });

    describe('handler properties', () => {
        it('should have correct handler ID', () => {
            expect(handler.id).toBe('MorphoPriceHandlerService');
        });

        it('should have exitIfFails set to false', () => {
            expect(handler.exitIfFails).toBe(false);
        });
    });
});
