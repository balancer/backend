import { Chain } from '@prisma/client';
import { V3VaultSubgraphClient } from '../../../sources/subgraphs';
import { joinExitsUsd } from '../../../sources/enrichers/join-exits-usd';
import { joinExitV3Transformer } from '../../../sources/transformers/join-exit-v3-transformer';
import { eventsRepository, EventStoreRepository, LatestEventRepository } from '../../../repositories/events';
import { getLastSyncedBlock, upsertLastSyncedBlock } from '../../last-synced-block';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExits = async (
    vaultSubgraphClient: V3VaultSubgraphClient,
    chain: Chain,
    eventRepo: LatestEventRepository & EventStoreRepository = eventsRepository,
): Promise<string[]> => {
    const lastSyncedBlock = await getLastSyncedBlock(chain, 'JOIN_EXITS_V3');

    // Get events
    const addRemoves = await vaultSubgraphClient.getAddRemovesFromBlock(lastSyncedBlock);

    // Prepare DB entries
    const dbEntries = await joinExitV3Transformer(addRemoves, chain);

    console.log(`Syncing ${dbEntries.length} join/exit events`);

    // Enrich with USD values
    const dbEntriesWithUsd = await joinExitsUsd(dbEntries, chain);

    await eventRepo.storeEvents(dbEntriesWithUsd);

    // Store last block
    const lastEvent = dbEntriesWithUsd.sort((a, b) => a.blockNumber - b.blockNumber).pop();
    if (!lastEvent) return [];
    await upsertLastSyncedBlock(chain, 'JOIN_EXITS_V3', lastEvent.blockNumber);

    return dbEntries.map((entry) => entry.id);
};
