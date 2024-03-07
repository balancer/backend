import { Chain, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V3VaultSubgraphClient } from '../../sources/subgraphs';
import _ from 'lodash';
import { swapTransformer } from '../../sources/transformers/swap-transformer';
import { OrderDirection, Swap_OrderBy } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { swapsUsd } from '../../sources/enrichers/swaps-usd';
import { daysAgo } from '../../common/time';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param vaultSubgraphClient
 * @param chain
 * @param daysToSync
 * @returns
 */
export async function syncSwaps(
    vaultSubgraphClient: V3VaultSubgraphClient,
    chain = 'SEPOLIA' as Chain,
    daysToSync = 30,
): Promise<string[]> {
    const vaultVersion = 3;

    // Get latest event from the DB
    const latestEvent = await prisma.poolEvent.findFirst({
        where: {
            type: 'SWAP',
            chain: chain,
            vaultVersion,
        },
        orderBy: {
            blockNumber: 'desc',
        },
    });

    // Get events since the latest event or limit to number or days we want to keep them in the DB
    const since = daysAgo(daysToSync);
    const where =
        latestEvent?.blockTimestamp && latestEvent?.blockTimestamp > since
            ? { blockNumber_gte: String(latestEvent.blockNumber) }
            : { blockTimestamp_gte: String(since) };

    // Get events
    const { swaps } = await vaultSubgraphClient.Swaps({
        first: 1000,
        where,
        orderBy: Swap_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    // Store only the events that are not already in the DB
    const existingEvents = await prisma.poolEvent.findMany({
        where: {
            id: { in: swaps.map((event) => event.id) },
            type: 'SWAP',
            chain: chain,
            vaultVersion,
        },
    });

    const newSwaps = swaps.filter((event) => !existingEvents.some((existing) => existing.id === event.id));

    const dbSwaps = newSwaps.map((swap) => swapTransformer(swap, chain));

    // Enrich with USD values
    const dbEntries = await swapsUsd(dbSwaps, chain);

    await prisma.poolEvent.createMany({
        skipDuplicates: true,
        data: dbEntries,
    });

    return dbEntries.map((entry) => entry.id);
}
