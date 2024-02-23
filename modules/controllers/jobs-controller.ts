import { update } from 'lodash';
import config from '../../config';
import { addMissingPoolsFromSubgraph } from '../actions/pool/add-pools-from-subgraph';
import { getChangedPools } from '../actions/pool/get-changed-pools';
import { updateOnChainDataForPools } from '../actions/pool/update-on-chain-data';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getPoolsSubgraphClient } from '../subgraphs/balancer-v3-pools';
import { BalancerVaultSubgraphSource } from '../sources/subgraphs/balancer-v3-vault';
import { syncSwapsFromSubgraph } from '../actions/swap/add-swaps-from-subgraph';
import { updateVolumeAndFees } from '../actions/swap/update-volume-and-fees';

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
        async addMissingPoolsFromSubgraph(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3, balancerPoolsV3 },
                balancer: {
                    v3: { vaultAddress },
                },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = new BalancerVaultSubgraphSource(balancerV3);
            const poolSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3!);
            const viemClient = getViemClient(chain);
            const latestBlock = await viemClient.getBlockNumber();

            // TODO: add syncing v2 pools as well by splitting the poolService into separate
            // actions with extracted configuration

            // find all missing pools and add them to the DB
            const added = await addMissingPoolsFromSubgraph(vaultSubgraphClient, poolSubgraphClient, chain);

            // update with latest on-chain data (needed? this will run on a separate job anyway)
            const updated = await updateOnChainDataForPools(vaultAddress, '123', added, viemClient, latestBlock);

            return updated;
        },
        async updateOnChainDataChangedPools(chainId: string) {
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

            const blockNumber = await viemClient.getBlockNumber();

            const changedPools = await getChangedPools(vaultAddress, viemClient, blockNumber, chain);
            if (changedPools.length === 0) {
                return [];
            }

            const updated = updateOnChainDataForPools(
                vaultAddress,
                '123',
                changedPools,
                viemClient,
                blockNumber,
                chain,
            );

            return updated;
        },

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

            const vaultSubgraphClient = new BalancerVaultSubgraphSource(balancerV3);

            const poolsWithNewSwaps = await syncSwapsFromSubgraph(vaultSubgraphClient, chain);
            await updateVolumeAndFees(poolsWithNewSwaps);
            return poolsWithNewSwaps;
        },
    };
}
