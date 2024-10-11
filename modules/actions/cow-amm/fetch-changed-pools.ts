import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { ViemClient } from '../../sources/viem-client';
import { getChangedCowAmmPools } from '../../sources/logs/get-changed-cow-amm-pools';

export const fetchChangedPools = async (viemClient: ViemClient, chain: Chain, fromBlock: number, toBlock: number) => {
    const poolIds = await prisma.prismaPool
        .findMany({
            where: {
                chain,
                type: 'COW_AMM',
            },
            select: {
                id: true,
            },
        })
        .then((pools) => pools.map((pool) => pool.id));

    return getChangedCowAmmPools(poolIds, viemClient, BigInt(fromBlock), BigInt(toBlock));
};
