import { V3VaultSubgraphClient } from './balancer-v3-vault';
import { V3PoolsSubgraphClient } from './balancer-v3-pools';
import { PoolsQueryVariables } from './balancer-v3-vault/generated/types';

export type V3JoinedSubgraphClient = ReturnType<typeof getV3JoinedSubgraphClient>;

export type V3JoinedSubgraphPool = ReturnType<V3JoinedSubgraphClient['getAllInitializedPools']> extends Promise<
    (infer T)[]
>
    ? T
    : never;

export const getV3JoinedSubgraphClient = (
    vaultSubgraphClient: V3VaultSubgraphClient,
    poolsSubgraphClient: V3PoolsSubgraphClient,
) => {
    return {
        getMetadata: async () => {
            const vault = await vaultSubgraphClient.getMetadata();
            const pools = await poolsSubgraphClient.getMetadata();

            return {
                ...vault,
                block: {
                    ...vault.block,
                    number: Math.min(vault.block.number, pools.block.number),
                },
            };
        },
        getAllInitializedPools: async (where?: PoolsQueryVariables['where']) => {
            const vaultPools = await vaultSubgraphClient.getAllInitializedPools(where);
            const vaultPoolsMap = vaultPools.reduce((acc, pool) => {
                acc[pool.id] = pool;
                return acc;
            }, {} as Record<string, (typeof vaultPools)[0]>);
            const vaultPoolIds = Object.keys(vaultPoolsMap);
            const pools = await poolsSubgraphClient.getAllPools({ id_in: vaultPoolIds });
            return pools.map((pool) => ({
                ...pool,
                ...vaultPoolsMap[pool.id]!,
            }));
        },
    };
};
