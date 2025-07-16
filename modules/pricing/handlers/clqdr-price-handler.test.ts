import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Chain } from '@prisma/client';
import { ClqdrPriceHandler } from './clqdr-price-handler';
import { TokenPriceData } from '../types';

describe('ClqdrPriceHandler', () => {
    let handler: ClqdrPriceHandler;
    let mockViemClient: any;
    let getViemClientMock: any;

    beforeEach(() => {
        mockViemClient = {
            readContract: mock(),
        };
        getViemClientMock = mock(() => mockViemClient);
        handler = new ClqdrPriceHandler(getViemClientMock);
    });

    describe('calculatePricesForTokens', () => {
        it('should calculate price for CLQDR tokens when LQDR price is available', async () => {
            // Mock contract rate response (2.5 LQDR per CLQDR)
            const mockRate = '2500000000000000000'; // 2.5 * 10^18
            mockViemClient.readContract.mockResolvedValue(mockRate);

            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 1.0); // LQDR price = $1

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].address).toBe('0x814c66594a22404e101fecfecac1012d8d75c156');
            expect(priceItems[0].chain).toBe(Chain.FANTOM);
            expect(priceItems[0].price).toBe(2.5); // 1.0 * 2.5 = 2.5
            expect(priceItems[0].updatedBy).toBe('ClqdrPriceHandlerService');
            expect(priceItems[0].updatedAt).toBeInstanceOf(Date);

            // Verify viem client was called correctly
            expect(getViemClientMock).toHaveBeenCalledWith(Chain.FANTOM);
            expect(mockViemClient.readContract).toHaveBeenCalledWith({
                address: '0x1a148871bf262451f34f13cbcb7917b4fe59cb32',
                abi: expect.any(Array),
                functionName: 'getRate',
            });
        });

        it('should return empty array when no CLQDR tokens are found', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xsomeothertoken',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 1.0);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockViemClient.readContract).not.toHaveBeenCalled();
        });

        it('should only process CLQDR tokens on Fantom chain', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.MAINNET, // Wrong chain
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 1.0);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockViemClient.readContract).not.toHaveBeenCalled();
        });

        it('should return empty array when LQDR price is not available', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>(); // No LQDR price

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockViemClient.readContract).not.toHaveBeenCalled();
        });

        it('should return empty array when contract rate call fails', async () => {
            mockViemClient.readContract.mockRejectedValue(new Error('Contract error'));

            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 1.0);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockViemClient.readContract).toHaveBeenCalled();
        });

        it('should return empty array when contract returns zero rate', async () => {
            // Mock contract rate response (0 rate)
            const mockRate = '0';
            mockViemClient.readContract.mockResolvedValue(mockRate);

            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 1.0);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should handle high precision rate calculations correctly', async () => {
            // Mock contract rate response (1.123456789 LQDR per CLQDR)
            const mockRate = '1123456789000000000'; // 1.123456789 * 10^18
            mockViemClient.readContract.mockResolvedValue(mockRate);

            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 2.5); // LQDR price = $2.5

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].price).toBeCloseTo(2.8086419725); // 2.5 * 1.123456789
        });

        it('should handle multiple CLQDR tokens correctly', async () => {
            // Mock contract rate response (1.5 LQDR per CLQDR)
            const mockRate = '1500000000000000000'; // 1.5 * 10^18
            mockViemClient.readContract.mockResolvedValue(mockRate);

            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 3.0); // LQDR price = $3

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(2);
            expect(priceItems[0].price).toBe(4.5); // 3.0 * 1.5 = 4.5
            expect(priceItems[1].price).toBe(4.5); // Same price for both tokens
        });

        it('should handle error during price calculation gracefully', async () => {
            // Mock contract rate that throws during calculation
            mockViemClient.readContract.mockResolvedValue('invalid_rate');

            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 1.0);

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should calculate price correctly with different LQDR prices', async () => {
            // Mock contract rate response (0.8 LQDR per CLQDR)
            const mockRate = '800000000000000000'; // 0.8 * 10^18
            mockViemClient.readContract.mockResolvedValue(mockRate);

            const tokens: TokenPriceData[] = [
                {
                    address: '0x814c66594a22404e101fecfecac1012d8d75c156',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, number>();
            allPrices.set('0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9', 5.0); // LQDR price = $5

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].price).toBe(4.0); // 5.0 * 0.8 = 4.0
        });
    });

    describe('handler properties', () => {
        it('should have correct handler ID', () => {
            expect(handler.id).toBe('ClqdrPriceHandlerService');
        });

        it('should have exitIfFails set to false', () => {
            expect(handler.exitIfFails).toBe(false);
        });
    });
});