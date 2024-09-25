import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { PoolOnChainDataService } from '../../pool/lib/pool-on-chain-data.service';
import { getChangedPools } from '../../sources/logs';
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
    const allPools = await prisma.prismaPool.findMany({
        where: { chain },
    });

    await poolOnChainDataService.updateOnChainStatus(
        allPools.map((pool) => pool.id),
        chain,
    );

    // Get the pools that have changed
    console.time('getChangedPoolIds');
    const { changedPools } = await getChangedPools(vaultAddress, viemClient, BigInt(startBlock), endBlock);
    console.timeEnd('getChangedPoolIds');

    const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            chain,
        },
    });

    await poolOnChainDataService.updateOnChainStatus(changedPools, chain);
    await poolOnChainDataService.updateOnChainData(changedPools, chain, Number(endBlock), tokenPrices);

    await prisma.prismaLastBlockSynced.update({
        where: { category_chain: { category: PrismaLastBlockSyncedCategory.POOLS, chain } },
        data: { blockNumber: Number(endBlock) },
    });

    return changedPools;
};
