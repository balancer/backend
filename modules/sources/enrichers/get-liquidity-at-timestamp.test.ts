import { getLiquidityAtTimestamp } from './get-liquidity-at-timestamp';

jest.mock('../../../prisma/prisma-client', () => ({
    prisma: {
        prismaTokenPrice: {
            findMany: jest.fn().mockResolvedValue(
                Array.from({ length: 4 }, (_, i) => ({
                    tokenAddress: `0x${i}`,
                    price: i + 1,
                })),
            ),
        },
    },
}));

const blockNumbersClient = {
    fetchBlockByTime: jest.fn().mockResolvedValue(1),
};

describe('getLiquidityAtTimestamp', () => {
    it('should return null if there are no pools', async () => {
        const subgraphClient = {
            PoolBalances: jest.fn().mockResolvedValue({
                pools: [],
            }),
        };
        const result = await getLiquidityAtTimestamp([], subgraphClient as any, blockNumbersClient as any);
        expect(result).toBeNull();
    });

    it('should return null if there are no token addresses', async () => {
        const subgraphClient = {
            PoolBalances: jest.fn().mockResolvedValue({
                pools: [
                    {
                        id: '0x0',
                        address: '0x0',
                        tokens: [],
                    },
                ],
            }),
        };
        const result = await getLiquidityAtTimestamp(['0x0'], subgraphClient as any, blockNumbersClient as any);
        expect(result).toBeNull();
    });

    it('should return the correct TVLs', async () => {
        const tokens = Array.from({ length: 4 }, (_, i) => ({
            address: `0x${i}`,
            decimals: 2,
            balance: `${i}00`,
            priceRate: `1.${i}`,
        }));

        const subgraphClient = {
            PoolBalances: jest.fn().mockResolvedValue({
                pools: [
                    {
                        id: '0x0',
                        address: '0x0',
                        tokens,
                    },
                ],
            }),
        };
        const result = await getLiquidityAtTimestamp(['0x0'], subgraphClient as any, blockNumbersClient as any);

        // 1 * 2 * 1.1 + 2 * 3 * 1.2 + 3 * 4 * 1.3 = 25
        expect(result).toEqual({ '0x0': 25 });
    });
});
