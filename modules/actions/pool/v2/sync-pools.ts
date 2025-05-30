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
) => {
    // Get all the pools
    return syncOnChainDataForPools(
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
    blockNumber: number,
    chain: Chain,
    vaultAddress: string,
    balancerQueriesAddress: string,
    yieldProtocolFeePercentage: string,
    swapProtocolFeePercentage: string,
    gyroConfig?: string,
    poolIds?: string[],
) => {
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

    await poolOnChainDataService.updateOnChainStatus(chain, poolIds);
    await poolOnChainDataService.updateOnChainData(chain, blockNumber, tokenPrices, poolIds);

    return 'OK';
};
