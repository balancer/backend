import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import _ from 'lodash';
import { daysAgo, roundToMidnight } from '../../common/time';
import { snapshotsV2Transformer } from '../../sources/transformers/snapshots-v2-transformer';
import { PoolSnapshotService } from './pool-snapshot-service';

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

    const prices = await prisma.prismaTokenCurrentPrice
        .findMany({
            where: {
                chain,
            },
            select: {
                tokenAddress: true,
                price: true,
            },
        })
        .then((prices) => prices.reduce((acc, p) => ({ ...acc, [p.tokenAddress]: p.price }), {}));

    // How many day ago was the last snapshot
    const daysAgo = Math.floor((Date.now() / 1000 - storedTimestamp) / 86400);

    console.log('Syncing snapshots for', chain, 'from', daysAgo, 'days ago');

    const service = new PoolSnapshotService(subgraphClient, chain, prices);
    await service.syncLatestSnapshotsForAllPools(Math.max(daysAgo, 2));

    return [];
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

    let prices: { [address: string]: number } = {};

    if (timestamp === daysAgo(0)) {
        prices = (
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
    } else {
        prices = (
            await prisma.prismaTokenPrice.findMany({
                where: {
                    chain,
                    timestamp,
                },
                select: {
                    tokenAddress: true,
                    price: true,
                },
            })
        )
            .map((p) => ({ [p.tokenAddress]: p.price })) // Assing prices to addresses
            .reduce((acc, p) => ({ ...acc, ...p }), {}); // Convert to mapped object
    }

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
                console.log('Missing snapshots for', pool.id);
                continue;
            }
            // Otherwise it's a new pool
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
