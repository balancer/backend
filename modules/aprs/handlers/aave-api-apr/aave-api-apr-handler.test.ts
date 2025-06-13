import { expect, test, describe, beforeEach, vi } from 'vitest';
import { Chain } from '@prisma/client';
import { AaveApiAprHandler } from './aave-api-apr-handler';
import { AaveChanClientInterface } from './aave-chan-client';
import type { PoolAPRData } from '../../types';
import { AaveRewardsAprConfig } from '../types';

describe('AaveApiAprHandler', () => {
    // Mock implementation of the client
    const mockFetchIncentives = vi.fn();
    const mockFetchPrimeIncentives = vi.fn();

    const mockClient: AaveChanClientInterface = {
        fetchIncentives: mockFetchIncentives,
        fetchPrimeIncentives: mockFetchPrimeIncentives,
    };

    let handler: AaveApiAprHandler;
    let mockPool: PoolAPRData;
    const mockConfig: AaveRewardsAprConfig = { chainId: 1 }; // Mainnet

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Create handler with mocked client
        handler = new AaveApiAprHandler(mockConfig, mockClient);

        // Create a mock pool with tokens for testing
        mockPool = {
            id: 'test-pool-id',
            chain: Chain.MAINNET,
            type: 'WEIGHTED',
            tokens: [
                {
                    address: '0xtoken1', // Regular token
                    symbol: 'TKN1',
                    balance: '1000000000000000000',
                    balanceUSD: 5000, // $5k
                },
                {
                    address: '0xincentivizedtoken', // Token that will be incentivized (lowercase to match handler logic)
                    symbol: 'ITKN',
                    balance: '2000000000000000000',
                    balanceUSD: 5000, // $5k
                },
            ],
        } as unknown as PoolAPRData;

        // Mock incentives response
        mockFetchIncentives.mockResolvedValue({
            ITKN: {
                tokenInfo: {
                    symbol: 'ITKN',
                    address: '0xIncentivizedTokenOriginal',
                    book: {
                        STATA_TOKEN: '0xIncentivizedToken', // Will be lowercased by the handler
                    },
                    supplyApr: 0.02, // 2%
                },
                supplyIncentives: [
                    {
                        apr: 5, // 5% (will be divided by 100)
                        rewardToken: {
                            symbol: 'RWD',
                            address: '0xRewardToken',
                        },
                    },
                ],
            },
        });

        // Mock prime incentives response
        mockFetchPrimeIncentives.mockResolvedValue({
            LIDO: {
                tokenInfo: {
                    symbol: 'LIDO',
                    address: '0xLidoOriginal',
                    book: {
                        STATA_TOKEN: '0xIncentivizedToken', // Will be lowercased by the handler
                    },
                },
                supplyIncentives: [
                    {
                        apr: 3, // 3% (will be divided by 100)
                        rewardToken: {
                            symbol: 'PRIME',
                            address: '0xPrimeToken',
                        },
                    },
                ],
            },
        });
    });

    test('should return correct service name', () => {
        expect(handler.getAprServiceName()).toBe('AaveApiAprHandler');
    });

    test('should fetch and calculate APR for incentivized tokens', async () => {
        const aprItems = await handler.calculateAprForPools([mockPool]);

        // Verify client methods were called
        expect(mockFetchIncentives).toHaveBeenCalledWith(1);
        expect(mockFetchPrimeIncentives).toHaveBeenCalled();

        // Should have two items (one for regular and one for prime)
        expect(aprItems.length).toBe(2);

        // First APR item (regular incentive)
        expect(aprItems[0].id).toBe('test-pool-id-0xincentivizedtoken-0xRewardToken');
        expect(aprItems[0].poolId).toBe('test-pool-id');
        expect(aprItems[0].chain).toBe(Chain.MAINNET);
        expect(aprItems[0].title).toBe('RWD APR');
        expect(aprItems[0].type).toBe('MERKL');
        expect(aprItems[0].rewardTokenAddress).toBe('0xRewardToken');
        expect(aprItems[0].rewardTokenSymbol).toBe('RWD');

        // Calculate expected APR: (apr / 100) * tokenShareOfPoolTvl
        // (5 / 100) * (5000 / 10000) = 0.05 * 0.5 = 0.025 or 2.5%
        expect(aprItems[0].apr).toBeCloseTo(0.025, 5);

        // Second APR item (prime incentive)
        expect(aprItems[1].id).toBe('test-pool-id-0xincentivizedtoken-0xPrimeToken');
        expect(aprItems[1].title).toBe('PRIME APR');
        expect(aprItems[1].rewardTokenSymbol).toBe('PRIME');

        // Calculate expected APR: (apr / 100) * tokenShareOfPoolTvl
        // (3 / 100) * (5000 / 10000) = 0.03 * 0.5 = 0.015 or 1.5%
        expect(aprItems[1].apr).toBeCloseTo(0.015, 5);
    });

    test('should handle a pool with no incentivized tokens', async () => {
        // Change the token address so it doesn't match the incentivized one
        mockPool.tokens[1].address = '0xNonIncentivizedToken';

        const aprItems = await handler.calculateAprForPools([mockPool]);

        // Client methods should still be called
        expect(mockFetchIncentives).toHaveBeenCalled();
        expect(mockFetchPrimeIncentives).toHaveBeenCalled();

        // No APR items should be returned
        expect(aprItems.length).toBe(0);
    });

    test('should handle multiple pools', async () => {
        const secondPool = JSON.parse(JSON.stringify(mockPool)) as PoolAPRData;
        secondPool.id = 'test-pool-id-2';

        const aprItems = await handler.calculateAprForPools([mockPool, secondPool]);

        // Should have four items (2 pools × 2 incentives each)
        expect(aprItems.length).toBe(4);
        expect(aprItems[0].poolId).toBe('test-pool-id');
        expect(aprItems[1].poolId).toBe('test-pool-id-2');
        expect(aprItems[2].poolId).toBe('test-pool-id');
        expect(aprItems[3].poolId).toBe('test-pool-id-2');
    });

    test('should handle empty incentives', async () => {
        // Mock empty incentives response
        mockFetchIncentives.mockResolvedValue({});
        mockFetchPrimeIncentives.mockResolvedValue({});

        const aprItems = await handler.calculateAprForPools([mockPool]);

        // No APR items should be returned
        expect(aprItems.length).toBe(0);
    });

    test('should handle incentives with no supplyIncentives', async () => {
        // Mock response with no supplyIncentives
        mockFetchIncentives.mockResolvedValue({
            ITKN: {
                tokenInfo: {
                    symbol: 'ITKN',
                    address: '0xIncentivizedTokenOriginal',
                    book: {
                        STATA_TOKEN: '0xIncentivizedToken',
                    },
                },
                supplyIncentives: [],
            },
        });
        mockFetchPrimeIncentives.mockResolvedValue({});

        const aprItems = await handler.calculateAprForPools([mockPool]);

        // No APR items should be returned
        expect(aprItems.length).toBe(0);
    });

    test('should handle non-mainnet chains', async () => {
        // Create handler for Arbitrum
        const arbitrumConfig: AaveRewardsAprConfig = { chainId: 42161 };
        const arbitrumHandler = new AaveApiAprHandler(arbitrumConfig, mockClient);

        // Mock pool for Arbitrum
        const arbitrumPool = {
            ...mockPool,
            chain: Chain.ARBITRUM,
        } as unknown as PoolAPRData;

        // Mock response for Arbitrum
        mockFetchIncentives.mockResolvedValue({
            ITKN: {
                tokenInfo: {
                    symbol: 'ITKN',
                    address: '0xIncentivizedTokenOriginal',
                    book: {
                        STATA_TOKEN: '0xIncentivizedToken',
                    },
                },
                supplyIncentives: [
                    {
                        apr: 8, // 8% (will be divided by 100)
                        rewardToken: {
                            symbol: 'ARB',
                            address: '0xArbToken',
                        },
                    },
                ],
            },
        });

        // Prime incentives should NOT be called for non-mainnet chains
        mockFetchPrimeIncentives.mockResolvedValue({});

        const aprItems = await arbitrumHandler.calculateAprForPools([arbitrumPool]);

        // Verify client methods were called correctly
        expect(mockFetchIncentives).toHaveBeenCalledWith(42161);
        // Prime incentives should not be called for Arbitrum
        expect(mockFetchPrimeIncentives).not.toHaveBeenCalled();

        // Should have one item
        expect(aprItems.length).toBe(1);
        expect(aprItems[0].chain).toBe(Chain.ARBITRUM);
        expect(aprItems[0].rewardTokenSymbol).toBe('ARB');

        // Calculate expected APR: (apr / 100) * tokenShareOfPoolTvl
        // (8 / 100) * (5000 / 10000) = 0.08 * 0.5 = 0.04 or 4%
        expect(aprItems[0].apr).toBeCloseTo(0.04, 5);
    });
});
