import { Chain } from '@prisma/client';
import type { V2SubgraphClient } from '../../../subgraphs/balancer-subgraph';
import { joinExitsUsd } from '../../../sources/enrichers/join-exits-usd';
import { joinExitV2Transformer } from '../../../sources/transformers/join-exit-v2-transformer';
import { eventsRepository, LatestEventRepository, EventStoreRepository } from '../../../repositories/events';
import { getLastSyncedBlock, upsertLastSyncedBlock } from '../../last-synced-block';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExits = async (
    v2SubgraphClient: V2SubgraphClient,
    chain: Chain,
    eventRepo: LatestEventRepository & EventStoreRepository = eventsRepository,
): Promise<string[]> => {
    const lastSyncedBlock = await getLastSyncedBlock(chain, 'JOIN_EXITS_V2');

    if (lastSyncedBlock === 0) return [];

    // Get events
    const joinExits = await v2SubgraphClient.getJoinExitsFromBlock(lastSyncedBlock);

    // Prepare DB entries
    const dbEntries = await joinExitV2Transformer(joinExits, chain);

    // Enrich with USD values
    const dbEntriesWithUsd = await joinExitsUsd(dbEntries, chain);

    // Create entries and skip duplicates
    await eventRepo.storeEvents(dbEntriesWithUsd);

    // Store last block
    const lastEvent = dbEntriesWithUsd.sort((a, b) => a.blockNumber - b.blockNumber).pop();
    if (!lastEvent) return [];
    await upsertLastSyncedBlock(chain, 'JOIN_EXITS_V2', lastEvent.blockNumber);

    return dbEntries.map((entry) => entry.id);
};
