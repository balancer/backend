import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V3VaultSubgraphClient } from '../../sources/subgraphs';
import _ from 'lodash';
import { daysAgo, roundToMidnight } from '../../common/time';
import { snapshotsV3Transformer } from '../../sources/transformers/snapshots-v3-transformer';
import { OrderDirection, PoolSnapshot_OrderBy } from '../../sources/subgraphs/balancer-v3-vault/generated/types';

export async function syncSnapshotsV3(
    vaultSubgraphClient: V3VaultSubgraphClient,
    chain = 'SEPOLIA' as Chain,
): Promise<string[]> {
    // Get the latest snapshot from the DB (assuming there are no gaps)
    const storedSnapshot = await prisma.prismaPoolSnapshot.findFirst({
        select: {
            timestamp: true,
        },
        where: {
            chain,
        },
        orderBy: {
            timestamp: 'desc',
        },
    });
    const storedTimestamp = storedSnapshot?.timestamp || 0;

    // In case there are no snapshots stored in the DB, sync from the subgraph's earliest snapshot
    let subgraphTimestamp = 0;
    if (!storedTimestamp) {
        const { poolSnapshots } = await vaultSubgraphClient.PoolSnapshots({
            first: 1,
            orderBy: PoolSnapshot_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        subgraphTimestamp = poolSnapshots[0].timestamp;
    }

    // Adding a day to the last stored snapshot timestamp,
    // because we want to sync the next day from what we have in the DB
    const timestamp = (storedTimestamp && storedTimestamp + 86400) || subgraphTimestamp;

    return syncSnapshotsForADayV3(vaultSubgraphClient, chain, timestamp);
}

/**
 * Sync snapshot balances to the database.
 *
 * @param vaultSubgraphClient
 * @param chain
 * @returns
 */
export async function syncSnapshotsForADayV3(
    vaultSubgraphClient: V3VaultSubgraphClient,
    chain = 'SEPOLIA' as Chain,
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
        },
    });

    // Get snapshots for the next day
    const nextSnapshots = await vaultSubgraphClient.getSnapshotsForTimestamp(next);

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
            vaultVersion: 3,
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

    const allTokens = await prisma.prismaToken.findMany({ where: { chain } });

    for (const pool of dbPools) {
        const poolTokens = pool.tokens.map((t, idx) => pool.tokens.find(({ index }) => index === idx)?.address ?? '');
        const previousSnapshot = previousSnapshots.find((s) => s.poolId === pool.id);
        const snapshot = nextSnapshots.find((s) => s.pool.id === pool.id);

        const dbEntry = await snapshotsV3Transformer(
            pool.id,
            poolTokens,
            next,
            chain,
            allTokens,
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
