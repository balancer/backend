import { update } from 'lodash';
import config from '../../config';
import { addMissingPoolsFromSubgraph } from '../actions/pool/add-pools-from-subgraph';
import { getChangedPools } from '../actions/pool/get-changed-pools';
import { updateOnChainDataForPools } from '../actions/pool/update-on-chain-data';
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

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const poolSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3!);
            const viemClient = getViemClient(chain);
            const latestBlock = await viemClient.getBlockNumber();

            // TODO: add syncing v2 pools as well by splitting the poolService into separate
            // actions with extracted configuration

            // find all missing pools and add them to the DB
            const added = await addMissingPoolsFromSubgraph(vaultSubgraphClient, poolSubgraphClient, chain);

            // update with latest on-chain data
            const updated = await updateOnChainDataForPools(vaultAddress, '123', added, viemClient, latestBlock);

            // also sync swaps and volumeAndFee values
            // const poolsWithNewSwaps = await poolService.syncSwapsForLast48Hours();
            // await poolService.updateVolumeAndFeeValuesForPools(poolsWithNewSwaps);

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
            // also sync swaps and volumeAndFee values
            // const poolsWithNewSwaps = await poolService.syncSwapsForLast48Hours();
            // await poolService.updateVolumeAndFeeValuesForPools(poolsWithNewSwaps);

            return updated;
        },
    };
}
