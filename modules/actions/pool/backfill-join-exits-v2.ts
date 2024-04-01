import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import type { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { JoinExit_OrderBy, OrderDirection } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { joinExitsUsd } from '../../sources/enrichers/join-exits-usd';
import { joinExitV2Transformer } from '../../sources/transformers/join-exit-v2-transformer';

/**
 * We have some data in the DB already and want to fill the data previous to the earliest event in the DB.
 * This is meant as a one-time action to fill the data.
 *
 * @param vaultSubgraphClient
 */
export const backfillJoinExitsV2 = async (
    v2SubgraphClient: BalancerSubgraphService,
    chain: Chain,
): Promise<string[]> => {
    const vaultVersion = 2;

    // Get latest event from the DB
    const earliestEvent = await prisma.prismaPoolEvent.findFirst({
        where: {
            type: {
                in: ['JOIN', 'EXIT'],
            },
            chain: chain,
            vaultVersion,
        },
        orderBy: {
            blockNumber: 'asc',
        },
    });

    // We need to use gte, because of pagination.
    // We don't have a guarantee that we get all the events from a specific block in one request.
    const now = Math.floor(Date.now() / 1000);
    const where =
        chain === Chain.FANTOM
            ? earliestEvent?.blockTimestamp
                ? { timestamp_lte: earliestEvent?.blockTimestamp }
                : { timestamp_lte: now }
            : earliestEvent?.blockTimestamp
            ? { block_lte: String(earliestEvent.blockNumber) }
            : { timestamp_lte: now };

    // Get events
    const getterFn =
        chain === Chain.FANTOM
            ? v2SubgraphClient.getFantomPoolJoinExits.bind(v2SubgraphClient)
            : v2SubgraphClient.getPoolJoinExits.bind(v2SubgraphClient);

    const { joinExits } = await getterFn({
        first: 1000,
        where: where,
        orderBy: chain === Chain.FANTOM ? JoinExit_OrderBy.Timestamp : JoinExit_OrderBy.Block,
        orderDirection: OrderDirection.Desc,
    });

    // Prepare DB entries
    const dbEntries = await joinExitV2Transformer(joinExits, chain);

    // Enrich with USD values
    const dbEntriesWithUsd = await joinExitsUsd(dbEntries, chain);

    // Create entries and skip duplicates
    await prisma.prismaPoolEvent.createMany({
        data: dbEntriesWithUsd,
        skipDuplicates: true,
    });

    return dbEntries.map((entry) => entry.id);
};
