import { syncPools } from './sync-pools';
import { prisma } from '../../../prisma/prisma-client';
import { PrismaPool } from '@prisma/client';
import { PoolFragment } from '@modules/subgraphs/balancer-v3-vault/generated/types';
import { fetchErc20Headers } from '@modules/sources/contracts';
import { getViemClient } from '@modules/sources/viem-client';

// Mock the module dependencies
jest.mock('@modules/sources/contracts', () => ({
    ...jest.requireActual('@modules/sources/contracts'),
    fetchErc20Headers: jest.fn().mockResolvedValue({ '2': { name: 'name', symbol: 'symbol' } }),
    fetchWeightedPoolData: jest.fn().mockResolvedValue({}),
    fetchPoolTokens: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../prisma/prisma-client', () => ({
    prisma: {
        prismaPool: {
            findMany: jest.fn().mockResolvedValue([{ id: '1' }] as PrismaPool[]),
            create: jest.fn(),
        },
        prismaToken: {
            findMany: jest.fn(),
            createMany: jest.fn(),
        },
        prismaPoolExpandedTokens: {
            createMany: jest.fn(),
        },
        prismaPoolTokenDynamicData: {
            createMany: jest.fn(),
        },
    },
}));

describe('syncPools', () => {
    const subgraphClient = {
        Pools: jest.fn().mockResolvedValue({ pools: [{ id: '1' }, { id: '2' }] as PoolFragment[] }),
    };
    const viemClient = jest.mocked(getViemClient('SEPOLIA'));

    beforeEach(() => {
        jest.clearAllMocks();
        return syncPools(subgraphClient, viemClient, 'vaultAddress', 'SEPOLIA');
    });

    it('should fetch pools from subgraph', async () => {
        expect(subgraphClient.Pools).toHaveBeenCalled();
    });

    it('should fetch additional data from contracts for missing pools', async () => {
        expect(fetchErc20Headers).toHaveBeenCalledWith(['2'], expect.anything());
    });

    it('should store missing pools in the database', async () => {
        expect(prisma.prismaPool.create).toHaveBeenCalledWith({ data: expect.objectContaining({ id: '2' }) });
    });
});
