import { getVaultSubgraphClient } from './balancer-v3-vault';
import { getPoolsSubgraphClient } from './balancer-v3-pools';
import { PoolsQueryVariables } from './balancer-v3-vault/generated/types';

export type V3JoinedSubgraphClient = ReturnType<typeof getV3JoinedSubgraphClient>;

export type BaseJoinedSubgraphPool = ReturnType<V3JoinedSubgraphClient['getAllInitializedPools']> extends Promise<
    (infer T)[]
>
    ? T
    : never;

export type JoinedSubgraphPool = Omit<
    Omit<Omit<BaseJoinedSubgraphPool, 'factory'>, 'hookConfig'>,
    'liquidityManagement'
> & {
    factory: Omit<BaseJoinedSubgraphPool['factory'], 'type'> & {
        type: BaseJoinedSubgraphPool['factory']['type'] | 'COW_AMM';
    };
    hookConfig?: BaseJoinedSubgraphPool['hookConfig'];
    liquidityManagement?: BaseJoinedSubgraphPool['liquidityManagement'];
};

export const getV3JoinedSubgraphClient = (vaultSubgraphUrl: string, poolsSubgraphUrl: string) => {
    const vaultSubgraphClient = getVaultSubgraphClient(vaultSubgraphUrl);
    const poolsSubgraphClient = getPoolsSubgraphClient(poolsSubgraphUrl);

    return {
        getAllInitializedPools: async (where?: PoolsQueryVariables['where']) => {
            const vaultPools = await vaultSubgraphClient.getAllInitializedPools(where);
            const vaultPoolsMap = vaultPools.reduce((acc, pool) => {
                acc[pool.id] = pool;
                return acc;
            }, {} as Record<string, typeof vaultPools[0]>);
            const vaultPoolIds = Object.keys(vaultPoolsMap);
            const pools = await poolsSubgraphClient.getAllPools({ id_in: vaultPoolIds });
            return pools.map((pool) => ({
                ...pool,
                ...vaultPoolsMap[pool.id]!,
            }));
        },
    };
};
