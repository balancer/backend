import { Chain, PoolEventType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V3VaultSubgraphClient } from '../../sources/subgraphs';
import { JoinExit_OrderBy, OrderDirection } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { joinExitsUsd } from '../../sources/enrichers/join-exits-usd';
import { formatUnits } from 'viem';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExits = async (vaultSubgraphClient: V3VaultSubgraphClient, chain: Chain): Promise<string[]> => {
    const vaultVersion = 3;

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

    // Get events
    const { joinExits } = await vaultSubgraphClient.JoinExits({
        first: 1000,
        where: {
            blockNumber_gt: String(latestEvent?.blockNumber || 0),
        },
        orderBy: JoinExit_OrderBy.BlockNumber,
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
    // V3 vault join/exit amounts are in wei
    const allTokens = await prisma.prismaToken.findMany({ where: { chain } });
    const dbEntries = events.map((event) => ({
        vaultVersion,
        id: event.id, // tx + logIndex
        tx: event.transactionHash,
        type: event.type === 'Join' ? PoolEventType.JOIN : PoolEventType.EXIT,
        poolId: event.pool.id,
        chain: chain,
        userAddress: event.user.id,
        blockNumber: Number(event.blockNumber),
        blockTimestamp: Number(event.blockTimestamp),
        logIndex: Number(event.logIndex),
        valueUSD: 0,
        payload: {
            tokens: event.pool.tokens.map((token) => ({
                address: token.address,
                amount: formatUnits(
                    BigInt(event.amounts[token.index]),
                    allTokens.find((t) => t.address === token.address)?.decimals || 18,
                ),
                valueUSD: 0,
            })),
        },
    }));

    console.log(`Syncing ${dbEntries.length} join/exit events`);

    // Enrich with USD values
    // TODO: do we need a separate function to update prices? If so, we should be syncing events first, then running a price on them
    const dbEntriesWithUsd = await joinExitsUsd(dbEntries, chain);

    // Create entries and skip duplicates
    await prisma.poolEvent
        .createMany({
            data: dbEntriesWithUsd,
            skipDuplicates: true,
        })
        .catch((e) => {
            console.error('Error creating DB entries', e);
        });

    return dbEntries.map((entry) => entry.id);
};
