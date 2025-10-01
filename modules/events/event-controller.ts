import config from '../../config';

import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';
import { syncJoinExits as syncJoinExitsV3 } from '../actions/pool/v3/sync-join-exits';
import { syncSwaps as syncSwapsV3 } from '../actions/pool/v3/sync-swaps';
import { Chain } from '@prisma/client';
import { updateVolumeAndFees } from '../pool/lib/update-volume-and-fees';
import { getVaultSubgraphClient } from '../sources/subgraphs/balancer-v3-vault';
import { syncLastSwaps } from '../actions/pool/v3/sync-last-swaps';
import { syncAddRemoveV2, syncSwapsV2 } from './handlers/sync-events-v2';

export function EventController() {
    return {
        async syncEventsV2(chain: Chain) {
            const {
                subgraphs: { balancer },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancer) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const subgraphClient = getV2SubgraphClient(balancer, chain);
            const poolsWithAddRemove = await syncAddRemoveV2(subgraphClient, chain);
            const poolsWithSwaps = await syncSwapsV2(subgraphClient, chain);

            return new Set([...poolsWithAddRemove, ...poolsWithSwaps]);
        },
        async syncJoinExitsV3(chain: Chain) {
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3, chain);
            const entries = await syncJoinExitsV3(vaultSubgraphClient, chain);
            return entries;
        },
        async syncSwapsV3(chain: Chain) {
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3, chain);
            const entries = await syncSwapsV3(vaultSubgraphClient, chain);
            return entries;
        },
        async syncLastSwaps(chain: Chain) {
            const {
                subgraphs: { balancer, balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const v2Subgraph = getV2SubgraphClient(balancer, chain);
            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3, chain);
            const entries = await syncLastSwaps(vaultSubgraphClient, v2Subgraph, chain);
            return entries;
        },
        async syncSwapsUpdateVolumeAndFeesV3(chain: Chain) {
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3, chain);

            const poolsWithNewSwaps = await syncSwapsV3(vaultSubgraphClient, chain);
            await updateVolumeAndFees(chain, poolsWithNewSwaps);
            return poolsWithNewSwaps;
        },
        async updateVolumeAndFees(chain: Chain) {
            return updateVolumeAndFees(chain);
        },
    };
}
