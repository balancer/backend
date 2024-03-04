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
 * Controller responsible for configuring and executing ETL actions, usually in the form of jobs.
 *
 * @example
 * ```ts
 * const jobsController = JobsController();
 * await jobsController.syncPools('1');
 * await jobsController.syncJoinExits('1');
 * ```
 *
 * @param name - the name of the job
 * @param chain - the chain to run the job on
 * @returns a controller with configured job handlers
 */
export function JobsController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncJoinExitsV2(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancer },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancer) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const subgraphClient = new BalancerSubgraphService(balancer, Number(chainId));
            const entries = await syncJoinExitsV2(subgraphClient, chain);
            return entries;
        },
        async syncJoinExitsV3(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const entries = await syncJoinExits(vaultSubgraphClient, chain);
            return entries;
        },
        async syncPools(chainId: string) {
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
