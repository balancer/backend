import { getVaultSubgraphClient } from './balancer-v3-vault';
import { getPoolsSubgraphClient } from './balancer-v3-pools';
import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';

export const getBalancerUniversalSubgraphClient = async (
    vaultSubgraphUrl: string,
    poolsSubgraphUrl: string,
    v2SubgraphUrl: string,
    chainId: number,
) => {
    const vaultSubgraphClient = getVaultSubgraphClient(vaultSubgraphUrl);
    const poolsSubgraphClient = getPoolsSubgraphClient(poolsSubgraphUrl);
    const v2SubgraphClient = new BalancerSubgraphService(v2SubgraphUrl, chainId);

    return {
        getEvents: async () => {},
    };
};
