import { expect, test, describe, mock, beforeEach } from 'bun:test';
import { blockNumbers } from './index';
import { Chain } from '@prisma/client';

describe('blockNumbers', () => {
    const mockEvents = {
        $queryRawUnsafe: mock(() => {}),
    };

    beforeEach(() => {
        mockEvents.$queryRawUnsafe.mockReset();
    });

    describe('getBlock', () => {
        test('should return block number for given timestamp', async () => {
            const mockEvent = [{ blockNumber: 12345 }];
            mockEvents.$queryRawUnsafe.mockResolvedValue(mockEvent);

            const service = blockNumbers(mockEvents as any);
            const result = await service.getBlock(Chain.MAINNET, 1000);

            expect(result).toBe(12345);
        });

        test('should return undefined if no event found', async () => {
            mockEvents.$queryRawUnsafe.mockResolvedValue([]);

            const service = blockNumbers(mockEvents as any);
            const result = await service.getBlock(Chain.MAINNET, 1000);

            expect(result).toBeUndefined();
        });
    });

    describe('getDailyBlocks', () => {
        test('should return daily block numbers', async () => {
            const mockBlocks = [
                { timestamp: 1000, number: 12345 },
                { timestamp: 2000, number: 12445 },
            ];
            mockEvents.$queryRawUnsafe.mockResolvedValue(mockBlocks);

            const service = blockNumbers(mockEvents as any);
            const result = await service.getDailyBlocks(Chain.MAINNET, 2);

            expect(result).toEqual(mockBlocks);
        });
    });
});
