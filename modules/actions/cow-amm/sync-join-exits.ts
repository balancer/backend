import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';
import { AddRemove_OrderBy, OrderDirection } from '../../sources/subgraphs/cow-amm/generated/types';
import { joinExitsUsd } from '../../sources/enrichers/join-exits-usd';
import { joinExitV3Transformer } from '../../sources/transformers/join-exit-v3-transformer';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExits = async (subgraphClient: CowAmmSubgraphClient, chain: Chain): Promise<string[]> => {
    // Get the last synced block number from the PrismaLastBlockSynced table
    const lastSyncedBlock = await prisma.prismaLastBlockSynced.findFirst({
        where: {
            category: PrismaLastBlockSyncedCategory.COW_AMM_JOIN_EXITS,
            chain,
        },
    });

    const where = lastSyncedBlock?.blockNumber ? { blockNumber_gt: String(lastSyncedBlock.blockNumber) } : {};

    // Get events
    const { addRemoves } = await subgraphClient.AddRemoves({
        first: 1000,
        where,
        orderBy: AddRemove_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    // Prepare DB entries
    const dbEntries = await joinExitV3Transformer(addRemoves, chain, 1);

    console.log(`Syncing Cow AMM ${dbEntries.length} join/exit events`);

    // Enrich with USD values
    const dbEntriesWithUsd = await joinExitsUsd(dbEntries, chain);

    // Create entries and skip duplicates
    await prisma.prismaPoolEvent
        .createMany({
            data: dbEntriesWithUsd,
            skipDuplicates: true,
        })
        .catch((e) => {
            console.error('Error creating DB entries', e);
        });

    // Update the last synced block number in the PrismaLastBlockSynced table
    const latestBlockNumber = Math.max(...dbEntries.map((entry) => entry.blockNumber));
    if (latestBlockNumber > 0) {
        await prisma.prismaLastBlockSynced.upsert({
            where: {
                category_chain: {
                    category: PrismaLastBlockSyncedCategory.COW_AMM_JOIN_EXITS,
                    chain,
                },
            },
            update: {
                blockNumber: latestBlockNumber,
            },
            create: {
                category: PrismaLastBlockSyncedCategory.COW_AMM_JOIN_EXITS,
                blockNumber: latestBlockNumber,
                chain,
            },
        });
    }

    return dbEntries.map((entry) => entry.id);
};
