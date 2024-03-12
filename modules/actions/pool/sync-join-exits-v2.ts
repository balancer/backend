import { Chain, PoolEventType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import type { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { JoinExit_OrderBy, OrderDirection } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { daysAgo } from '../../common/time';
import { joinExitsUsd } from '../../sources/enrichers/join-exits-usd';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExitsV2 = async (v2SubgraphClient: BalancerSubgraphService, chain: Chain): Promise<string[]> => {
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
    const hundredDaysAgo = daysAgo(100);
    const where =
        latestEvent?.blockTimestamp && latestEvent?.blockTimestamp > hundredDaysAgo
            ? { block_gt: String(latestEvent.blockNumber) }
            : { timestamp_gte: hundredDaysAgo };

    // Get events
    const { joinExits } = await v2SubgraphClient.getPoolJoinExits({
        first: 1000,
        where: where,
        orderBy: JoinExit_OrderBy.Block,
        orderDirection: OrderDirection.Asc,
    });

    // Store only the events that are not already in the DB
    const existingEvents = await prisma.poolEvent.findMany({
        where: {
            id: { in: joinExits.map((event) => event.id) },
            type: {
                in: ['JOIN', 'EXIT'],
            },
            chain: chain,
            vaultVersion,
        },
    });

    const events = joinExits.filter((event) => !existingEvents.some((existing) => existing.id === event.id));

    // Prepare DB entries
    const dbEntries = events.map((event) => ({
        vaultVersion,
        id: event.id, // tx + logIndex
        tx: event.tx,
        type: event.type === 'Join' ? PoolEventType.JOIN : PoolEventType.EXIT,
        poolId: event.pool.id,
        chain: chain,
        userAddress: event.sender,
        blockNumber: 0, // TODO: fix fantom subgraph to include blocknumber // Number(event.block),
        blockTimestamp: Number(event.timestamp),
        logIndex: Number(event.id.substring(66)),
        valueUSD: 0,
        payload: {
            tokens: event.pool.tokensList.map((token, i) => ({
                address: token,
                amount: event.amounts[i],
                valueUSD: 0,
            })),
        },
    }));

    // Enrich with USD values
    // TODO: do we need a separate function to update prices? If so, we should be syncing events first, then running a price on them
    const dbEntriesWithUsd = await joinExitsUsd(dbEntries, chain);

    // Create entries and skip duplicates
    await prisma.poolEvent.createMany({
        data: dbEntriesWithUsd,
        skipDuplicates: true,
    });

    return dbEntries.map((entry) => entry.id);
};
