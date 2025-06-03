import { Chain } from '@prisma/client';
import type { BalancerSubgraphService } from '../../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import {
    JoinExit_OrderBy,
    OrderDirection,
} from '../../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { joinExitsUsd } from '../../../sources/enrichers/join-exits-usd';
import { joinExitV2Transformer } from '../../../sources/transformers/join-exit-v2-transformer';
import { eventsRepository, LatestEventRepository, EventStoreRepository } from '../../../repositories/events';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExits = async (
    v2SubgraphClient: BalancerSubgraphService,
    chain: Chain,
    eventRepo: LatestEventRepository & EventStoreRepository = eventsRepository,
): Promise<string[]> => {
    const protocolVersion = 2;

    // Get latest event from the DB
    const latestEvent = await eventRepo.getLatestEvent({
        types: ['JOIN', 'EXIT'],
        chain,
        protocolVersion,
    });

    // We need to use gte, because of pagination.
    // We don't have a guarantee that we get all the events from a specific block in one request.
    const where = latestEvent ? { block_gte: String(latestEvent.blockNumber) } : {};

    // Get events
    const { joinExits } = await v2SubgraphClient.getPoolJoinExits({
        first: 1000,
        where: where,
        orderBy: JoinExit_OrderBy.Block,
        orderDirection: OrderDirection.Asc,
    });

    // Prepare DB entries
    const dbEntries = await joinExitV2Transformer(joinExits, chain);

    // Enrich with USD values
    const dbEntriesWithUsd = await joinExitsUsd(dbEntries, chain);

    // Create entries and skip duplicates
    await eventRepo.storeEvents(dbEntriesWithUsd);

    return dbEntries.map((entry) => entry.id);
};
