import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import {
    OrderDirection,
    PoolSnapshot_OrderBy,
} from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import _ from 'lodash';
import { daysAgo, roundToMidnight } from '../../common/time';
import { snapshotsV2Transformer } from '../../sources/transformers/snapshots-v2-transformer';

const protocolVersion = 2;

export async function syncSnapshotsV2(subgraphClient: V2SubgraphClient, chain: Chain): Promise<string[]> {
    // Get the latest snapshot from the DB (assuming there are no gaps)
    const storedSnapshot = await prisma.prismaPoolSnapshot.findFirst({
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
    const storedTimestamp = storedSnapshot?.timestamp || 0;

    // In case there are no snapshots stored in the DB, sync from the subgraph's earliest snapshot
    let subgraphTimestamp = 0;
    if (!storedTimestamp) {
        const { poolSnapshots } = await subgraphClient.BalancerPoolSnapshots({
            first: 1,
            orderBy: PoolSnapshot_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        subgraphTimestamp = poolSnapshots[0].timestamp;
    }

    // Adding a day to the last stored snapshot timestamp,
    // because we want to sync the next day from what we have in the DB
    const timestamp = (storedTimestamp && storedTimestamp + 86400) || subgraphTimestamp;

    console.log('Syncing V2 snapshots for', chain, timestamp);

    return syncSnapshotsForADayV2(subgraphClient, chain, timestamp);
}

/**
 * Sync snapshot balances to the database.
 *
 * @param V2SubgraphClient
 * @param chain
 * @returns
 */
export async function syncSnapshotsForADayV2(
    subgraphClient: V2SubgraphClient,
    chain: Chain,
    timestamp = daysAgo(0), // Current day by default
): Promise<string[]> {
    const previous = roundToMidnight(timestamp - 86400); // Previous day stored in the DB
    const next = roundToMidnight(timestamp); // Day to fetch snapshots for

    // TODO: do we want to have a bucket for the current day?
    // const current = roundToNextMidnight(previous);

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
            tokens: {
                select: {
                    address: true,
                    index: true,
                },
            },
        },
        where: {
            protocolVersion,
            chain,
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
        let previousSnapshot = previousSnapshots.find((s) => s.poolId === pool.id);
        const snapshot = nextSnapshots.find((s) => s.pool.id === pool.id);

        // Handle case when there is already a gap in the snapshots
        if (!previousSnapshot) {
            // Check if the gap is more than one day
            previousSnapshot =
                (await prisma.prismaPoolSnapshot.findFirst({
                    where: {
                        chain,
                        poolId: pool.id,
                        timestamp: {
                            lt: previous,
                        },
                        protocolVersion,
                    },
                    orderBy: {
                        timestamp: 'desc',
                    },
                })) || undefined;

            if (previousSnapshot && previousSnapshot?.timestamp < previous - 86400) {
                // Needs to be filled in
                // Schedule a job to fill in the missing snapshots
                continue;
            }
        }

        const dbEntry = snapshotsV2Transformer(pool.id, poolTokens, next, chain, prices, previousSnapshot, snapshot);

        if (!dbEntry) {
            continue;
        }

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
