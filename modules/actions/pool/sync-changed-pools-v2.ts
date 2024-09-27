import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { PoolOnChainDataService } from '../../pool/lib/pool-on-chain-data.service';
import { getChangedPoolsV2 } from '../../sources/logs';
import { getViemClient } from '../../sources/viem-client';

export const syncChangedPoolsV2 = async (
    chain: Chain,
    vaultAddress: string,
    balancerQueriesAddress: string,
    yieldProtocolFeePercentage: string,
    swapProtocolFeePercentage: string,
    gyroConfig?: string,
): Promise<string[]> => {
    const viemClient = getViemClient(chain);
    const latestBlock = await viemClient.getBlockNumber();

    let lastSync = await prisma.prismaLastBlockSynced.findUnique({
        where: { category_chain: { category: PrismaLastBlockSyncedCategory.POOLS, chain } },
    });
    const lastSyncBlock = lastSync?.blockNumber ?? 0;

    const startBlock = lastSyncBlock + 1;
    const endBlock = latestBlock;

    // no new blocks have been minted, needed for slow networks
    if (startBlock > endBlock) {
        return [];
    }

    const poolOnChainDataService = new PoolOnChainDataService(() => ({
        vaultAddress,
        balancerQueriesAddress,
        yieldProtocolFeePercentage,
        swapProtocolFeePercentage,
        gyroConfig,
    }));

    // Update status for all the pools
    await prisma.prismaPool
        .findMany({
            where: { chain },
            select: { id: true },
        })
        .then((pools) => pools.map((pool) => pool.id))
        .then((poolIds) => poolOnChainDataService.updateOnChainStatus(poolIds, chain));

    // Update other data only for the pools that have changed
    const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            chain,
        },
    });
    const { changedPools } = await getChangedPoolsV2(vaultAddress, viemClient, BigInt(startBlock), endBlock);
    await poolOnChainDataService.updateOnChainData(changedPools, chain, Number(endBlock), tokenPrices);

    await prisma.prismaLastBlockSynced.upsert({
        where: { category_chain: { category: PrismaLastBlockSyncedCategory.POOLS, chain } },
        create: {
            category: PrismaLastBlockSyncedCategory.POOLS,
            blockNumber: Number(endBlock),
            chain,
        },
        update: {
            blockNumber: Number(endBlock),
        },
    });

    return changedPools;
};
