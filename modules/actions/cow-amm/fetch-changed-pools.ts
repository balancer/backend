import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { ViemClient } from '../../sources/viem-client';
import { getChangedCowAmmPools } from '../../sources/logs/get-changed-cow-amm-pools';

export const fetchChangedPools = async (viemClient: ViemClient, chain: Chain, fromBlock: number) => {
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
