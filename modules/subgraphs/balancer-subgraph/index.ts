import { GraphQLClient } from 'graphql-request';
import {
    OrderDirection,
    PoolBalancesFragment,
    PoolBalancesQueryVariables,
    BalancerPoolSnapshotFragment,
    Pool_OrderBy,
    PoolSnapshot_OrderBy,
    getSdk,
} from './generated/balancer-subgraph-types';

export type V2SubgraphClient = ReturnType<typeof getV2SubgraphClient>;

export function getV2SubgraphClient(url: string) {
    const sdk = getSdk(new GraphQLClient(url));

    return {
        ...sdk,
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
    };
}
