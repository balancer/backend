import { GraphQLClient } from 'graphql-request';
import {
    BalancerPoolSnapshotFragment,
    getSdk,
    OrderDirection,
    Pool_OrderBy,
    PoolBalancesFragment,
    PoolBalancesQueryVariables,
    BalancerSwapFragment,
    Swap_Filter,
    Swap_OrderBy,
    PoolSnapshot_OrderBy,
} from './generated/balancer-subgraph-types';
import { BalancerSubgraphService } from './balancer-subgraph.service';
import { Chain } from '@prisma/client';

export type V2SubgraphClient = ReturnType<typeof getV2SubgraphClient>;

export function getV2SubgraphClient(url: string, chain: Chain) {
    const sdk = getSdk(new GraphQLClient(url));
    const legacyService = new BalancerSubgraphService(url, chain);

    return {
        ...sdk,
        chain: chain,
        legacyService,
        lastSyncedBlock: legacyService.lastSyncedBlock.bind(legacyService),
        getAllPoolSnapshots: legacyService.getAllPoolSnapshots.bind(legacyService),
        getAllPoolSharesWithBalance: legacyService.getAllPoolSharesWithBalance.bind(legacyService),
        async getSnapshotsForTimestamp(timestamp: number): Promise<BalancerPoolSnapshotFragment[]> {
            const limit = 1000;
            let hasMore = true;
            let id = `0x`;
            let snapshots: BalancerPoolSnapshotFragment[] = [];

            while (hasMore) {
                const response = await sdk.BalancerPoolSnapshots({
                    where: { timestamp, id_gt: id },
                    orderBy: PoolSnapshot_OrderBy.Id,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                });

                snapshots = [...snapshots, ...response.poolSnapshots];

                if (response.poolSnapshots.length < limit) {
                    hasMore = false;
                } else {
                    id = snapshots[snapshots.length - 1].id;
                }
            }

            return snapshots;
        },
        async getAllPoolBalances({ where, block }: PoolBalancesQueryVariables): Promise<PoolBalancesFragment[]> {
            const limit = 1000;
            let hasMore = true;
            let id = `0x`;
            let data: PoolBalancesFragment[] = [];

            while (hasMore) {
                const response = await sdk.PoolBalances({
                    where: { ...where, id_gt: id },
                    orderBy: Pool_OrderBy.Id,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                    block,
                });

                data = [...data, ...response.pools];

                if (response.pools.length < limit) {
                    hasMore = false;
                } else {
                    id = response.pools[response.pools.length - 1].id;
                }
            }

            return data;
        },
        // Get two pages and truncate at the even block to make sure pagination doesn't skip events from the same block
        async getSwapsByCompleteBlock(where: Swap_Filter) {
            const { swaps } = await sdk.BalancerSwaps({
                first: 1000,
                where: where,
                orderBy: Swap_OrderBy.Block,
                orderDirection: OrderDirection.Asc,
            });

            if (swaps.length < 1000) {
                return swaps;
            } else {
                const lastSwap = swaps[swaps.length - 1];
                const { swaps: secondPage } = await sdk.BalancerSwaps({
                    first: 1000,
                    where: {
                        block_gte: lastSwap.block,
                    },
                    orderBy: Swap_OrderBy.Block,
                    orderDirection: OrderDirection.Asc,
                });

                const mergedSwaps = [...swaps, ...secondPage]
                    .filter((swap, index, array) => array.findIndex((s) => s.id === swap.id) === index)
                    .sort((a, b) => Number(a.block) - Number(b.block));

                if (mergedSwaps.length < 2000) {
                    return mergedSwaps;
                } else {
                    // Trunc last block, so we can fetch it again clean
                    const lastSecondPageSwap = secondPage[secondPage.length - 1];
                    return mergedSwaps.filter((swap) => swap.block !== lastSecondPageSwap.block);
                }
            }
        },
        async getAllSwaps(poolId: string) {
            const limit = 1000;
            let fromBlock = '0';
            let hasMore = true;
            let swaps: BalancerSwapFragment[] = [];

            while (hasMore) {
                const response = await sdk.BalancerSwaps({
                    where: { poolId_: { id: poolId }, block_gte: fromBlock },
                    orderBy: Swap_OrderBy.Timestamp,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                });

                swaps = [...swaps, ...response.swaps];
                if (response.swaps.length < limit) {
                    hasMore = false;
                } else {
                    fromBlock = response.swaps[response.swaps.length - 1].block!;
                }
            }

            const uniqueSwaps = swaps.filter(
                (swap, index, array) => array.findIndex((s) => s.id === swap.id) === index,
            );

            return uniqueSwaps;
        },
    };
}
