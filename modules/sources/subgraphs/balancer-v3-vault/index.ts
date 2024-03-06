import { GraphQLClient } from 'graphql-request';
import {
    OrderDirection,
    Pool_OrderBy,
    PoolsQueryVariables,
    SwapFragment,
    Swap_OrderBy,
    VaultPoolFragment,
    getSdk,
} from './generated/types';

export function getVaultSubgraphClient(url: string) {
    const sdk = getSdk(new GraphQLClient(url));

    return {
        ...sdk,
        async getAllInitializedPools(where: PoolsQueryVariables['where']): Promise<VaultPoolFragment[]> {
            const limit = 1000;
            let hasMore = true;
            let id = `0x`;
            let pools: VaultPoolFragment[] = [];

            while (hasMore) {
                const response = await sdk.Pools({
                    where: { ...where, id_gt: id, isInitialized: true },
                    orderBy: Pool_OrderBy.Id,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                });

                pools = [...pools, ...response.pools];

                if (response.pools.length < limit) {
                    hasMore = false;
                } else {
                    id = response.pools[response.pools.length - 1].id;
                }
            }

            return pools;
        },
        async getSwapsSince(timestamp: number): Promise<SwapFragment[]> {
            const limit = 1000;
            let hasMore = true;
            let startTimestamp = `${timestamp}`;
            let swaps: SwapFragment[] = [];

            while (hasMore) {
                const response = await sdk.Swaps({
                    where: { blockTimestamp_gt: startTimestamp },
                    orderBy: Swap_OrderBy.BlockTimestamp,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                });

                swaps = [...swaps, ...response.swaps];

                if (response.swaps.length < limit) {
                    hasMore = false;
                } else {
                    startTimestamp = response.swaps[response.swaps.length - 1].blockTimestamp;
                }
            }

            return swaps;
        },
    };
}

export type V3VaultSubgraphClient = ReturnType<typeof getVaultSubgraphClient>;

export class BalancerVaultSubgraphSource {
    private sdk: ReturnType<typeof getSdk>;

    /**
     * Creates a subgraph source based on subgraph URL
     * @param subgraphUrl
     */
    constructor(subgraphUrl: string) {
        this.sdk = getSdk(new GraphQLClient(subgraphUrl));
    }

    public async getAllInitializedPools(): Promise<VaultPoolFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let id = `0x`;
        let pools: VaultPoolFragment[] = [];

        while (hasMore) {
            const response = await this.sdk.Pools({
                where: { id_gt: id, isInitialized: true },
                orderBy: Pool_OrderBy.Id,
                orderDirection: OrderDirection.Asc,
                first: limit,
            });

            pools = [...pools, ...response.pools];

            if (response.pools.length < limit) {
                hasMore = false;
            } else {
                id = response.pools[response.pools.length - 1].id;
            }
        }

        return pools;
    }

    public async getSwapsSince(timestamp: number): Promise<SwapFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let startTimestamp = `${timestamp}`;
        let swaps: SwapFragment[] = [];

        while (hasMore) {
            const response = await this.sdk.Swaps({
                where: { blockTimestamp_gt: startTimestamp },
                orderBy: Swap_OrderBy.BlockTimestamp,
                orderDirection: OrderDirection.Asc,
                first: limit,
            });

            swaps = [...swaps, ...response.swaps];

            if (response.swaps.length < limit) {
                hasMore = false;
            } else {
                startTimestamp = response.swaps[response.swaps.length - 1].blockTimestamp;
            }
        }

        return swaps;
    }
}
