import { GraphQLClient } from 'graphql-request';
import { OrderDirection, Pool_OrderBy, PoolsQueryVariables, TypePoolFragment, getSdk } from './generated/types';
import { Chain } from '@prisma/client';

/**
 * Builds a client based on subgraph URL.
 *
 * @param subgraphUrl - url of the subgraph
 * @returns sdk - generated sdk for the subgraph
 */
export const getPoolsSubgraphClient = (subgraphUrl: string, chain: Chain) => {
    const client = new GraphQLClient(subgraphUrl);
    const sdk = getSdk(client);

    return {
        ...sdk,
        async lastSyncedBlock() {
            return sdk.Metadata().then((response) => {
                if (response && response.meta) {
                    return Number(response.meta.block.number);
                } else {
                    // Return a default value if meta is not present
                    return Promise.reject('Error fetching metadata');
                }
            });
        },
        async getAllPools(where: PoolsQueryVariables['where']): Promise<TypePoolFragment[]> {
            const limit = 1000;
            let hasMore = true;
            let id = `0x`;
            let pools: TypePoolFragment[] = [];

            const query = sdk.Pools;

            while (hasMore) {
                const response = await query({
                    where: { ...where, id_gt: id },
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
        async getChangedPools(fromBlock: number): Promise<string[]> {
            const limit = 1000;
            let hasMore = true;
            let id = `0x`;
            let pools: string[] = [];

            while (hasMore) {
                const response = await sdk.ChangedPools({
                    where: { id_gt: id, _change_block: { number_gte: fromBlock } },
                    orderBy: Pool_OrderBy.Id,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                });

                pools = [...pools, ...response.pools.map((p) => p.id)];

                if (response.pools.length < limit) {
                    hasMore = false;
                } else {
                    id = response.pools[response.pools.length - 1].id;
                }
            }

            return pools;
        },
    };
};

export type V3PoolsSubgraphClient = ReturnType<typeof getPoolsSubgraphClient>;
