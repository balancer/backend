import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { V2SubgraphClient } from '../../../subgraphs/balancer-subgraph';
import _ from 'lodash';
import { swapV2Transformer } from '../../../sources/transformers/swap-v2-transformer';
import { OrderDirection, Swap_OrderBy } from '../../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { swapsUsd } from '../../../sources/enrichers/swaps-usd';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param subgraphClient
 * @param chain
 * @returns
 */
export async function syncSwaps(subgraphClient: V2SubgraphClient, chain: Chain): Promise<string[]> {
    const protocolVersion = 2;

    // Get latest event from the DB
    const latestEvent = await prisma.prismaPoolEvent.findFirst({
        select: {
            blockNumber: true,
            blockTimestamp: true,
        },
        where: {
            type: 'SWAP',
            chain: chain,
            protocolVersion,
        },
        orderBy: {
            blockTimestamp: 'desc',
        },
    });

    // Get list of FX pool addresses for the fee calculation
    const fxPools = (await prisma.prismaPool.findMany({
        where: {
            chain: chain,
            type: 'FX',
        },
        select: {
            id: true,
            typeData: true, // contains the quote token address
        },
    })) as { id: string; typeData: { quoteToken: string } }[];

    // Querying by timestamp of Fantom, because it has events without a block number in the DB
    const where = latestEvent
        ? chain === Chain.FANTOM
            ? { timestamp_gte: Number(latestEvent.blockTimestamp) }
            : { block_gte: String(latestEvent.blockNumber) }
        : {};

    // Get events
    console.time('BalancerSwaps');
    const { swaps } = await subgraphClient.BalancerSwaps({
        first: 1000,
        where: where,
        orderBy: chain === Chain.FANTOM ? Swap_OrderBy.Timestamp : Swap_OrderBy.Block,
        orderDirection: OrderDirection.Asc,
    });
    console.timeEnd('BalancerSwaps');

    console.time('swapV2Transformer');
    const dbSwaps = swaps.map((swap) => swapV2Transformer(swap, chain, fxPools));
    console.timeEnd('swapV2Transformer');

    // TODO: parse batchSwaps, if needed

    // Enrich with USD values
    console.time('swapsUsd');
    const dbEntries = await swapsUsd(dbSwaps, chain);
    console.timeEnd('swapsUsd');

    console.time('prismaPoolEvent.createMany');
    await prisma.prismaPoolEvent.createMany({
        skipDuplicates: true,
        data: dbEntries,
    });
    console.timeEnd('prismaPoolEvent.createMany');

    return [...new Set(dbEntries.map((entry) => entry.poolId))];
}
