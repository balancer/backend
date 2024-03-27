import { getLiquidityAndSharesAtTimestamp } from './get-liquidity-and-shares-at-timestamp';

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

const blockNumbersSubgraphClient = {
    fetchBlockByTime: jest.fn().mockResolvedValue(1),
};

describe('getLiquidityAndSharesAtTimestamp', () => {
    it('should return null if there are no pools', async () => {
        const subgraphClient = {
            getAllPoolBalances: jest.fn().mockResolvedValue([]),
        };
        const result = await getLiquidityAndSharesAtTimestamp(
            [],
            subgraphClient as any,
            blockNumbersSubgraphClient as any,
        );
        expect(result).toBeNull();
    });

    it('should return null if there are no token addresses', async () => {
        const subgraphClient = {
            getAllPoolBalances: jest.fn().mockResolvedValue([
                {
                    id: '0x0',
                    address: '0x0',
                    tokens: [],
                },
            ]),
        };
        const result = await getLiquidityAndSharesAtTimestamp(
            ['0x0'],
            subgraphClient as any,
            blockNumbersSubgraphClient as any,
        );
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
            getAllPoolBalances: jest.fn().mockResolvedValue([
                {
                    id: '0x0',
                    address: '0x0',
                    tokens,
                },
            ]),
        };
        const result = await getLiquidityAndSharesAtTimestamp(
            ['0x0'],
            subgraphClient as any,
            blockNumbersSubgraphClient as any,
        );

        // 1 * 2 * 1.1 + 2 * 3 * 1.2 + 3 * 4 * 1.3 = 25
        expect(result).toEqual({ '0x0': { tvl: 25 } });
    });
});
