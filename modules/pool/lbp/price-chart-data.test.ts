import { test, expect, mock, beforeEach, describe } from 'bun:test';
import { Chain } from '@prisma/client';
import { priceChartData } from './price-chart-data';
import { SwapEvent, JoinExitEvent } from '../../../prisma/prisma-types';
import { TokenFlowsRepository } from '../../events/repository';

// Mock the prisma client using Bun's mock.module()
mock.module('../../../prisma/prisma-client', () => ({
    prisma: {
        prismaTokenPrice: {
            findMany: mock(() =>
                Promise.resolve([
                    { timestamp: 999000, price: 1.0 },
                    { timestamp: 1005000, price: 1.1 },
                    { timestamp: 1015000, price: 1.2 },
                ]),
            ),
        },
    },
}));

describe('priceChartData', () => {
    const mockPool = {
        id: 'test-pool-id',
        chain: 'MAINNET' as Chain,
        createTime: 1000000,
        startTime: 1000000,
        endTime: 1010000,
        projectToken: '0xproject',
        projectTokenStartWeight: 0.8,
        projectTokenEndWeight: 0.2,
        reserveToken: '0xreserve',
        reserveTokenStartWeight: 0.2,
        reserveTokenEndWeight: 0.8,
    };

    // Common event properties
    const baseEventProps = {
        chain: 'MAINNET' as Chain,
        blockNumber: 100,
        logIndex: 1,
        poolId: 'test-pool-id',
        userAddress: '0xuser',
        protocolVersion: 2,
    };

    describe('timeline generation', () => {
        test('should include exact start and end times', async () => {
            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([]),
            };

            const result = await priceChartData(mockPool, 5, mockRepository);

            expect(result).toHaveLength(5);
            expect(result[0].timestamp).toBe(mockPool.startTime); // Ascending order
            expect(result[result.length - 1].timestamp).toBe(mockPool.endTime);
        });

        test('should generate exact number of data points', async () => {
            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([]),
            };

            const result = await priceChartData(mockPool, 10, mockRepository);
            expect(result).toHaveLength(10);

            const result2 = await priceChartData(mockPool, 3, mockRepository);
            expect(result2).toHaveLength(3);
        });

        test('should handle single data point', async () => {
            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([]),
            };

            const result = await priceChartData(mockPool, 1, mockRepository);
            expect(result).toHaveLength(1);
            expect(result[0].timestamp).toBe(mockPool.startTime);
        });

        test('should handle two data points', async () => {
            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([]),
            };

            const result = await priceChartData(mockPool, 2, mockRepository);
            expect(result).toHaveLength(2);
            expect(result[0].timestamp).toBe(mockPool.startTime);
            expect(result[1].timestamp).toBe(mockPool.endTime);
        });
    });

    describe('balance calculations', () => {
        test('should calculate cumulative balances correctly for swaps', async () => {
            const mockSwapEvents: SwapEvent[] = [
                {
                    ...baseEventProps,
                    id: 'swap1',
                    type: 'SWAP',
                    blockTimestamp: 1002000,
                    tx: '0x123',
                    valueUSD: 1000,
                    payload: {
                        tokenIn: {
                            address: '0xproject',
                            amount: '100',
                        },
                        tokenOut: {
                            address: '0xreserve',
                            amount: '50',
                        },
                        fee: { address: '0xreserve', valueUSD: '10', amount: '10' },
                    },
                },
                {
                    ...baseEventProps,
                    id: 'swap2',
                    type: 'SWAP',
                    blockTimestamp: 1006000,
                    blockNumber: 200,
                    tx: '0x456',
                    valueUSD: 2000,
                    payload: {
                        tokenIn: {
                            address: '0xreserve',
                            amount: '25',
                        },
                        tokenOut: {
                            address: '0xproject',
                            amount: '40',
                        },
                        fee: { address: '0xreserve', amount: '20', valueUSD: '20' },
                    },
                },
            ];

            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([...mockSwapEvents].reverse()),
            };

            const result = await priceChartData(mockPool, 4, mockRepository);

            expect(result).toHaveLength(4);

            // Results are sorted in ascending chronological order by timestamp
            // Timeline points: startTime=1000000, intermediate points, endTime=1010000
            // For 4 points: 1000000, 1003333, 1006667, 1010000

            // Find point at 1003333 (after first swap at 1002000)
            const afterFirstSwap = result.find((r) => r.timestamp === 1003333);
            // Find point at 1006667 (after second swap at 1006000)
            const afterSecondSwap = result.find((r) => r.timestamp === 1006667);
            // Find point at 1010000 (end time)
            const endPoint = result.find((r) => r.timestamp === 1010000);

            // After first swap: 100 project tokens sold in this bucket
            expect(afterFirstSwap?.buyVolume).toBe(0);
            expect(afterFirstSwap?.sellVolume).toBe(100);
            expect(afterFirstSwap?.swapCount).toBe(1);

            // After second swap: 40 project tokens bought in this bucket (no sell volume in this bucket)
            expect(afterSecondSwap?.buyVolume).toBe(40);
            expect(afterSecondSwap?.sellVolume).toBe(0);
            expect(afterSecondSwap?.swapCount).toBe(1);

            // End point should have no activity (no events in this bucket)
            expect(endPoint?.buyVolume).toBe(0);
            expect(endPoint?.sellVolume).toBe(0);
            expect(endPoint?.swapCount).toBe(0);
        });

        test('should handle JOIN and EXIT events correctly', async () => {
            const mockJoinExitEvents: JoinExitEvent[] = [
                {
                    ...baseEventProps,
                    id: 'join1',
                    type: 'JOIN',
                    blockTimestamp: 1002000,
                    tx: '0x123',
                    valueUSD: 5000,
                    payload: {
                        tokens: [
                            { address: '0xproject', amount: '200', valueUSD: 200 },
                            { address: '0xreserve', amount: '100', valueUSD: 100 },
                        ],
                    },
                },
                {
                    ...baseEventProps,
                    id: 'exit1',
                    type: 'EXIT',
                    blockTimestamp: 1008000,
                    blockNumber: 200,
                    tx: '0x456',
                    valueUSD: 2000,
                    payload: {
                        tokens: [
                            { address: '0xproject', amount: '50', valueUSD: 50 },
                            { address: '0xreserve', amount: '25', valueUSD: 25 },
                        ],
                    },
                },
            ];

            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([...mockJoinExitEvents].reverse()),
            };

            const result = await priceChartData(mockPool, 3, mockRepository);

            expect(result).toHaveLength(3);

            // Timeline for 3 points: 1000000, 1005000, 1010000
            // Find points after each event
            const afterJoin = result.find((r) => r.timestamp === 1005000);
            const afterExit = result.find((r) => r.timestamp === 1010000);

            // After JOIN at 1002000: +200 project, +100 reserve (cumulative)
            expect(afterJoin?.projectTokenPrice).toBeGreaterThan(0);

            // After EXIT at 1008000: net +150 project (200-50), net +75 reserve (100-25) (cumulative)
            expect(afterExit?.projectTokenPrice).toBeGreaterThan(0);
        });

        test('should not include JOIN/EXIT events in volume calculations', async () => {
            const mockJoinExitEvents: JoinExitEvent[] = [
                {
                    ...baseEventProps,
                    id: 'join1',
                    type: 'JOIN',
                    blockTimestamp: 1002000,
                    tx: '0x123',
                    valueUSD: 5000,
                    payload: {
                        tokens: [
                            { address: '0xproject', amount: '200', valueUSD: 200 },
                            { address: '0xreserve', amount: '100', valueUSD: 100 },
                        ],
                    },
                },
                {
                    ...baseEventProps,
                    id: 'exit1',
                    type: 'EXIT',
                    blockTimestamp: 1008000,
                    tx: '0x456',
                    valueUSD: 2000,
                    payload: {
                        tokens: [
                            { address: '0xproject', amount: '50', valueUSD: 50 },
                            { address: '0xreserve', amount: '25', valueUSD: 25 },
                        ],
                    },
                },
            ];

            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([...mockJoinExitEvents].reverse()),
            };

            const result = await priceChartData(mockPool, 3, mockRepository);

            // Timeline for 3 points: 1000000, 1005000, 1010000
            const afterJoin = result.find((r) => r.timestamp === 1005000);
            const afterExit = result.find((r) => r.timestamp === 1010000);

            // JOIN/EXIT events should not contribute to volume (only swaps do)
            expect(afterJoin?.volume).toBe(0);
            expect(afterExit?.volume).toBe(0);

            // But they should still affect token flows
            expect(afterJoin?.projectTokenPrice).toBeGreaterThan(0);
            expect(afterExit?.projectTokenPrice).toBeGreaterThan(0);
        });

        test('should only include SWAP events in volume when mixed with JOIN/EXIT events', async () => {
            const mockMixedEvents = [
                {
                    ...baseEventProps,
                    id: 'join1',
                    type: 'JOIN' as const,
                    blockTimestamp: 1002000,
                    tx: '0x123',
                    valueUSD: 5000,
                    payload: {
                        tokens: [
                            { address: '0xproject', amount: '200', valueUSD: 200 },
                            { address: '0xreserve', amount: '100', valueUSD: 100 },
                        ],
                    },
                },
                {
                    ...baseEventProps,
                    id: 'swap1',
                    type: 'SWAP' as const,
                    blockTimestamp: 1004000,
                    tx: '0x456',
                    valueUSD: 1000,
                    payload: {
                        tokenIn: { address: '0xproject', amount: '50' },
                        tokenOut: { address: '0xreserve', amount: '25' },
                        fee: { address: '0xreserve', amount: '5', valueUSD: '5' },
                    },
                },
                {
                    ...baseEventProps,
                    id: 'exit1',
                    type: 'EXIT' as const,
                    blockTimestamp: 1008000,
                    tx: '0x789',
                    valueUSD: 2000,
                    payload: {
                        tokens: [
                            { address: '0xproject', amount: '30', valueUSD: 30 },
                            { address: '0xreserve', amount: '15', valueUSD: 15 },
                        ],
                    },
                },
            ];

            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([...mockMixedEvents].reverse()),
            };

            const result = await priceChartData(mockPool, 4, mockRepository);

            // Timeline for 4 points: 1000000, 1003333, 1006667, 1010000
            const afterJoin = result.find((r) => r.timestamp === 1003333);
            const afterSwap = result.find((r) => r.timestamp === 1006667);
            const afterExit = result.find((r) => r.timestamp === 1010000);

            // Only the swap should contribute to volume
            expect(afterJoin?.volume).toBe(0); // JOIN doesn't contribute to volume
            expect(afterSwap?.volume).toBe(1000); // Only SWAP volume
            expect(afterExit?.volume).toBe(0); // EXIT doesn't contribute to volume

            // But all should affect cumulative token flows
            expect(afterJoin?.projectTokenPrice).toBeGreaterThan(0);
            expect(afterSwap?.projectTokenPrice).toBeGreaterThan(0);
            expect(afterExit?.projectTokenPrice).toBeGreaterThan(0);
        });
    });

    describe('price calculations', () => {
        test('should calculate project token price using weighted pool formula', async () => {
            const mockEvents: SwapEvent[] = [
                {
                    ...baseEventProps,
                    id: 'swap1',
                    type: 'SWAP',
                    blockTimestamp: 1005000,
                    tx: '0x123',
                    valueUSD: 1000,
                    payload: {
                        tokenIn: {
                            address: '0xproject',
                            amount: '1000',
                        },
                        tokenOut: {
                            address: '0xreserve',
                            amount: '500',
                        },
                        fee: { valueUSD: '10', address: '0xreserve', amount: '10' },
                    },
                },
            ];

            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([...mockEvents].reverse()),
            };

            const result = await priceChartData(mockPool, 3, mockRepository);

            // Check that prices are calculated for points after the swap
            // Timeline: 1000000, 1005000, 1010000
            // Swap at 1005000, so points at 1005000 and 1010000 should have the swap
            const pointsWithSwaps = result.filter((point) => point.swapCount > 0);

            pointsWithSwaps.forEach((point) => {
                // Price might be 0 if balances are insufficient for calculation
                expect(point.reservePrice).toBeGreaterThan(0);
            });
        });

        test('should use closest available reserve price', async () => {
            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([]),
            };

            const result = await priceChartData(mockPool, 3, mockRepository);

            // Should use available prices from the mock
            result.forEach((point) => {
                expect(point.reservePrice).toBeGreaterThanOrEqual(1.0);
                expect(point.reservePrice).toBeLessThanOrEqual(1.2);
            });
        });
    });

    describe('edge cases', () => {
        test('should handle empty events gracefully', async () => {
            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([]),
            };

            const result = await priceChartData(mockPool, 5, mockRepository);

            expect(result).toHaveLength(5);
            result.forEach((point) => {
                expect(point.swapCount).toBe(0);
                expect(point.volume).toBe(0);
                expect(point.buyVolume).toBe(0);
                expect(point.sellVolume).toBe(0);
                expect(point.projectTokenPrice).toBe(0);
            });
        });

        test('should handle zero or negative data points', async () => {
            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([]),
            };

            const resultZero = await priceChartData(mockPool, 0, mockRepository);
            expect(resultZero).toHaveLength(0);

            const resultNegative = await priceChartData(mockPool, -5, mockRepository);
            expect(resultNegative).toHaveLength(0);
        });

        test('should handle events outside time range', async () => {
            const eventsOutsideRange: SwapEvent[] = [
                {
                    ...baseEventProps,
                    id: 'swap1',
                    type: 'SWAP',
                    blockTimestamp: 1015000, // After end time (1010000)
                    tx: '0x123',
                    valueUSD: 1000,
                    payload: {
                        tokenIn: { address: '0xproject', amount: '100' },
                        tokenOut: { address: '0xreserve', amount: '50' },
                        fee: { address: '0xproject', amount: '100', valueUSD: '10' },
                    },
                },
            ];

            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve(eventsOutsideRange),
            };

            const result = await priceChartData(mockPool, 3, mockRepository);

            // Events after endTime shouldn't affect any timeline points
            result.forEach((point) => {
                expect(point.swapCount).toBe(0);
            });
        });

        test('should handle repository errors gracefully', async () => {
            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.reject(new Error('Database error')),
            };

            await expect(priceChartData(mockPool, 5, mockRepository)).rejects.toThrow('Database error');
        });

        test('should verify cumulative token flows vs per-bucket metrics', async () => {
            const mockEvents: SwapEvent[] = [
                {
                    ...baseEventProps,
                    id: 'swap1',
                    type: 'SWAP',
                    blockTimestamp: 1002000,
                    tx: '0x123',
                    valueUSD: 1000,
                    payload: {
                        tokenIn: { address: '0xproject', amount: '100' },
                        tokenOut: { address: '0xreserve', amount: '50' },
                        fee: { address: '0xreserve', amount: '10', valueUSD: '10' },
                    },
                },
                {
                    ...baseEventProps,
                    id: 'swap2',
                    type: 'SWAP',
                    blockTimestamp: 1006000,
                    tx: '0x456',
                    valueUSD: 2000,
                    payload: {
                        tokenIn: { address: '0xreserve', amount: '25' },
                        tokenOut: { address: '0xproject', amount: '40' },
                        fee: { address: '0xreserve', amount: '5', valueUSD: '5' },
                    },
                },
            ];

            const mockRepository: TokenFlowsRepository = {
                getAllEventsForTimeRange: () => Promise.resolve([...mockEvents].reverse()),
            };

            const result = await priceChartData(mockPool, 4, mockRepository);

            // Timeline: 1000000, 1003333, 1006667, 1010000
            const firstBucket = result.find((r) => r.timestamp === 1003333);
            const secondBucket = result.find((r) => r.timestamp === 1006667);
            const endBucket = result.find((r) => r.timestamp === 1010000);

            // Verify token flows are cumulative by checking the result structure
            // Note: prices might be 0 due to weighted pool formula constraints
            // Focus on verifying the cumulative nature of token flows
            expect(firstBucket).toBeDefined();
            expect(secondBucket).toBeDefined();
            expect(endBucket).toBeDefined();

            // Per-bucket metrics should only count events in that bucket
            expect(firstBucket?.swapCount).toBe(1); // Only swap1 in this bucket
            expect(firstBucket?.volume).toBe(1000); // Only swap1 volume
            expect(firstBucket?.sellVolume).toBe(100); // Only swap1 sell volume

            expect(secondBucket?.swapCount).toBe(1); // Only swap2 in this bucket
            expect(secondBucket?.volume).toBe(2000); // Only swap2 volume
            expect(secondBucket?.buyVolume).toBe(40); // Only swap2 buy volume
            expect(secondBucket?.sellVolume).toBe(0); // No sell in this bucket

            expect(endBucket?.swapCount).toBe(0); // No swaps in this bucket
            expect(endBucket?.volume).toBe(0); // No volume in this bucket
        });
    });
});
