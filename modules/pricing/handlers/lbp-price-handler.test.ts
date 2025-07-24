import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { LbpPriceHandler, LBPoolData } from './lbp-price-handler';
import { Chain } from '@prisma/client';
import { TokenPriceData } from '../types';

// Mock database functions
const mockPrismaPool = {
    findMany: mock(),
};

const mockDB = {
    prismaPool: mockPrismaPool,
};

describe('LbpPriceHandler', () => {
    let handler: LbpPriceHandler;

    beforeEach(() => {
        handler = new LbpPriceHandler(mockDB);
        mockPrismaPool.findMany.mockClear();
    });

    describe('calculatePricesForTokens', () => {
        it('should calculate prices for project tokens in LBP pools', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xproject2',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const mockLBPs = [
                {
                    address: '0xpool1',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject1',
                        reserveToken: '0xreserve1',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject1',
                            balance: '1000',
                            weight: '0.8', // 80%
                        },
                        {
                            address: '0xreserve1',
                            balance: '200',
                            weight: '0.2', // 20%
                        },
                    ],
                },
                {
                    address: '0xpool2',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject2',
                        reserveToken: '0xreserve2',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject2',
                            balance: '500',
                            weight: '0.6', // 60%
                        },
                        {
                            address: '0xreserve2',
                            balance: '400',
                            weight: '0.4', // 40%
                        },
                    ],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xreserve1', 1.0);
            allPrices.set('0xreserve2', 2.0);

            mockPrismaPool.findMany.mockResolvedValue(mockLBPs);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(2);

            // Project 1: (200 / 0.2) / (1000 / 0.8) = 1000 / 1250 = 0.8, price = 0.8 * 1.0 = 0.8
            expect(priceItems[0]).toEqual({
                address: '0xproject1',
                chain: Chain.MAINNET,
                price: 0.8,
                updatedAt: expect.any(Date),
                updatedBy: 'LbpPriceHandlerService',
            });

            // Project 2: (400 / 0.4) / (500 / 0.6) = 1000 / 833.33 = 1.2, price = 1.2 * 2.0 = 2.4
            expect(priceItems[1]).toEqual({
                address: '0xproject2',
                chain: Chain.MAINNET,
                price: 2.4,
                updatedAt: expect.any(Date),
                updatedBy: 'LbpPriceHandlerService',
            });
        });

        it('should return empty array when no LBP pools are found', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xreserve1', 1.0);

            mockPrismaPool.findMany.mockResolvedValue([]);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should return empty array when allPrices is not provided', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const priceItems = await handler.calculatePricesForTokens(tokens, new Map());

            expect(priceItems).toHaveLength(0);
        });

        it('should skip project tokens without reserve token prices', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xproject2',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const mockLBPs = [
                {
                    address: '0xpool1',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject1',
                        reserveToken: '0xreserve1',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject1',
                            balance: '1000',
                            weight: '0.8',
                        },
                        {
                            address: '0xreserve1',
                            balance: '200',
                            weight: '0.2',
                        },
                    ],
                },
                {
                    address: '0xpool2',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject2',
                        reserveToken: '0xreserve2',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject2',
                            balance: '500',
                            weight: '0.6',
                        },
                        {
                            address: '0xreserve2',
                            balance: '400',
                            weight: '0.4',
                        },
                    ],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xreserve1', 1.0);
            // reserve2 price missing

            mockPrismaPool.findMany.mockResolvedValue(mockLBPs);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].address).toBe('0xproject1');
        });

        it('should skip tokens not in the input tokens list', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                // project2 not in tokens list
            ];

            const mockLBPs = [
                {
                    address: '0xpool1',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject1',
                        reserveToken: '0xreserve1',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject1',
                            balance: '1000',
                            weight: '0.8',
                        },
                        {
                            address: '0xreserve1',
                            balance: '200',
                            weight: '0.2',
                        },
                    ],
                },
                {
                    address: '0xpool2',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject2', // Not in tokens
                        reserveToken: '0xreserve2',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject2',
                            balance: '500',
                            weight: '0.6',
                        },
                        {
                            address: '0xreserve2',
                            balance: '400',
                            weight: '0.4',
                        },
                    ],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xreserve1', 1.0);
            allPrices.set('0xreserve2', 2.0);

            mockPrismaPool.findMany.mockResolvedValue(mockLBPs);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].address).toBe('0xproject1');
        });

        it('should skip pools with missing project or reserve tokens', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const mockLBPs = [
                {
                    address: '0xpool1',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject1',
                        reserveToken: '0xreserve1',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject1',
                            balance: '1000',
                            weight: '0.8',
                        },
                        // Missing reserve token
                    ],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xreserve1', 1.0);

            mockPrismaPool.findMany.mockResolvedValue(mockLBPs);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle database errors gracefully', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xreserve1', 1.0);

            mockPrismaPool.findMany.mockRejectedValue(new Error('Database error'));

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle multiple chains correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
                {
                    address: '0xproject2',
                    chain: Chain.ARBITRUM,
                    types: ['ERC20'],
                },
            ];

            const mockLBPs = [
                {
                    address: '0xpool1',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject1',
                        reserveToken: '0xreserve1',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject1',
                            balance: '1000',
                            weight: '0.8',
                        },
                        {
                            address: '0xreserve1',
                            balance: '200',
                            weight: '0.2',
                        },
                    ],
                },
                {
                    address: '0xpool2',
                    chain: Chain.ARBITRUM,
                    typeData: {
                        projectToken: '0xproject2',
                        reserveToken: '0xreserve2',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject2',
                            balance: '500',
                            weight: '0.6',
                        },
                        {
                            address: '0xreserve2',
                            balance: '400',
                            weight: '0.4',
                        },
                    ],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xreserve1', 1.0);
            allPrices.set('0xreserve2', 2.0);

            mockPrismaPool.findMany.mockResolvedValue(mockLBPs);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(2);
            expect(mockPrismaPool.findMany).toHaveBeenCalledWith({
                where: {
                    type: 'LIQUIDITY_BOOTSTRAPPING',
                    protocolVersion: 3,
                    chain: { in: [Chain.MAINNET, Chain.ARBITRUM] },
                },
                include: { tokens: true },
            });
        });

        it('should handle high precision calculations correctly', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xproject1',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const mockLBPs = [
                {
                    address: '0xpool1',
                    chain: Chain.MAINNET,
                    typeData: {
                        projectToken: '0xproject1',
                        reserveToken: '0xreserve1',
                    } as LBPoolData,
                    tokens: [
                        {
                            address: '0xproject1',
                            balance: '1000.123456789',
                            weight: '0.333333333',
                        },
                        {
                            address: '0xreserve1',
                            balance: '200.987654321',
                            weight: '0.666666667',
                        },
                    ],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0xreserve1', 1.5);

            mockPrismaPool.findMany.mockResolvedValue(mockLBPs);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            // (200.987654321 / 0.666666667) / (1000.123456789 / 0.333333333) = 301.48 / 3000.37 = 0.1005
            // 0.1005 * 1.5 = 0.15075
            expect(priceItems[0].price).toBeCloseTo(0.15075, 3);
        });
    });

    describe('handler properties', () => {
        it('should have correct handler ID', () => {
            expect(handler.id).toBe('LbpPriceHandlerService');
        });

        it('should have exitIfFails set to false', () => {
            expect(handler.exitIfFails).toBe(false);
        });
    });
});
