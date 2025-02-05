import { GraphQLClient } from 'graphql-request';
import {
    OrderDirection,
    Pool_OrderBy,
    PoolsQueryVariables,
    SepoliaTypePoolFragment,
    TypePoolFragment,
    getSdk,
} from './generated/types';
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
        async getAllPools(
            where: PoolsQueryVariables['where'],
        ): Promise<SepoliaTypePoolFragment[] | TypePoolFragment[]> {
            const limit = 1000;
            let hasMore = true;
            let id = `0x`;
            let pools: TypePoolFragment[] = [];

            const query = chain === 'SEPOLIA' ? sdk.SepoliaPools : sdk.Pools;

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
    };
};

export type V3PoolsSubgraphClient = ReturnType<typeof getPoolsSubgraphClient>;
