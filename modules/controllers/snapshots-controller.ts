import config from '../../config';
import { syncSnapshotsV3, syncSnapshotsV2, fillMissingSnapshotsV3, fillMissingSnapshotsV2 } from '../actions/snapshots';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getVaultSubgraphClient } from '../sources/subgraphs';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';

/**
 * Controller responsible for configuring and executing ETL actions.
 *
 * @example
 * ```ts
 * const snapshotsController = SnapshotsController();
 * await snapshotsController.syncSnapshotsV3('1');
 * ```
 *
 * @param name - the name of the action
 * @param chain - the chain to run the action on
 * @returns a controller with configured action handlers
 */
export function SnapshotsController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncSnapshotsV2(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancer },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancer) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const subgraphClient = getV2SubgraphClient(balancer, Number(chainId));
            const entries = await syncSnapshotsV2(subgraphClient, chain);
            return entries;
        },
        async syncSnapshotsV3(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const entries = await syncSnapshotsV3(vaultSubgraphClient, chain);
            return entries;
        },
        async fillMissingSnapshotsV2(chainId: string) {
            const chain = chainIdToChain[chainId];

            const entries = await fillMissingSnapshotsV2(chain);
            return entries;
        },
        async fillMissingSnapshotsV3(chainId: string) {
            const chain = chainIdToChain[chainId];

            const entries = await fillMissingSnapshotsV3(chain);
            return entries;
        },
    };
}
