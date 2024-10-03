import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';
import _ from 'lodash';
import { OrderDirection, Swap_OrderBy } from '../../sources/subgraphs/cow-amm/generated/types';
import { swapsUsd } from '../../sources/enrichers/swaps-usd';
import { swapCowAmmTransformer } from '../../sources/transformers/swap-cowamm-transformer';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param subgraphClient
 * @param chain
 * @returns
 */
export async function syncSwaps(subgraphClient: CowAmmSubgraphClient, chain = 'SEPOLIA' as Chain) {
    // Get the last synced block number from the PrismaLastBlockSynced table
    const lastSyncedBlock = await prisma.prismaLastBlockSynced.findFirst({
        where: {
            category: PrismaLastBlockSyncedCategory.COW_AMM_SWAPS,
            chain,
        },
    });

    const where = lastSyncedBlock?.blockNumber ? { blockNumber_gt: String(lastSyncedBlock.blockNumber) } : {};

    // Get events
    const { swaps } = await subgraphClient.Swaps({
        first: 1000,
        where,
        orderBy: Swap_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    // Adding swap fee to the swap object
    const dbSwaps = swaps.map((swap) => swapCowAmmTransformer(swap, chain));

    // Enrich with USD values
    const dbEntries = await swapsUsd(dbSwaps, chain);

    await prisma.prismaPoolEvent.createMany({
        skipDuplicates: true,
        data: dbEntries,
    });

    // Update the last synced block number in the PrismaLastBlockSynced table
    const latestBlockNumber = Math.max(...dbEntries.map((entry) => entry.blockNumber));
    if (latestBlockNumber > 0) {
        await prisma.prismaLastBlockSynced.upsert({
            where: {
                category_chain: {
                    category: PrismaLastBlockSyncedCategory.COW_AMM_SWAPS,
                    chain,
                },
            },
            update: {
                blockNumber: latestBlockNumber,
            },
            create: {
                category: PrismaLastBlockSyncedCategory.COW_AMM_SWAPS,
                blockNumber: latestBlockNumber,
                chain,
            },
        });
    }

    return dbEntries;
}
