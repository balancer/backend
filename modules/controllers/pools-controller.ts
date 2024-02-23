import config from '../../config';
import { updateOnchainDataForAllPools } from '../actions/pool/update-on-chain-data';
import { updatePoolsFromSubgraph } from '../actions/pool/update-pools-from-subgraph';
import { syncSwapsFromSubgraph } from '../actions/swap/add-swaps-from-subgraph';
import { updateVolumeAndFees } from '../actions/swap/update-volume-and-fees';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { BalancerVaultSubgraphSource } from '../sources/subgraphs/balancer-v3-vault';
import { getViemClient } from '../sources/viem-client';
import { getPoolsSubgraphClient } from '../subgraphs/balancer-v3-pools';

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
        async updatePoolsFromSubgraph(chainIds: string[]) {
            const updatedPools: string[] = [];
            for (const chainId of chainIds) {
                const chain = chainIdToChain[chainId];
                const {
                    subgraphs: { balancerV3, balancerPoolsV3 },
                } = config[chain];

                // Guard against unconfigured chains
                if (!balancerV3) {
                    throw new Error(`Chain not configured: ${chain}`);
                }

                const vaultSubgraphClient = new BalancerVaultSubgraphSource(balancerV3);
                const poolSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3!);

                // TODO: add syncing v2 pools as well by splitting the poolService into separate
                // actions with extracted configuration

                // find all missing pools and add them to the DB
                const added = await updatePoolsFromSubgraph(vaultSubgraphClient, poolSubgraphClient, chain);
            }

            return updatedPools;
        },
        async updateOnChainDataForAllPools(chainId: string) {
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
            const latestBlockNumber = await viemClient.getBlockNumber();

            const updated = updateOnchainDataForAllPools(vaultAddress, viemClient, latestBlockNumber, chain);
            return updated;
        },
        async loadSwapsFeesVolumeForAllPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = new BalancerVaultSubgraphSource(balancerV3);

            const poolsWithNewSwaps = await syncSwapsFromSubgraph(vaultSubgraphClient, chain);
            await updateVolumeAndFees(poolsWithNewSwaps);
            return poolsWithNewSwaps;
        },
    };
}
