import config from '../../config';
import { upsertBptBalancesV3 } from '../actions/user/upsert-bpt-balances-v3';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getVaultSubgraphClient } from '../sources/subgraphs';

export function UserBalancesController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncUserBalancesFromV3Subgraph(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const entries = await upsertBptBalancesV3(vaultSubgraphClient, chain);
            return entries;
        },
    };
}
