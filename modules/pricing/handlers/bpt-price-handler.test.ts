import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { BptPriceHandler } from './bpt-price-handler';
import { Chain } from '@prisma/client';
import { TokenPriceData } from '../types';

// Mock database functions
const mockPrismaPool = {
    findMany: mock(),
};

const mockDB = {
    prismaPool: mockPrismaPool,
};

describe('BptPriceHandler', () => {
    let handler: BptPriceHandler;

    beforeEach(() => {
        handler = new BptPriceHandler(mockDB);
        mockPrismaPool.findMany.mockClear();
    });

    describe('calculatePricesForTokens', () => {
        it('should calculate prices for BPT tokens when pool data is available', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
                {
                    address: '0xbpt2',
                    chain: Chain.ARBITRUM,
                    types: ['PHANTOM_BPT'],
                },
            ];

            const mockPools = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    dynamicData: {
                        totalLiquidity: 1000,
                        totalShares: '100', // 1000 / 100 = 10
                    },
                },
                {
                    address: '0xbpt2',
                    chain: Chain.ARBITRUM,
                    dynamicData: {
                        totalLiquidity: 2000,
                        totalShares: '500', // 2000 / 500 = 4
                    },
                },
            ];

            mockPrismaPool.findMany.mockResolvedValue(mockPools);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(2);
            expect(priceItems[0]).toEqual({
                address: '0xbpt1',
                chain: Chain.MAINNET,
                price: 10,
                updatedAt: expect.any(Date),
                updatedBy: 'BptPriceHandlerService',
            });
            expect(priceItems[1]).toEqual({
                address: '0xbpt2',
                chain: Chain.ARBITRUM,
                price: 4,
                updatedAt: expect.any(Date),
                updatedBy: 'BptPriceHandlerService',
            });
        });

        it('should return empty array when no BPT tokens are found', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0);
            expect(mockPrismaPool.findMany).not.toHaveBeenCalled();
        });

        it('should only process BPT and PHANTOM_BPT tokens', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
                {
                    address: '0xtoken1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xbpt2',
                    chain: Chain.ARBITRUM,
                    types: ['PHANTOM_BPT'],
                },
            ];

            const mockPools = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    dynamicData: {
                        totalLiquidity: 1000,
                        totalShares: '100',
                    },
                },
                {
                    address: '0xbpt2',
                    chain: Chain.ARBITRUM,
                    dynamicData: {
                        totalLiquidity: 2000,
                        totalShares: '500',
                    },
                },
            ];

            mockPrismaPool.findMany.mockResolvedValue(mockPools);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(2);
            expect(priceItems.every(item => item.address !== '0xtoken1')).toBe(true);
        });

        it('should skip tokens without matching pool data', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
                {
                    address: '0xbpt2',
                    chain: Chain.ARBITRUM,
                    types: ['BPT'],
                },
            ];

            const mockPools = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    dynamicData: {
                        totalLiquidity: 1000,
                        totalShares: '100',
                    },
                },
                // bpt2 not in pools
            ];

            mockPrismaPool.findMany.mockResolvedValue(mockPools);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].address).toBe('0xbpt1');
        });

        it('should skip tokens with null dynamic data', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
            ];

            const mockPools = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    dynamicData: null,
                },
            ];

            mockPrismaPool.findMany.mockResolvedValue(mockPools);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0);
        });

        it('should skip tokens with zero total liquidity', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
            ];

            const mockPools = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    dynamicData: {
                        totalLiquidity: 0,
                        totalShares: '100',
                    },
                },
            ];

            mockPrismaPool.findMany.mockResolvedValue(mockPools);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0);
        });

        it('should skip tokens with zero total shares', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
            ];

            const mockPools = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    dynamicData: {
                        totalLiquidity: 1000,
                        totalShares: '0',
                    },
                },
            ];

            mockPrismaPool.findMany.mockResolvedValue(mockPools);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle database errors gracefully', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
            ];

            mockPrismaPool.findMany.mockRejectedValue(new Error('Database error'));

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle high precision calculations correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
            ];

            const mockPools = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    dynamicData: {
                        totalLiquidity: 1000.123456789,
                        totalShares: '333.333333333',
                    },
                },
            ];

            mockPrismaPool.findMany.mockResolvedValue(mockPools);

            const priceItems = await handler.calculatePricesForTokens(tokens);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].price).toBeCloseTo(3.00037037, 5);
        });

        it('should query database with correct parameters', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xbpt1',
                    chain: Chain.MAINNET,
                    types: ['BPT'],
                },
                {
                    address: '0xbpt2',
                    chain: Chain.ARBITRUM,
                    types: ['PHANTOM_BPT'],
                },
            ];

            mockPrismaPool.findMany.mockResolvedValue([]);

            await handler.calculatePricesForTokens(tokens);

            expect(mockPrismaPool.findMany).toHaveBeenCalledWith({
                where: {
                    dynamicData: { totalLiquidity: { gt: 0.1 } },
                    chain: { in: [Chain.MAINNET, Chain.ARBITRUM] },
                },
                include: { dynamicData: true },
            });
        });
    });

    describe('handler properties', () => {
        it('should have correct handler ID', () => {
            expect(handler.id).toBe('BptPriceHandlerService');
        });

        it('should have exitIfFails set to false', () => {
            expect(handler.exitIfFails).toBe(false);
        });
    });
});