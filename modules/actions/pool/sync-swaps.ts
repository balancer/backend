import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V3VaultSubgraphClient } from '../../sources/subgraphs';
import _ from 'lodash';
import { swapTransformer } from '../../sources/transformers/swap-transformer';
import { OrderDirection, Swap_OrderBy } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { swapsUsd } from '../../sources/enrichers/swaps-usd';
import { daysAgo } from '../../common/time';

export const SWAPS_HISTORY_DAYS = 90;

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
    daysToSync = SWAPS_HISTORY_DAYS,
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
    const syncSince = daysAgo(daysToSync);
    const where =
        latestEvent?.blockTimestamp && latestEvent?.blockTimestamp > syncSince
            ? { blockNumber_gt: String(latestEvent.blockNumber) }
            : { blockTimestamp_gte: String(syncSince) };

    // Get events
    const { swaps } = await vaultSubgraphClient.Swaps({
        first: 1000,
        where,
        orderBy: Swap_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    const dbSwaps = swaps.map((swap) => swapTransformer(swap, chain));

    // TODO: parse batchSwaps, if needed

    // Enrich with USD values
    const dbEntries = await swapsUsd(dbSwaps, chain);

    await prisma.poolEvent.createMany({
        skipDuplicates: true,
        data: dbEntries,
    });

    return dbEntries.map((entry) => entry.id);
}
