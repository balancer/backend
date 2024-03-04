import config from '../../config';
import { syncPools } from '../actions/pool/sync-pools';
import { syncJoinExits } from '../actions/pool/sync-join-exits';
import { syncJoinExitsV2 } from '../actions/pool/sync-join-exits-v2';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getPoolsSubgraphClient } from '../sources/subgraphs/balancer-v3-pools';
import { getVaultSubgraphClient } from '../sources/subgraphs/balancer-v3-vault';
import { syncSwaps } from '../actions/swap/sync-swaps';
import { updateVolumeAndFees } from '../actions/swap/update-volume-and-fees';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';

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
        async syncJoinExits(chainIds: string[]) {
            for (const chainId of chainIds) {
                const chain = chainIdToChain[chainId];
                const {
                    subgraphs: { balancerV3, balancer },
                } = config[chain];

                // Guard against unconfigured chains
                if (!balancerV3) {
                    throw new Error(`Chain not configured: ${chain}`);
                }

                const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
                const entries = await syncJoinExits(vaultSubgraphClient, chain);

                // Sync from V2 – can be moved to a separate job, because it might not be available on new chains
                const v2Client = new BalancerSubgraphService(balancer, Number(chainId));
                await syncJoinExitsV2(v2Client, chain);
                return entries;
            }
        },
        async syncPools(chainIds: string[]) {
            const updatedPools: string[] = [];
            for (const chainId of chainIds) {
                const chain = chainIdToChain[chainId];
                const {
                    subgraphs: { balancerV3, balancerPoolsV3 },
                    balancer: {
                        v3: { vaultAddress },
                    },
                } = config[chain];

                // Guard against unconfigured chains
                if (!vaultAddress || !balancerV3 || !balancerPoolsV3) {
                    throw new Error(`Chain not configured: ${chain}`);
                }

                const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
                const poolSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3);
                const viemClient = getViemClient(chain);
                const latestBlock = await viemClient.getBlockNumber();

                await syncPools(vaultSubgraphClient, poolSubgraphClient, viemClient, vaultAddress, chain, latestBlock);
            }
        },
        // TODO: add this later, once we have bunch of pools and syncs become slower than a few secs
        async updateOnChainDataChangedPools(chainId: string) {},

        // TODO also update yieldfee
        // TODO maybe update fee from onchain instead of swap?
        async syncSwapsUpdateVolumeAndFees(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);

            const poolsWithNewSwaps = await syncSwaps(vaultSubgraphClient, chain);
            await updateVolumeAndFees(poolsWithNewSwaps);
            return poolsWithNewSwaps;
        },
    };
}
