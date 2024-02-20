import config from '@config/index';
import { chainIdToChain } from '@modules/network/chain-id-to-chain';
import { getViemClient } from '@modules/sources/viem-client';
import { syncMissingPools } from '@modules/actions/jobs-actions/sync-pools';
import { getVaultSubgraphClient } from '@modules/subgraphs/balancer-v3-vault';
import { getPoolsSubgraphClient } from '@modules/subgraphs/balancer-v3-pools';

/**
 * Controller responsible for matching job requests to configured job handlers
 *
 * @param name - the name of the job
 * @param chain - the chain to run the job on
 * @returns a controller with configured job handlers
 */
export function JobsController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        addMissingPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3, balancerPoolsV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const poolSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3!);

            // TODO: add syncing v2 pools as well by splitting the poolService into separate
            // actions with extracted configuration

            return syncMissingPools(vaultSubgraphClient, poolSubgraphClient, chain);
        },
    };
}
