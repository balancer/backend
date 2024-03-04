import { syncPools } from './sync-pools';
import { prisma } from '../../../prisma/prisma-client';
import { PrismaPool } from '@prisma/client';
import type { ViemClient } from '../../sources/viem-client';
import type { V3VaultSubgraphClient } from '../../sources/subgraphs/balancer-v3-vault';
import { VaultPoolFragment as VaultSubgraphPoolFragment } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { TypePoolFragment as PoolSubgraphPoolFragment } from '../../subgraphs/balancer-v3-pools/generated/types';

// Mock the module dependencies
jest.mock('../../sources/contracts/fetch-pool-data', () => ({
    fetchPoolData: jest.fn().mockResolvedValue({
        '1': { tokens: [{ address: '1' }] },
        '2': { tokens: [{ address: '2' }] },
    }),
}));

jest.mock('../../../prisma/prisma-client', () => ({
    prisma: {
        prismaPool: {
            findMany: jest.fn().mockResolvedValue([{ id: '1' }] as PrismaPool[]),
            upsert: jest.fn(),
        },
        prismaPoolDynamicData: {
            upsert: jest.fn(),
        },
        prismaPoolToken: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        prismaPoolTokenDynamicData: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        prismaToken: {
            findMany: jest.fn(),
            createMany: jest.fn(),
        },
        prismaPoolExpandedTokens: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        prismaTokenPrice: {
            findMany: jest.fn().mockResolvedValue([]),
        },
    },
}));

// TODO: re-implement after the DB is refactored, so there is less logic to mock
describe('syncPools', () => {
    const vaultSubgraphClient = {
        getAllInitializedPools: jest.fn().mockResolvedValue([
            { id: '1', tokens: [] },
            { id: '2', tokens: [] },
        ] as unknown as VaultSubgraphPoolFragment[]),
    } as unknown as jest.Mocked<V3VaultSubgraphClient>;

    const poolSubgraphClient = {
        Pools: jest.fn().mockResolvedValue({
            pools: [
                { id: '1', factory: { id: '1' } },
                { id: '2', factory: { id: '1' } },
            ] as PoolSubgraphPoolFragment[],
        }),
    };
    const viemClient = jest.fn() as unknown as jest.Mocked<ViemClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        return syncPools(vaultSubgraphClient, poolSubgraphClient, viemClient, '', 'SEPOLIA', BigInt(1));
    });

    it('should fetch pools from vault subgraph', async () => {
        expect(vaultSubgraphClient.getAllInitializedPools).toHaveBeenCalled();
    });

    it('should fetch pools from pools subgraph', async () => {
        expect(poolSubgraphClient.Pools).toHaveBeenCalled();
    });

    it('should store missing pools in the database', async () => {
        expect(prisma.prismaPool.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ create: expect.objectContaining({ id: '1' }) }),
        );
    });
});
