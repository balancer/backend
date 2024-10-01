/**
 * Immutable data is set once on a pool and doesn't change over time.
 * Subgraph is used as a source of truth for this data.
 */
import { V3PoolsSubgraphClient } from '../../../../sources/subgraphs';
import { PoolType } from '../../../../sources/subgraphs/balancer-v3-pools/generated/types';
import { update } from './update';

type StableData = {
    id: string;
    typeData: {
        amp: string;
    };
};

export async function syncImmutableDataForPools(subgraphClient: V3PoolsSubgraphClient, ids?: string[]): Promise<void> {
    const list = await subgraphClient.getAllPools({ id_in: ids });
    const params = list
        .map((pool) => {
            if (pool.factory.type === PoolType.Stable) {
                return {
                    id: pool.id,
                    typeData: {
                        amp: pool.amp, // This is mutable and is updated in sync-dynamic-data-for-pools.ts – setting it as a temporary example
                    },
                };
            }
        })
        .filter((x): x is StableData => !!x);

    await update(params);
}
