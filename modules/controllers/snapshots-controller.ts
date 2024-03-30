import config from '../../config';
import { syncSnapshotsV3 } from '../actions/snapshots/sync-snapshots-v3';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getVaultSubgraphClient } from '../sources/subgraphs';

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
            // ...
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
    };
}
