import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { ViemClient } from '../../sources/viem-client';
import { getChangedCowAmmPools } from '../../sources/logs/get-changed-cow-amm-pools';

export const fetchChangedPools = async (viemClient: ViemClient, chain: Chain) => {
    const fromBlock = (
        await prisma.prismaPoolDynamicData.findFirst({
            where: {
                chain,
                pool: {
                    vaultVersion: 0,
                },
            },
            orderBy: {
                blockNumber: 'desc',
            },
            select: {
                chain: true,
                blockNumber: true,
            },
        })
    )?.blockNumber;

    // Sepolia vault deployment block, uncomment to test from the beginning
    // const fromBlock = 5274748n;

    // Guard against unsynced pools
    if (!fromBlock) {
        throw new Error(`No synced pools found for chain: ${chain}`);
    }

    const poolIds = await prisma.prismaPool
        .findMany({
            where: {
                chain,
                vaultVersion: 0,
            },
            select: {
                id: true,
            },
        })
        .then((pools) => pools.map((pool) => pool.id));

    const { changedPools, latestBlock } = await getChangedCowAmmPools(poolIds, viemClient, BigInt(fromBlock));

    return { changedPools, latestBlock };
};
