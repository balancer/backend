import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import type { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { JoinExit_OrderBy, OrderDirection } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { daysAgo } from '../../common/time';
import { joinExitsUsd } from '../../sources/enrichers/join-exits-usd';
import { JOIN_EXIT_HISTORY_DAYS } from './sync-join-exits';
import { joinExitV2Transformer } from '../../sources/transformers/join-exit-v2-transformer';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExitsV2 = async (
    v2SubgraphClient: BalancerSubgraphService,
    chain: Chain,
    daysToSync = JOIN_EXIT_HISTORY_DAYS,
): Promise<string[]> => {
    const vaultVersion = 2;

    // Get latest event from the DB
    const latestEvent = await prisma.poolEvent.findFirst({
        where: {
            type: {
                in: ['JOIN', 'EXIT'],
            },
            chain: chain,
            vaultVersion,
        },
        orderBy: {
            blockNumber: 'desc',
        },
    });

    // Get events since the latest event or 100 days (it will be around 15k events on mainnet)
    const syncSince = daysAgo(daysToSync);
    const where =
        latestEvent?.blockTimestamp && latestEvent?.blockTimestamp > syncSince
            ? { block_gt: String(latestEvent.blockNumber) }
            : { timestamp_gte: syncSince };

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
    await prisma.poolEvent.createMany({
        data: dbEntriesWithUsd,
        skipDuplicates: true,
    });

    return dbEntries.map((entry) => entry.id);
};
