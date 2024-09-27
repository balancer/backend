import config from '../../config';

import { syncJoinExits } from '../actions/pool/sync-join-exits';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getVaultSubgraphClient } from '../sources/subgraphs/balancer-v3-vault';
import { syncSwapsV3 } from '../actions/pool/sync-swaps-v3';
import { updateVolumeAndFees } from '../actions/swap/update-volume-and-fees';

export function EventController() {
    return {
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
        async syncSwapsV3(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const entries = await syncSwapsV3(vaultSubgraphClient, chain);
            return entries;
        },
        // TODO also update yieldfee
        // TODO maybe update fee from onchain instead of swap?
        async syncSwapsUpdateVolumeAndFeesV3(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);

            const poolsWithNewSwaps = await syncSwapsV3(vaultSubgraphClient, chain);
            await updateVolumeAndFees(chain, poolsWithNewSwaps);
            return poolsWithNewSwaps;
        },
    };
}
