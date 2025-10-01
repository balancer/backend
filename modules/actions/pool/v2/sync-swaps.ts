import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { V2SubgraphClient } from '../../../subgraphs/balancer-subgraph';
import _ from 'lodash';
import { swapV2Transformer } from '../../../sources/transformers/swap-v2-transformer';
import { swapsUsd } from '../../../sources/enrichers/swaps-usd';
import { eventsRepository, LatestEventRepository, EventStoreRepository } from '../../../repositories/events';
import { getLastSyncedBlock, upsertLastSyncedBlock } from '../../last-synced-block';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param subgraphClient
 * @param chain
 * @returns
 */
export async function syncSwaps(
    subgraphClient: V2SubgraphClient,
    chain: Chain,
    eventRepo: LatestEventRepository & EventStoreRepository = eventsRepository,
): Promise<string[]> {
    const lastSyncedBlock = await getLastSyncedBlock(chain, 'SWAPS_V2');

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

    // Get events
    console.time('BalancerSwaps');
    const swaps = await subgraphClient.getSwapsFromBlock(lastSyncedBlock);
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
    await eventRepo.storeEvents(dbEntries);
    console.timeEnd('prismaPoolEvent.createMany');

    // Store last block
    const lastEvent = dbEntries.sort((a, b) => a.blockNumber - b.blockNumber).pop();
    if (!lastEvent) return [];
    await upsertLastSyncedBlock(chain, 'SWAPS_V2', lastEvent.blockNumber);

    return [...new Set(dbEntries.map((entry) => entry.poolId))];
}
