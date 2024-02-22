import config from '../../config';
import { addMissingPoolsFromSubgraph } from '../actions/pool/add-pools-from-subgraph';
import { updateOnChainDataForPools, updateOnchainDataForAllPools } from '../actions/pool/update-on-chain-data';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getPoolsSubgraphClient } from '../subgraphs/balancer-v3-pools';
import { getVaultSubgraphClient } from '../subgraphs/balancer-v3-vault';

/**
 * Controller responsible for matching job requests to configured job handlers
 *
 * @param name - the name of the job
 * @param chain - the chain to run the job on
 * @returns a controller with configured job handlers
 */
export function PoolsController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async updateOnChainDataForPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                balancer: {
                    v3: { vaultAddress },
                },
            } = config[chain];

            // Guard against unconfigured chains
            if (!vaultAddress) {
                throw new Error(`Chain not configured: ${chain}`);
            }
            const viemClient = getViemClient(chain);

            const updated = updateOnchainDataForAllPools(vaultAddress, viemClient, chain);
            return updated;
        },
    };
}
