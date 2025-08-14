import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Chain } from '@prisma/client';
import { BeetsPriceHandler } from './beets-price-handler';
import { TokenPriceData } from '../types';

describe('BeetsPriceHandler', () => {
    let handler: BeetsPriceHandler;
    let mockViemClient: any;
    let getViemClientMock: any;

    beforeEach(() => {
        mockViemClient = {
            readContract: mock(),
        };
        getViemClientMock = mock(() => mockViemClient);
        handler = new BeetsPriceHandler(getViemClientMock);
    });

    describe('calculatePricesForTokens', () => {
        it('should calculate prices for BEETS tokens when stS price is available', async () => {
            // Mock successful batch swap response
            const mockDeltas = ['-1000000000000000000', '2000000000000000000']; // -1 BEETS, +2 stS
            mockViemClient.readContract.mockResolvedValue(mockDeltas);

            const tokens: TokenPriceData[] = [
                {
                    address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
                {
                    address: '0x2d0e0814e62d80056181f5cd932274405966e4f0',
                    chain: Chain.SONIC,
                    types: ['ERC20'],
                },
                {
                    address: '0xb4bc46bc6cb217b59ea8f4530bae26bf69f677f0',
                    chain: Chain.OPTIMISM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xe5da20f15420ad15de0fa650600afc998bbe3955', { price: 1.0, updatedBy: 'initial' }); // stS price

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(3);
            expect(priceItems[0].address).toBe('0xf24bcf4d1e507740041c9cfd2dddb29585adce1e');
            expect(priceItems[0].chain).toBe(Chain.FANTOM);
            expect(priceItems[0].price).toBe(2.0); // 2 stS * $1 = $2
            expect(priceItems[0].updatedBy).toBe('BeetsPriceHandlerService');

            expect(priceItems[1].address).toBe('0x2d0e0814e62d80056181f5cd932274405966e4f0');
            expect(priceItems[1].chain).toBe(Chain.SONIC);
            expect(priceItems[1].price).toBe(2.0);

            expect(priceItems[2].address).toBe('0xb4bc46bc6cb217b59ea8f4530bae26bf69f677f0');
            expect(priceItems[2].chain).toBe(Chain.OPTIMISM);
            expect(priceItems[2].price).toBe(2.0);

            // Verify viem client was called with correct parameters
            expect(getViemClientMock).toHaveBeenCalledWith(Chain.SONIC);
            expect(mockViemClient.readContract).toHaveBeenCalledWith({
                address: '0xba12222222228d8ba445958a75a0704d566bf2c8',
                abi: expect.any(Object),
                functionName: 'queryBatchSwap',
                args: expect.arrayContaining([
                    0, // SwapKind.GivenIn
                    expect.any(Array), // swaps
                    expect.any(Array), // assets
                    expect.any(Object), // funds
                ]),
            });
        });

        it('should return empty array when no BEETS tokens are found', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xsomeothertoken',
                    chain: Chain.MAINNET,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xe5da20f15420ad15de0fa650600afc998bbe3955', { price: 1.0, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockViemClient.readContract).not.toHaveBeenCalled();
        });

        it('should return empty array when stS price is not available', async () => {
            const tokens: TokenPriceData[] = [
                {
                    address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>(); // No stS price

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockViemClient.readContract).not.toHaveBeenCalled();
        });

        it('should return empty array when batch swap query fails', async () => {
            mockViemClient.readContract.mockRejectedValue(new Error('Network error'));

            const tokens: TokenPriceData[] = [
                {
                    address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xe5da20f15420ad15de0fa650600afc998bbe3955', { price: 1.0, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
            expect(mockViemClient.readContract).toHaveBeenCalled();
        });

        it('should return empty array when swap returns zero output', async () => {
            // Mock swap response with zero output
            const mockDeltas = ['-1000000000000000000', '0']; // -1 BEETS, 0 stS
            mockViemClient.readContract.mockResolvedValue(mockDeltas);

            const tokens: TokenPriceData[] = [
                {
                    address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xe5da20f15420ad15de0fa650600afc998bbe3955', { price: 1.0, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(0);
        });

        it('should only process BEETS tokens on supported chains', async () => {
            const mockDeltas = ['-1000000000000000000', '1500000000000000000']; // -1 BEETS, +1.5 stS
            mockViemClient.readContract.mockResolvedValue(mockDeltas);

            const tokens: TokenPriceData[] = [
                {
                    address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
                {
                    address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e', // Same address but different chain
                    chain: Chain.MAINNET, // Not supported
                    types: ['ERC20'],
                },
                {
                    address: '0x2d0e0814e62d80056181f5cd932274405966e4f0',
                    chain: Chain.SONIC,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xe5da20f15420ad15de0fa650600afc998bbe3955', { price: 1.0, updatedBy: 'initial' });

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(2); // Only Fantom and Sonic, not Mainnet
            expect(priceItems[0].chain).toBe(Chain.FANTOM);
            expect(priceItems[1].chain).toBe(Chain.SONIC);
            expect(priceItems[0].price).toBe(1.5); // 1.5 stS * $1 = $1.5
        });

        it('should handle high precision calculations correctly', async () => {
            const mockDeltas = ['-1000000000000000000', '123456789012345678']; // -1 BEETS, +0.123456789012345678 stS
            mockViemClient.readContract.mockResolvedValue(mockDeltas);

            const tokens: TokenPriceData[] = [
                {
                    address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                    chain: Chain.FANTOM,
                    types: ['ERC20'],
                },
            ];

            const allPrices = new Map<string, { price: number; updatedBy: string }>();
            allPrices.set('0xe5da20f15420ad15de0fa650600afc998bbe3955', { price: 2.5, updatedBy: 'initial' }); // Higher stS price

            const priceItems = await handler.calculatePricesForTokens(tokens, allPrices);

            expect(priceItems).toHaveLength(1);
            expect(priceItems[0].price).toBeCloseTo(0.308641972530864195); // 0.123456789012345678 * 2.5
        });
    });

    describe('handler properties', () => {
        it('should have correct handler ID', () => {
            expect(handler.id).toBe('BeetsPriceHandlerService');
        });

        it('should have exitIfFails set to false', () => {
            expect(handler.exitIfFails).toBe(false);
        });
    });
});
