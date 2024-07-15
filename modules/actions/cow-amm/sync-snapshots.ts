import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';
import { OrderDirection, PoolSnapshot_OrderBy } from '../../sources/subgraphs/cow-amm/generated/types';
import _ from 'lodash';
import { daysAgo, roundToMidnight } from '../../common/time';
import { snapshotsCowAmmTransformer } from '../../sources/transformers/snapshots-cowamm-transformer';

const protocolVersion = 1;

export async function syncSnapshots(subgraphClient: CowAmmSubgraphClient, chain: Chain): Promise<string[]> {
    // Get the latest snapshot from the DB (assuming there are no gaps)
    const latestStoredSnapshot = await prisma.prismaPoolSnapshot.findFirst({
        select: {
            timestamp: true,
        },
        where: {
            chain,
            protocolVersion,
        },
        orderBy: {
            timestamp: 'desc',
        },
    });

    let timestamp;
    if (latestStoredSnapshot && latestStoredSnapshot.timestamp < daysAgo(1)) {
        timestamp = latestStoredSnapshot.timestamp + 86400; // Try to get the next day
    } else if (latestStoredSnapshot && latestStoredSnapshot.timestamp > daysAgo(1)) {
        console.log('No new snapshots to sync for', chain);
        return [];
    } else {
        // Get the earliest snapshot from the subgraph
        const { poolSnapshots } = await subgraphClient.Snapshots({
            first: 1,
            orderBy: PoolSnapshot_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        timestamp = poolSnapshots[0].timestamp;
    }

    console.log('Syncing COW snapshots for', chain, timestamp);

    return syncSnapshotsForADayCowAmm(subgraphClient, chain, timestamp);
}

/**
 * Sync snapshot balances to the database.
 *
 * @param subgraphClient
 * @param chain
 * @returns
 */
export async function syncSnapshotsForADayCowAmm(
    subgraphClient: CowAmmSubgraphClient,
    chain = 'SEPOLIA' as Chain,
    timestamp = daysAgo(0), // Current day by default
): Promise<string[]> {
    const previous = roundToMidnight(timestamp - 86400); // Previous day stored in the DB
    const next = roundToMidnight(timestamp); // Day to fetch snapshots for

    // Check for previous snapshots
    const previousSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: {
            chain: chain,
            timestamp: previous,
            protocolVersion,
        },
    });

    // Get snapshots for the next day
    const nextSnapshots = await subgraphClient.getSnapshotsForTimestamp(next);

    // Get all pool IDs we are interested in
    const dbPools = await prisma.prismaPool.findMany({
        select: {
            id: true,
            dynamicData: {
                select: {
                    swapFee: true,
                },
            },
            tokens: {
                select: {
                    address: true,
                    index: true,
                },
            },
        },
        where: {
            protocolVersion,
            chain: chain,
        },
    });

    const prices = (
        await prisma.prismaTokenCurrentPrice.findMany({
            where: {
                chain,
            },
            select: {
                tokenAddress: true,
                price: true,
            },
        })
    )
        .map((p) => ({ [p.tokenAddress]: p.price })) // Assing prices to addresses
        .reduce((acc, p) => ({ ...acc, ...p }), {}); // Convert to mapped object

    for (const pool of dbPools) {
        const poolTokens = pool.tokens.map((t, idx) => pool.tokens.find(({ index }) => index === idx)?.address ?? '');
        const previousSnapshot = previousSnapshots.find((s) => s.poolId === pool.id);
        const snapshot = nextSnapshots.find((s) => s.pool.id === pool.id);

        const dbEntry = snapshotsCowAmmTransformer(
            pool.id,
            poolTokens,
            next,
            chain,
            prices,
            previousSnapshot,
            snapshot,
        );

        await prisma.prismaPoolSnapshot.upsert({
            where: {
                id_chain: {
                    id: dbEntry.id,
                    chain,
                },
            },
            create: dbEntry,
            update: dbEntry,
        });
    }

    return dbPools.map((p) => p.id);
}
