import { getVaultSubgraphClient } from './balancer-v3-vault';
import { getPoolsSubgraphClient } from './balancer-v3-pools';
import { PoolsQueryVariables } from './balancer-v3-vault/generated/types';

export type V3JoinedSubgraphClient = ReturnType<typeof getV3JoinedSubgraphClient>;

export type JoinedSubgraphPool = ReturnType<V3JoinedSubgraphClient['getAllInitializedPools']> extends Promise<
    (infer T)[]
>
    ? T
    : never;

export const getV3JoinedSubgraphClient = (vaultSubgraphUrl: string, poolsSubgraphUrl: string) => {
    const vaultSubgraphClient = getVaultSubgraphClient(vaultSubgraphUrl);
    const poolsSubgraphClient = getPoolsSubgraphClient(poolsSubgraphUrl);

    return {
        getAllInitializedPools: async (where?: PoolsQueryVariables['where']) => {
            const vaultPools = await vaultSubgraphClient.getAllInitializedPools(where);
            const vaultPoolIds = vaultPools.map((pool) => pool.id);
            const pools = await poolsSubgraphClient.getAllPools({ id_in: vaultPoolIds });
            return pools.map((pool) => ({
                ...pool,
                ...vaultPools.find((vaultPool) => vaultPool.id === pool.id)!,
            }));
        },
    };
};
