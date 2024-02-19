import * as actions from '@modules/actions/jobs-actions';
import * as subgraphV3Vault from '@modules/subgraphs/balancer-v3-vault';
import config from '@config/index';
import { chainIdToChain } from '@modules/network/chain-id-to-chain';
import { getViemClient } from '@modules/sources/viem-client';

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
        syncPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
                balancer: {
                    v3: { vaultAddress },
                },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const subgraphClient = subgraphV3Vault.getClient(balancerV3);
            const viemClient = getViemClient(chain);

            // TODO: add syncing v2 pools as well by splitting the poolService into separate
            // actions with extracted configuration

            return actions.syncPools(subgraphClient, viemClient, vaultAddress, chain);
        },
    };
}
