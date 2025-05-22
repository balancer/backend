import { V3VaultSubgraphClient } from './balancer-v3-vault';
import { V3PoolsSubgraphClient } from './balancer-v3-pools';
import { PoolsQueryVariables } from './balancer-v3-vault/generated/types';

export type V3JoinedSubgraphClient = ReturnType<typeof getV3JoinedSubgraphClient>;

export type V3JoinedSubgraphPool =
    ReturnType<V3JoinedSubgraphClient['getAllInitializedPools']> extends Promise<(infer T)[]> ? T : never;

export const getV3JoinedSubgraphClient = (
    vaultSubgraphClient: V3VaultSubgraphClient,
    poolsSubgraphClient: V3PoolsSubgraphClient,
) => {
    return {
        lastSyncedBlock: async () => {
            const vault = await vaultSubgraphClient.lastSyncedBlock();
            const pools = await poolsSubgraphClient.lastSyncedBlock();

            return Math.min(vault, pools);
        },
        getChangedPools: async (fromBlock: number) => {
            const vault = await vaultSubgraphClient.getChangedPools(fromBlock);
            const pools = await poolsSubgraphClient.getChangedPools(fromBlock);

            return [...vault, ...pools];
        },
        getAllInitializedPools: async (where?: PoolsQueryVariables['where']) => {
            const vaultPools = await vaultSubgraphClient.getAllInitializedPools(where);
            const vaultPoolsMap = vaultPools.reduce((acc, pool) => {
                acc[pool.id] = pool;
                return acc;
            }, {} as Record<string, (typeof vaultPools)[0]>);
            const vaultPoolIds = Object.keys(vaultPoolsMap);
            if (vaultPoolIds.length === 0) {
                return [];
            }
            const pools = await poolsSubgraphClient.getAllPools({ id_in: vaultPoolIds });
            return pools.map((pool) => ({
                ...pool,
                ...vaultPoolsMap[pool.id]!,
            }));
        },
    };
};
