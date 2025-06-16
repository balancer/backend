import { expect, test, describe, beforeEach } from 'vitest';
import { Chain, PrismaPoolAprType, PrismaPoolType } from '@prisma/client';
import { SwapFeeAprHandler } from './swap-fee-apr-handler';
import { PoolAPRData } from '../../types';

describe('SwapFeeAprCalculator', () => {
    let calculator: SwapFeeAprHandler;
    let mockPool: PoolAPRData;

    beforeEach(() => {
        calculator = new SwapFeeAprHandler();

        // Create a mock pool with dynamic data for testing
        mockPool = {
            id: 'test-pool-id',
            chain: Chain.MAINNET,
            type: 'WEIGHTED',
            dynamicData: {
                totalLiquidity: 1000000, // $1M liquidity
                fees24h: 1000, // $1k fees per 24h
                protocolSwapFee: '0.2', // 20% protocol fee
                protocolYieldFee: '0.1', // 10% yield fee
                aggregateSwapFee: '0.0', // No aggregate fee
                isInRecoveryMode: false,
            },
        } as unknown as PoolAPRData;
    });

    test('should return correct calculator name', () => {
        expect(calculator.getAprServiceName()).toBe('SwapFeeAprCalculator');
    });

    test('should calculate correct APR with protocol fee', async () => {
        const aprItems = await calculator.calculateAprForPools([mockPool]);

        expect(aprItems.length).toBe(1);
        expect(aprItems[0].id).toBe('test-pool-id-SWAP_FEE_24H');
        expect(aprItems[0].type).toBe(PrismaPoolAprType.SWAP_FEE_24H);
        expect(aprItems[0].poolId).toBe('test-pool-id');
        expect(aprItems[0].title).toBe('Swap fees APR (24h)');

        // Calculate expected APR: (fees24h * 365 / totalLiquidity) * (1 - protocolFee)
        // (1000 * 365 / 1000000) * (1 - 0.2) = 0.365 * 0.8 = 0.292 or 29.2%
        expect(aprItems[0].apr).toBeCloseTo(0.292, 3);
    });

    test('should handle zero liquidity', async () => {
        mockPool.dynamicData!.totalLiquidity = 0;

        const aprItems = await calculator.calculateAprForPools([mockPool]);

        expect(aprItems.length).toBe(1);
        expect(aprItems[0].apr).toBe(0);
    });

    test('should handle recovery mode', async () => {
        mockPool.dynamicData!.isInRecoveryMode = true;

        const aprItems = await calculator.calculateAprForPools([mockPool]);

        // In recovery mode, protocol fee should be 0
        // (1000 * 365 / 1000000) * (1 - 0) = 0.365 or 36.5%
        expect(aprItems[0].apr).toBeCloseTo(0.365, 3);
    });

    test('should handle GYROE pool type', async () => {
        mockPool.type = PrismaPoolType.GYROE;

        const aprItems = await calculator.calculateAprForPools([mockPool]);

        // For GYROE, protocolFee = protocolYieldFee = 0.1
        // (1000 * 365 / 1000000) * (1 - 0.1) = 0.365 * 0.9 = 0.3285 or 32.85%
        expect(aprItems[0].apr).toBeCloseTo(0.3285, 3);
    });

    test('should handle LIQUIDITY_BOOTSTRAPPING pool type', async () => {
        mockPool.type = PrismaPoolType.LIQUIDITY_BOOTSTRAPPING;

        const aprItems = await calculator.calculateAprForPools([mockPool]);

        // For LIQUIDITY_BOOTSTRAPPING, protocol fee should be 0
        // (1000 * 365 / 1000000) * (1 - 0) = 0.365 or 36.5%
        expect(aprItems[0].apr).toBeCloseTo(0.365, 3);
    });

    test('should handle V3 protocol version', async () => {
        mockPool.protocolVersion = 3;
        mockPool.dynamicData!.aggregateSwapFee = '0.3'; // 30% aggregate fee

        const aprItems = await calculator.calculateAprForPools([mockPool]);

        // For V3, protocolFee = aggregateSwapFee = 0.3
        // (1000 * 365 / 1000000) * (1 - 0.3) = 0.365 * 0.7 = 0.2555 or 25.55%
        expect(aprItems[0].apr).toBeCloseTo(0.2555, 3);
    });

    test('should cap extremely large APR values', async () => {
        mockPool.dynamicData!.fees24h = 1e28; // Extremely large fees

        const aprItems = await calculator.calculateAprForPools([mockPool]);

        // Should cap the value to 0 when it exceeds MAX_DB_INT
        expect(aprItems[0].apr).toBe(0);
    });

    test('should calculate APR for multiple pools', async () => {
        const secondPool = JSON.parse(JSON.stringify(mockPool)) as PoolAPRData;
        secondPool.id = 'test-pool-id-2';
        secondPool.dynamicData!.poolId = 'test-pool-id-2';
        secondPool.dynamicData!.fees24h = 2000; // $2k fees per 24h

        const aprItems = await calculator.calculateAprForPools([mockPool, secondPool]);

        expect(aprItems.length).toBe(2);
        expect(aprItems[0].poolId).toBe('test-pool-id');
        expect(aprItems[1].poolId).toBe('test-pool-id-2');

        // First pool: (1000 * 365 / 1000000) * (1 - 0.2) = 0.365 * 0.8 = 0.292 or 29.2%
        expect(aprItems[0].apr).toBeCloseTo(0.292, 3);

        // Second pool: (2000 * 365 / 1000000) * (1 - 0.2) = 0.73 * 0.8 = 0.584 or 58.4%
        expect(aprItems[1].apr).toBeCloseTo(0.584, 3);
    });
});
