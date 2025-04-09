import { PrismaClient, Chain, Prisma } from '@prisma/client';
import { describe, beforeEach, afterEach, test, expect, jest, spyOn } from 'bun:test';
import { getWeightSnapshots } from './get-weight-snapshots';

// Test data
const pool = '1234' as const;
const chain = Chain.MAINNET;
const snapshotDefault = {
    pool,
    chain,
};

// Mocks
const createPrismaMock = (data: Prisma.quantWeightsCreateInput[] = []) =>
    ({
        quantWeights: {
            findMany: jest.fn().mockResolvedValue(data),
        },
    } as unknown as PrismaClient);

describe('getWeightSnapshots', () => {
    let prisma: PrismaClient;
    const mockNow = 1700000000; // Fixed timestamp for testing

    beforeEach(() => {
        // Mock Date.now() to return a fixed timestamp
        spyOn(Date, 'now').mockImplementation(() => mockNow * 1000);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should handle empty snapshots array', async () => {
        prisma = createPrismaMock([]);

        const result = await getWeightSnapshots(prisma, pool, chain, 1, 3600);

        expect(result).toEqual([]);
        expect(prisma.quantWeights.findMany).toHaveBeenCalledWith({
            where: {
                pool,
                chain,
                timestamp: {
                    gte: mockNow - 86400,
                },
            },
            orderBy: { timestamp: 'asc' },
        });
    });

    test('should handle partially missing weight data', async () => {
        const timestamp1 = mockNow - 24 * 3600;
        const timestamp2 = mockNow;
        prisma = createPrismaMock([
            {
                ...snapshotDefault,
                timestamp: timestamp1,
                weight1: 0,
                weight2: 0,
                weight3: 0,
            },
            {
                ...snapshotDefault,
                timestamp: timestamp2,
                weight1: 1,
                weight2: 1,
                weight3: 1,
            },
        ]);

        const bucketSize = 3600;
        const days = 1;
        const result = await getWeightSnapshots(prisma, pool, chain, days, bucketSize);

        // Should include 24 buckets
        expect(result.length).toEqual(24);

        // Check 13th bucket
        const bucket = result[12];
        expect(bucket).toBeDefined();
        if (bucket) {
            expect(bucket.weights[0]).toBeCloseTo(0.5);
            expect(bucket.weights[4]).toBeUndefined();
        }
    });

    test('should use avg values when multiple snapshots in the same bucket', async () => {
        const timestamp1 = mockNow - 24 * 3600;
        const timestamp2 = mockNow - 24 * 3600 + 1200;
        const timestamp3 = mockNow - 24 * 3600 + 2400;
        const timestamp4 = mockNow;

        prisma = createPrismaMock([
            {
                ...snapshotDefault,
                timestamp: timestamp1,
                weight1: 0.1,
                weight2: 0.2,
                weight3: 0.3,
            },
            {
                ...snapshotDefault,
                timestamp: timestamp2,
                weight1: 0.2,
                weight2: 0.3,
                weight3: 0.4,
            },
            {
                ...snapshotDefault,
                timestamp: timestamp3,
                weight1: 0.3,
                weight2: 0.4,
                weight3: 0.5,
            },
            {
                ...snapshotDefault,
                timestamp: timestamp4,
                weight1: 1,
                weight2: 1,
                weight3: 1,
            },
        ]);

        const result = await getWeightSnapshots(prisma, pool, chain, 1, 3600);

        // Find the bucket that matches the timestamp
        const bucket = result[0];
        expect(bucket).toBeDefined();
        if (bucket) {
            // Should use exact values from snapshot
            expect(bucket.weights[0]).toBeCloseTo(0.2);
            expect(bucket.weights[1]).toBeCloseTo(0.3);
            expect(bucket.weights[2]).toBeCloseTo(0.4);
            expect(bucket.weights[4]).toBeUndefined();
        }
    });
});
