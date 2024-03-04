import { Chain, PoolEventType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V3VaultSubgraphClient } from '../../sources/subgraphs';
import { formatUnits } from 'viem';
import { JoinExit_OrderBy, OrderDirection } from '../../sources/subgraphs/balancer-v3-vault/generated/types';

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
export const syncJoinExits = async (vaultSubgraphClient: V3VaultSubgraphClient, chain: Chain) => {
    const vaultVersion = 3;
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
    const { joinExits } = await vaultSubgraphClient.JoinExits({
        first: 1000,
        where: {
            blockTimestamp_gte: String(latestEvent?.blockTimestamp || 0),
        },
        orderBy: JoinExit_OrderBy.BlockTimestamp,
        orderDirection: OrderDirection.Asc,
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
                        tokenAddress: { in: event.pool.tokens.map((token) => token.address) },
                        timestamp: roundToHour(Number(event.blockTimestamp)), // 🚨 Assuming all prices are available hourly
                        chain: chain,
                    },
                    include: {
                        token: true,
                    },
                });

                const usd = event.pool.tokens.map((token) => {
                    const price = prices.find((price) => price.tokenAddress === token.address);
                    return {
                        address: token.address,
                        amount: event.amounts[token.index],
                        amountUsd:
                            Number(formatUnits(BigInt(event.amounts[token.index]), price?.token?.decimals ?? 18)) *
                            (price?.price || 0), // TODO: check USD amount
                    };
                });

                return {
                    id: event.id, // tx + logIndex
                    tx: event.transactionHash,
                    type: event.type === 'Join' ? PoolEventType.JOIN : PoolEventType.EXIT,
                    poolId: event.pool.id,
                    chain: chain,
                    vaultVersion,
                    userAddress: event.user.id,
                    blockNumber: Number(event.blockNumber),
                    blockTimestamp: Number(event.blockTimestamp),
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
