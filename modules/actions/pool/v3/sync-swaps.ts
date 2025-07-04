import { Chain } from '@prisma/client';
import { V3VaultSubgraphClient } from '../../../sources/subgraphs';
import _ from 'lodash';
import { swapV3Transformer } from '../../../sources/transformers/swap-v3-transformer';
import { swapsUsd } from '../../../sources/enrichers/swaps-usd';
import { eventsRepository, EventStoreRepository, LatestEventRepository } from '../../../repositories/events';
import { getLastSyncedBlock, upsertLastSyncedBlock } from '../../last-synced-block';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param vaultSubgraphClient
 * @param chain
 * @returns
 */
export async function syncSwaps(
    vaultSubgraphClient: V3VaultSubgraphClient,
    chain = 'SEPOLIA' as Chain,
    eventRepo: LatestEventRepository & EventStoreRepository = eventsRepository,
): Promise<string[]> {
    const lastSyncedBlock = await getLastSyncedBlock(chain, 'SWAPS_V2');

    if (lastSyncedBlock === 0) return [];

    // Get events
    const swaps = await vaultSubgraphClient.getSwapsFromBlock(lastSyncedBlock);

    const dbSwaps = swapV3Transformer(swaps, chain);

    // TODO: parse batchSwaps, if needed

    // Enrich with USD values
    const dbEntries = await swapsUsd(dbSwaps, chain);
    await eventRepo.storeEvents(dbEntries);

    // Store last block
    const lastEvent = dbEntries.sort((a, b) => a.blockNumber - b.blockNumber).pop();
    if (!lastEvent) return [];
    await upsertLastSyncedBlock(chain, 'SWAPS_V3', lastEvent.blockNumber);

    return [...new Set(dbEntries.map((entry) => entry.poolId))];
}
