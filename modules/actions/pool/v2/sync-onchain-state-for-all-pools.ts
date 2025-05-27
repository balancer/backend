import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { PoolOnChainDataService } from '../../../pool/lib/pool-on-chain-data.service';
import { getViemClient } from '../../../sources/viem-client';

export const syncOnchainStateForAllPools = async (
    chain: Chain,
    vaultAddress: string,
    balancerQueriesAddress: string,
    yieldProtocolFeePercentage: string,
    swapProtocolFeePercentage: string,
    gyroConfig?: string,
): Promise<string[]> => {
    const viemClient = getViemClient(chain);
    const latestBlock = await viemClient.getBlockNumber();

    const poolOnChainDataService = new PoolOnChainDataService(() => ({
        vaultAddress,
        balancerQueriesAddress,
        yieldProtocolFeePercentage,
        swapProtocolFeePercentage,
        gyroConfig,
    }));

    // Update status for all the pools
    const ids = await prisma.prismaPool
        .findMany({
            where: { chain, protocolVersion: 2 },
            select: { id: true },
        })
        .then((pools) => pools.map((pool) => pool.id));

    const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            chain,
        },
    });

    await poolOnChainDataService.updateOnChainStatus(ids, chain);
    await poolOnChainDataService.updateOnChainData(ids, chain, Number(latestBlock), tokenPrices);

    return ids;
};
