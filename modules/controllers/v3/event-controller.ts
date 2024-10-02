import config from '../../../config';

import { syncJoinExits } from '../../actions/pool/v3/sync-join-exits';
import { getVaultSubgraphClient } from '../../sources/subgraphs/balancer-v3-vault';
import { syncSwaps } from '../../actions/pool/v3/sync-swaps';
import { updateVolumeAndFees } from '../../actions/pool/update-volume-and-fees';
import { Chain } from '@prisma/client';

export function EventController() {
    return {
        async syncJoinExitsV3(chain: Chain) {
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
        async syncSwapsV3(chain: Chain) {
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const entries = await syncSwaps(vaultSubgraphClient, chain);
            return entries;
        },
        // TODO also update yieldfee
        // TODO maybe update fee from onchain instead of swap?
        async syncSwapsUpdateVolumeAndFeesV3(chain: Chain) {
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);

            const poolsWithNewSwaps = await syncSwaps(vaultSubgraphClient, chain);
            await updateVolumeAndFees(chain, poolsWithNewSwaps);
            return poolsWithNewSwaps;
        },
    };
}
