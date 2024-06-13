import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';
import { OrderDirection, PoolSnapshot_OrderBy } from '../../sources/subgraphs/cow-amm/generated/types';
import _ from 'lodash';
import { daysAgo, roundToMidnight } from '../../common/time';
import { snapshotsV2Transformer } from '../../sources/transformers/snapshots-v2-transformer';
import { snapshotsV3Transformer } from '../../sources/transformers/snapshots-v3-transformer';
import { raw } from '@prisma/client/runtime';

const vaultVersion = 0;

export async function syncSnapshots(subgraphClient: CowAmmSubgraphClient, chain: Chain): Promise<string[]> {
    // Get the latest snapshot from the DB (assuming there are no gaps)
    const storedSnapshot = await prisma.prismaPoolSnapshot.findFirst({
        select: {
            timestamp: true,
        },
        where: {
            chain,
            vaultVersion,
        },
        orderBy: {
            timestamp: 'desc',
        },
    });
    const storedTimestamp = storedSnapshot?.timestamp || 0;

    // In case there are no snapshots stored in the DB, sync from the subgraph's earliest snapshot
    let subgraphTimestamp = 0;
    if (!storedTimestamp) {
        const { poolSnapshots } = await subgraphClient.Snapshots({
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

    // TODO: do we want to have a bucket for the current day?
    // const current = roundToNextMidnight(previous);

    // Check for previous snapshots
    const previousSnapshots = await prisma.prismaPoolSnapshot.findMany({
        where: {
            chain: chain,
            timestamp: previous,
            vaultVersion,
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
        const rawSnapshot = nextSnapshots.find((s) => s.pool.id === pool.id);

        if (!rawSnapshot) {
            console.log('No next day snapshot found for pool', pool.id);
            continue;
        }

        // TODO: polyfill missing data, remove one by one once available in SG
        const snapshot = {
            ...rawSnapshot!,
            pool: {
                ...rawSnapshot.pool,
                swapFee: pool.dynamicData!.swapFee,
                tokens: rawSnapshot.pool.tokens.map((t) => {
                    const index = poolTokens.findIndex((pt) => pt === t.address);
                    return {
                        ...t,
                        index,
                    };
                }),
            },
            totalVolumes: [],
            totalProtocolSwapFees: [],
            totalProtocolYieldFees: [],
        };

        const dbEntry = snapshotsV3Transformer(
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
