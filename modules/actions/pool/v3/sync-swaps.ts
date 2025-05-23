import { Chain } from '@prisma/client';
import { V3VaultSubgraphClient } from '../../../sources/subgraphs';
import _ from 'lodash';
import { swapV3Transformer } from '../../../sources/transformers/swap-v3-transformer';
import { OrderDirection, Swap_OrderBy } from '../../../sources/subgraphs/balancer-v3-vault/generated/types';
import { swapsUsd } from '../../../sources/enrichers/swaps-usd';
import { eventsRepository, EventStoreRepository, LatestEventRepository } from '../../../repositories/events';

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
    const protocolVersion = 3;

    // Get latest event from the DB
    const latestEvent = await eventRepo.getLatestEvent({
        types: ['SWAP'],
        chain,
        protocolVersion,
    });

    const where = latestEvent?.blockNumber ? { blockNumber_gte: String(latestEvent.blockNumber) } : {};

    // Get events
    const { swaps } = await vaultSubgraphClient.Swaps({
        first: 1000,
        where,
        orderBy: Swap_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    const dbSwaps = swapV3Transformer(swaps, chain);

    // TODO: parse batchSwaps, if needed

    // Enrich with USD values
    const dbEntries = await swapsUsd(dbSwaps, chain);
    await eventRepo.storeEvents(dbEntries);

    return [...new Set(dbEntries.map((entry) => entry.poolId))];
}
