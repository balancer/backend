import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';

export const getLastSyncedBlock = async (chain: Chain, syncCategory: PrismaLastBlockSyncedCategory) => {
    const lastSyncBlock = (
        await prisma.prismaLastBlockSynced.findFirst({
            where: {
                category: syncCategory,
                chain,
            },
        })
    )?.blockNumber;

    return lastSyncBlock || 0;
};

export const upsertLastSyncedBlock = async (
    chain: Chain,
    syncCategory: PrismaLastBlockSyncedCategory,
    blockNumber: bigint,
) => {
    await prisma.prismaLastBlockSynced.upsert({
        where: {
            category_chain: {
                category: syncCategory,
                chain,
            },
        },
        update: {
            blockNumber: Number(blockNumber),
        },
        create: {
            category: syncCategory,
            blockNumber: Number(blockNumber),
            chain,
        },
    });
};
