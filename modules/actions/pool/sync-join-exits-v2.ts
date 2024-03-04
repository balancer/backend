import { Chain, PoolEventType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { formatUnits } from 'viem';
import type { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { JoinExit_OrderBy, OrderDirection } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

/**
 * Time helper to round timestamp to the nearest hour
 */
const roundToHour = (timestamp: number) => Math.floor(timestamp / 3600) * 3600;

const isFulfilled = <T>(input: PromiseSettledResult<T>): input is PromiseFulfilledResult<T> =>
    input.status === 'fulfilled';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExitsV2 = async (v2SubgraphClient: BalancerSubgraphService, chain: Chain) => {
    const vaultVersion = 2;

    // Get latest event from the DB
    const latestEvent = await prisma.poolEvent.findFirst({
        where: {
            chain: chain,
            vaultVersion,
        },
        orderBy: {
            blockTimestamp: 'desc',
        },
    });

    // Get events
    const { joinExits } = await v2SubgraphClient.getPoolJoinExits({
        first: 1000,
        where: {
            timestamp_gte: Number(latestEvent?.blockTimestamp || 0),
        },
        orderBy: JoinExit_OrderBy.Timestamp,
        orderDirection: OrderDirection.Desc,
    });

    // Store only the events that are not already in the DB
    const existingEvents = await prisma.poolEvent.findMany({
        where: {
            id: { in: joinExits.map((event) => event.id) },
            chain: chain,
            vaultVersion,
        },
    });

    const events = joinExits.filter((event) => !existingEvents.some((existing) => existing.id === event.id));

    // Prepare DB entries
    const dbEntries = (
        await Promise.allSettled(
            events.map(async (event) => {
                // TODO: Calculate USD amounts with token prices at the time of the event
                // 🚨 Reading from the DB in a loop – will get slow with a large events volume
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
                        amountUsd:
                            Number(formatUnits(BigInt(event.amounts[index]), price?.token?.decimals ?? 18)) *
                            (price?.price || 0), // TODO: check USD amount
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
                    logPosition: Number(event.id.substring(66)),
                    amountUsd: usd.reduce((acc, token) => acc + Number(token.amountUsd), 0),
                    payload: {
                        tokens: usd,
                    },
                };
            }),
        )
    )
        .filter(isFulfilled)
        .map((result) => result.value);

    // Create entries and skip duplicates
    await prisma.poolEvent.createMany({
        data: dbEntries,
        skipDuplicates: true,
    });

    // TODO: do we need a separate function to update prices? If so, we should be syncing events first, then running a price on them

    return 'ok';
};
