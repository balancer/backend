import { Chain, PoolEventType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import type { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { JoinExit_OrderBy, OrderDirection } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

/**
 * Time helper to round timestamp to the nearest hour
 */
const roundToHour = (timestamp: number) => Math.floor(timestamp / 3600) * 3600;

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
    const hundredDaysAgo = Math.floor(+new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) / 1000);
    const where =
        latestEvent?.blockTimestamp && latestEvent?.blockTimestamp > hundredDaysAgo
            ? { block_gte: String(latestEvent.blockNumber) }
            : { timestamp_gte: hundredDaysAgo };

    // Get events
    const { joinExits } = await v2SubgraphClient.getPoolJoinExits({
        first: 1000,
        where: where,
        orderBy: JoinExit_OrderBy.Timestamp,
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
    const dbEntries = await Promise.all(
        events.map(async (event) => {
            // TODO: Calculate USD amounts with token prices at the time of the event
            // 🚨 Reading from the DB in a loop – will get slow with a large events volume
            // But we need prices based on the event timestamp, so batching this should be based on timestamp ranges
            const prices = await prisma.prismaTokenPrice.findMany({
                where: {
                    tokenAddress: { in: event.pool.tokensList },
                    timestamp: roundToHour(Number(event.timestamp)), // 🚨 Assuming all prices are available hourly
                    chain: chain,
                },
                include: {
                    token: true,
                },
            });

            const usd = event.pool.tokensList.map((address, index) => {
                const price = prices.find((price) => price.tokenAddress === address);
                return {
                    address: address,
                    amount: event.amounts[index],
                    valueUSD: Number(event.amounts[index]) * (price?.price || 0), // TODO: check USD amount
                };
            });

            return {
                id: event.id, // tx + logIndex
                tx: event.tx,
                type: event.type === 'Join' ? PoolEventType.JOIN : PoolEventType.EXIT,
                poolId: event.pool.id,
                chain: chain,
                userAddress: event.sender,
                blockNumber: Number(event.block),
                blockTimestamp: Number(event.timestamp),
                logIndex: Number(event.id.substring(66)),
                valueUSD: usd.reduce((acc, token) => acc + Number(token.valueUSD), 0),
                payload: {
                    tokens: usd,
                },
            };
        }),
    ).catch((e) => {
        console.error('Error preparing DB entries', e);
        return [];
    });

    // Create entries and skip duplicates
    await prisma.poolEvent.createMany({
        data: dbEntries,
        skipDuplicates: true,
    });

    // TODO: do we need a separate function to update prices? If so, we should be syncing events first, then running a price on them

    return dbEntries.map((entry) => entry.id);
};
