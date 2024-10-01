import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { V3VaultSubgraphClient } from '../../../sources/subgraphs';
import { AddRemove_OrderBy, OrderDirection } from '../../../sources/subgraphs/balancer-v3-vault/generated/types';
import { joinExitsUsd } from '../../../sources/enrichers/join-exits-usd';
import { daysAgo } from '../../../common/time';
import { joinExitV3Transformer } from '../../../sources/transformers/join-exit-v3-transformer';

export const JOIN_EXIT_HISTORY_DAYS = 90;

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExits = async (
    vaultSubgraphClient: V3VaultSubgraphClient,
    chain: Chain,
    daysToSync = JOIN_EXIT_HISTORY_DAYS,
): Promise<string[]> => {
    const protocolVersion = 3;

    // Get latest event from the DB
    const latestEvent = await prisma.prismaPoolEvent.findFirst({
        where: {
            type: {
                in: ['JOIN', 'EXIT'],
            },
            chain: chain,
            protocolVersion,
        },
        orderBy: {
            blockTimestamp: 'desc',
        },
    });

    const syncSince = daysAgo(daysToSync);
    const where =
        latestEvent?.blockTimestamp && latestEvent?.blockTimestamp > syncSince
            ? { blockNumber_gt: String(latestEvent.blockNumber || 0) }
            : { blockTimestamp_gte: String(syncSince) };

    // Get events
    const { addRemoves } = await vaultSubgraphClient.AddRemove({
        first: 1000,
        where,
        orderBy: AddRemove_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    // Prepare DB entries
    const dbEntries = await joinExitV3Transformer(addRemoves, chain);

    console.log(`Syncing ${dbEntries.length} join/exit events`);

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

    return dbEntries.map((entry) => entry.id);
};
