import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { PoolOnChainDataService } from '../../../pool/lib/pool-on-chain-data.service';
import _ from 'lodash';

export const syncOnchainDataForAllPools = async (
    blockNumber: number,
    chain: Chain,
    vaultAddress: string,
    balancerQueriesAddress: string,
    yieldProtocolFeePercentage: string,
    swapProtocolFeePercentage: string,
    gyroConfig?: string,
): Promise<string[]> => {
    // Get all the pools
    const poolIds = (
        await prisma.prismaPool.findMany({
            select: { id: true },
            where: {
                NOT: {
                    categories: {
                        has: 'BLACK_LISTED',
                    },
                },
                chain,
                protocolVersion: 2,
            },
        })
    ).map((item) => item.id);

    return syncOnChainDataForPools(
        poolIds,
        blockNumber,
        chain,
        vaultAddress,
        balancerQueriesAddress,
        yieldProtocolFeePercentage,
        swapProtocolFeePercentage,
        gyroConfig,
    );
};

export const syncOnChainDataForPools = async (
    poolIds: string[],
    blockNumber: number,
    chain: Chain,
    vaultAddress: string,
    balancerQueriesAddress: string,
    yieldProtocolFeePercentage: string,
    swapProtocolFeePercentage: string,
    gyroConfig?: string,
): Promise<string[]> => {
    const chunks = _.chunk(poolIds, 100);

    const poolOnChainDataService = new PoolOnChainDataService(() => ({
        vaultAddress,
        balancerQueriesAddress,
        yieldProtocolFeePercentage,
        swapProtocolFeePercentage,
        gyroConfig,
    }));

    const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
        where: {
            chain,
        },
    });

    for (const chunk of chunks) {
        await poolOnChainDataService.updateOnChainStatus(chunk, chain);
        await poolOnChainDataService.updateOnChainData(chunk, chain, blockNumber, tokenPrices);
    }

    return poolIds;
};
