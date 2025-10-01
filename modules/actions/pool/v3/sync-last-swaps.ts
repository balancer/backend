import { Chain } from '@prisma/client';
import { V3VaultSubgraphClient } from '../../../sources/subgraphs';
import _ from 'lodash';
import { swapV3Transformer } from '../../../sources/transformers/swap-v3-transformer';
import { OrderDirection, Swap_OrderBy } from '../../../sources/subgraphs/balancer-v3-vault/generated/types';
import { Swap_OrderBy as V2Swap_OrderBy } from '../../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { swapsUsd } from '../../../sources/enrichers/swaps-usd';
import { V2SubgraphClient } from '../../../subgraphs/balancer-subgraph';
import { SwapEvent } from '../../../../prisma/prisma-types';
import { swapV2Transformer } from '../../../sources/transformers/swap-v2-transformer';
import { eventsRepository, EventStoreRepository } from '../../../repositories/events';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param vaultSubgraphClient
 * @param chain
 * @returns
 */
export async function syncLastSwaps(
    vaultSubgraphClient: V3VaultSubgraphClient,
    v2SubgraphClient: V2SubgraphClient,
    chain = 'SEPOLIA' as Chain,
    eventRepo: EventStoreRepository = eventsRepository,
): Promise<string[]> {
    // Get swaps
    let swaps: SwapEvent[] = [];
    let blockNumber_gte = '0';
    for (let i = 0; i < 10; i++) {
        const sgSwaps = await vaultSubgraphClient
            .Swaps({
                first: 1000,
                where: { blockNumber_gte },
                orderBy: Swap_OrderBy.BlockNumber,
                orderDirection: OrderDirection.Desc,
            })
            .then(({ swaps }) => swapV3Transformer(swaps, chain));
        if (sgSwaps.length > 0) {
            swaps.push(...sgSwaps);
        } else {
            break;
        }
        blockNumber_gte = String(sgSwaps[sgSwaps.length - 1].blockNumber);
    }

    // V2 swaps
    let block_gte = '0';
    for (let i = 0; i < 10; i++) {
        const sgSwaps = await v2SubgraphClient
            .BalancerSwaps({
                first: 1000,
                where: { block_gte },
                orderBy: V2Swap_OrderBy.Block,
                orderDirection: OrderDirection.Desc,
            })
            .then(({ swaps }) => swaps.map((swap) => swapV2Transformer(swap, chain)));

        if (sgSwaps.length > 0) {
            swaps.push(...sgSwaps);
        } else {
            break;
        }
        blockNumber_gte = String(sgSwaps[sgSwaps.length - 1].blockNumber);
    }
    swaps = _.uniqBy(swaps, (swap) => swap.id);

    // Enrich with USD values
    const dbEntries = await swapsUsd(swaps, chain);
    await eventRepo.storeEvents(dbEntries);

    return dbEntries.map((entry) => entry.poolId);
}
