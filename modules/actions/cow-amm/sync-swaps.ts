import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';
import _ from 'lodash';
import { OrderDirection, Swap_OrderBy } from '../../sources/subgraphs/cow-amm/generated/types';
import { swapsUsd } from '../../sources/enrichers/swaps-usd';
import { swapCowAmmTransformer } from '../../sources/transformers/swap-cowamm-transformer';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param subgraphClient
 * @param chain
 * @returns
 */
export async function syncSwaps(subgraphClient: CowAmmSubgraphClient, chain = 'SEPOLIA' as Chain) {
    const protocolVersion = 1;

    // Get latest event from the DB
    const latestEvent = await prisma.prismaPoolEvent.findFirst({
        select: {
            blockNumber: true,
        },
        where: {
            type: 'SWAP',
            chain: chain,
            protocolVersion,
        },
        orderBy: {
            blockTimestamp: 'desc',
            blockNumber: 'desc',
        },
    });

    const where = latestEvent?.blockNumber ? { blockNumber_gte: String(latestEvent.blockNumber) } : {};

    // Get events
    const { swaps } = await subgraphClient.Swaps({
        first: 1000,
        where,
        orderBy: Swap_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    // Adding swap fee to the swap object
    const dbSwaps = swaps.map((swap) => swapCowAmmTransformer(swap, chain));

    // Enrich with USD values
    const dbEntries = await swapsUsd(dbSwaps, chain);

    await prisma.prismaPoolEvent.createMany({
        skipDuplicates: true,
        data: dbEntries,
    });

    return dbEntries;
}
