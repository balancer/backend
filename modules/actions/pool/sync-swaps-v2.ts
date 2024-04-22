import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { V2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import _ from 'lodash';
import { swapV2Transformer } from '../../sources/transformers/swap-v2-transformer';
import { OrderDirection, Swap_OrderBy } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { swapsUsd } from '../../sources/enrichers/swaps-usd';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param subgraphClient
 * @param chain
 * @returns
 */
export async function syncSwapsV2(subgraphClient: V2SubgraphClient, chain = 'SEPOLIA' as Chain): Promise<string[]> {
    const vaultVersion = 2;

    // Get latest event from the DB
    const latestEvent = await prisma.prismaPoolEvent.findFirst({
        where: {
            type: 'SWAP',
            chain: chain,
            vaultVersion,
        },
        orderBy: {
            blockNumber: 'desc',
        },
    });

    const where = latestEvent ? { block_gte: String(latestEvent.blockNumber) } : {};

    // Get events
    console.time('BalancerSwaps');
    const { swaps } = await subgraphClient.BalancerSwaps({
        first: 1000,
        where,
        orderBy: chain === Chain.FANTOM ? Swap_OrderBy.Timestamp : Swap_OrderBy.Block,
        orderDirection: OrderDirection.Asc,
    });
    console.timeEnd('BalancerSwaps');

    console.time('swapV2Transformer');
    const dbSwaps = swaps.map((swap) => swapV2Transformer(swap, chain));
    console.timeEnd('swapV2Transformer');

    // TODO: parse batchSwaps, if needed

    // Enrich with USD values – no need - take V2 swap usd values from the subgraph
    const dbEntries = dbSwaps;
    // console.time('swapsUsd');
    // const dbEntries = await swapsUsd(dbSwaps, chain);
    // console.timeEnd('swapsUsd');

    console.time('prismaPoolEvent.createMany');
    await prisma.prismaPoolEvent.createMany({
        skipDuplicates: true,
        data: dbEntries,
    });
    console.timeEnd('prismaPoolEvent.createMany');

    return dbEntries.map((entry) => entry.id);
}
