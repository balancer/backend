import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Chain } from '@prisma/client';
import { FbeetsPriceHandler } from './fbeets-price-handler';
import { TokenPriceData } from '../types';

// Mock the fantom config
mock.module('../../../config/fantom', () => ({
    default: {
        fbeets: {
            address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
            poolId: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
        },
    },
}));

describe('FbeetsPriceHandler', () => {
    let handler: FbeetsPriceHandler;
    let mockPrismaFbeets: any;
    let mockPrismaPool: any;

    beforeEach(() => {
        mockPrismaFbeets = {
            findFirst: mock(),
        };
        
        mockPrismaPool = {
            findUnique: mock(),
        };
        
        handler = new FbeetsPriceHandler({
            prismaFbeets: mockPrismaFbeets,
            prismaPool: mockPrismaPool,
        });
    });

    describe('calculatePricesForTokens', () => {
        it('should calculate price for fbeets tokens when all required data is available', async () => {
            // Mock fbeets ratio
            mockPrismaFbeets.findFirst.mockResolvedValue({
                id: 'fbeets',
                ratio: '1.5', // 1.5 BPT per fbeets
            });

            // Mock pool data
            mockPrismaPool.findUnique.mockResolvedValue({
                id: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
                chain: 'FANTOM',
                dynamicData: {
                    totalShares: '1000', // 1000 total shares
                },
                tokens: [
                    {
                        address: '0xtoken1',
                        balance: '400', // 40% of pool
                        token: { address: '0xtoken1' },
                    },
                    {
                        address: '0xtoken2',
                        balance: '600', // 60% of pool
                        token: { address: '0xtoken2' },
                    },
                ],
            });

            const tokens: TokenPriceData[] = [
                {
                    address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xtoken1', 2.0); // Token1 = $2
            allPrices.set('0xtoken2', 1.0); // Token2 = $1

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].address).toBe('0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1');
            expect(priceItems[0].chain).toBe(Chain.FANTOM);
            
            // Price calculation: 
            // Token1: (400/1000) * 1.5 * 2.0 = 1.2
            // Token2: (600/1000) * 1.5 * 1.0 = 0.9
            // Total: 1.2 + 0.9 = 2.1
            expect(priceItems[0].price).toBe(2.1);
            expect(priceItems[0].updatedBy).toBe('FbeetsPriceHandlerService');
            expect(priceItems[0].updatedAt).toBeInstanceOf(Date);
        });

        it('should return empty array when no fbeets tokens are found', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xsomeothertoken',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockPrismaFbeets.findFirst).not.toHaveBeenCalled();
        });

        it('should only process fbeets tokens on Fantom chain', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
                    chain: Chain.MAINNET, // Wrong chain
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockPrismaFbeets.findFirst).not.toHaveBeenCalled();
        });

        it('should return empty array when fbeets ratio is not found', async () => {
            mockPrismaFbeets.findFirst.mockResolvedValue(null);

            const tokens: TokenPriceData[] = [
                {
                    address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockPrismaFbeets.findFirst).toHaveBeenCalled();
        });

        it('should return empty array when pool is not found', async () => {
            mockPrismaFbeets.findFirst.mockResolvedValue({
                id: 'fbeets',
                ratio: '1.5',
            });

            mockPrismaPool.findUnique.mockResolvedValue(null);

            const tokens: TokenPriceData[] = [
                {
                    address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockPrismaPool.findUnique).toHaveBeenCalled();
        });

        it('should return empty array when token prices are missing', async () => {
            mockPrismaFbeets.findFirst.mockResolvedValue({
                id: 'fbeets',
                ratio: '1.5',
            });

            mockPrismaPool.findUnique.mockResolvedValue({
                id: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
                chain: 'FANTOM',
                dynamicData: {
                    totalShares: '1000',
                },
                tokens: [
                    {
                        address: '0xtoken1',
                        balance: '400',
                        token: { address: '0xtoken1' },
                    },
                    {
                        address: '0xtoken2',
                        balance: '600',
                        token: { address: '0xtoken2' },
                    },
                ],
            });

            const tokens: TokenPriceData[] = [
                {
                    address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xtoken1', 2.0); // Missing token2 price

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle edge case with zero total shares', async () => {
            mockPrismaFbeets.findFirst.mockResolvedValue({
                id: 'fbeets',
                ratio: '1.5',
            });

            mockPrismaPool.findUnique.mockResolvedValue({
                id: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
                chain: 'FANTOM',
                dynamicData: {
                    totalShares: '0', // Zero total shares
                },
                tokens: [
                    {
                        address: '0xtoken1',
                        balance: '400',
                        token: { address: '0xtoken1' },
                    },
                ],
            });

            const tokens: TokenPriceData[] = [
                {
                    address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xtoken1', 2.0);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle calculation error gracefully', async () => {
            mockPrismaFbeets.findFirst.mockRejectedValue(new Error('Database error'));

            const tokens: TokenPriceData[] = [
                {
                    address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle complex pool with multiple tokens correctly', async () => {
            mockPrismaFbeets.findFirst.mockResolvedValue({
                id: 'fbeets',
                ratio: '2.0',
            });

            mockPrismaPool.findUnique.mockResolvedValue({
                id: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
                chain: 'FANTOM',
                dynamicData: {
                    totalShares: '2000',
                },
                tokens: [
                    {
                        address: '0xtoken1',
                        balance: '500', // 25% of pool
                        token: { address: '0xtoken1' },
                    },
                    {
                        address: '0xtoken2',
                        balance: '1000', // 50% of pool
                        token: { address: '0xtoken2' },
                    },
                    {
                        address: '0xtoken3',
                        balance: '500', // 25% of pool
                        token: { address: '0xtoken3' },
                    },
                ],
            });

            const tokens: TokenPriceData[] = [
                {
                    address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xtoken1', 4.0); // Token1 = $4
            allPrices.set('0xtoken2', 2.0); // Token2 = $2
            allPrices.set('0xtoken3', 1.0); // Token3 = $1

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            
            // Price calculation:
            // Token1: (500/2000) * 2.0 * 4.0 = 2.0
            // Token2: (1000/2000) * 2.0 * 2.0 = 4.0
            // Token3: (500/2000) * 2.0 * 1.0 = 0.5
            // Total: 2.0 + 4.0 + 0.5 = 6.5
            expect(priceItems[0].price).toBe(6.5);
        });
    });

    describe('handler properties', () => {
        it('should have correct handler ID', () => {
            expect(handler.id).toBe('FbeetsPriceHandlerService');
        });

        it('should have exitIfFails set to false', () => {
            expect(handler.exitIfFails).toBe(false);
        });
    });
});