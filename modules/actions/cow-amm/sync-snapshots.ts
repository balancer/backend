import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';
import { OrderDirection, PoolSnapshot_OrderBy } from '../../sources/subgraphs/cow-amm/generated/types';
import _ from 'lodash';
import { daysAgo, roundToMidnight } from '../../common/time';
import { snapshotsCowAmmTransformer } from '../../sources/transformers/snapshots-cowamm-transformer';
import moment from 'moment';

export async function syncSnapshots(subgraphClient: CowAmmSubgraphClient, chain: Chain): Promise<number> {
    // Get the latest snapshot from the DB (assuming there are no gaps)
    // Get the last synced timestamp from the PrismaLastBlockSynced table
    const lastSyncedTimestamp = await prisma.prismaLastBlockSynced
        .findFirst({
            where: {
                category: PrismaLastBlockSyncedCategory.COW_AMM_SNAPSHOTS,
                chain,
            },
        })
        .then((res) => res?.blockNumber);

    const today = moment().utc().startOf('day').unix();
    const yesterday = moment().utc().startOf('day').subtract(1, 'days').unix();

    let nextTimestamp = 0;
    if (lastSyncedTimestamp && lastSyncedTimestamp <= yesterday) {
        // sync only the following one if we are still behind
        console.log('Catching up: Syncing COW snapshots for', chain, lastSyncedTimestamp + 86400);
        nextTimestamp = await syncSnapshotsForADayCowAmm(subgraphClient, chain, lastSyncedTimestamp + 86400);
    } else if (lastSyncedTimestamp && lastSyncedTimestamp === today) {
        // sync the previous day and the current day if we are up to date
        console.log('Syncing COW snapshots for', chain, lastSyncedTimestamp - 86400);
        await syncSnapshotsForADayCowAmm(subgraphClient, chain, lastSyncedTimestamp - 86400);

        console.log('Syncing COW snapshots for', chain, lastSyncedTimestamp);
        nextTimestamp = await syncSnapshotsForADayCowAmm(subgraphClient, chain, lastSyncedTimestamp);
    } else {
        // Get the earliest snapshot from the subgraph if there are none stored
        const { poolSnapshots } = await subgraphClient.Snapshots({
            first: 1,
            orderBy: PoolSnapshot_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc,
        });

        nextTimestamp = await syncSnapshotsForADayCowAmm(subgraphClient, chain, poolSnapshots[0].timestamp);
    }

    // Update the last synced timestamp in the PrismaLastBlockSynced table
    await prisma.prismaLastBlockSynced.upsert({
        where: {
            category_chain: {
                category: PrismaLastBlockSyncedCategory.COW_AMM_SNAPSHOTS,
                chain,
            },
        },
        update: {
            blockNumber: nextTimestamp,
        },
        create: {
            category: PrismaLastBlockSyncedCategory.COW_AMM_SNAPSHOTS,
            blockNumber: nextTimestamp,
            chain,
        },
    });

    return nextTimestamp;
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
    chain: Chain,
    timestamp: number,
): Promise<number> {
    const previous = roundToMidnight(timestamp - 86400); // Previous day stored in the DB
    const next = roundToMidnight(timestamp); // Day to fetch snapshots for

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
            type: 'COW_AMM',
            chain: chain,
        },
    });

    // Check for previous snapshots
    const previousSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: {
            chain: chain,
            timestamp: previous,
            poolId: {
                in: dbPools.map((p) => p.id),
            },
        },
    });

    // Get snapshots for the next day
    const nextSnapshots = await subgraphClient.getSnapshotsForTimestamp(next);

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

    return next;
}
