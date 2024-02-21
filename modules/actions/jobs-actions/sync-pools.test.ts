import { addMissingPoolsFromSubgraph } from './sync-pools';
import { prisma } from '../../../prisma/prisma-client';
import { PrismaPool } from '@prisma/client';
import { PoolFragment as VaultSubgraphPoolFragment } from '../../subgraphs/balancer-v3-vault/generated/types';
import { PoolFragment as PoolSubgraphPoolFragment } from '../../subgraphs/balancer-v3-pools/generated/types';

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
    const vaultSubgraphClient = {
        Pools: jest.fn().mockResolvedValue({ pools: [{ id: '1' }, { id: '2' }] as VaultSubgraphPoolFragment[] }),
    };
    const poolSubgraphClient = {
        Pools: jest.fn().mockResolvedValue({
            pools: [
                { id: '1', factory: { id: '1' } },
                { id: '2', factory: { id: '1' } },
            ] as PoolSubgraphPoolFragment[],
        }),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        return addMissingPoolsFromSubgraph(vaultSubgraphClient, poolSubgraphClient, 'SEPOLIA');
    });

    it('should fetch pools from vault subgraph', async () => {
        expect(vaultSubgraphClient.Pools).toHaveBeenCalled();
    });

    it('should fetch pools from pools subgraph', async () => {
        expect(poolSubgraphClient.Pools).toHaveBeenCalled();
    });

    it('should store missing pools in the database', async () => {
        expect(prisma.prismaPool.create).toHaveBeenCalledWith({ data: expect.objectContaining({ id: '2' }) });
    });
});
