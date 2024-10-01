import config from '../../../config';

import { chainIdToChain } from '../../network/chain-id-to-chain';
import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { getV2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import { syncJoinExits } from '../../actions/pool/v2/sync-join-exits';
import { syncSwaps } from '../../actions/pool/v2/sync-swaps';

export function EventController() {
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
            const entries = await syncJoinExits(subgraphClient, chain);
            return entries;
        },
        async syncSwapsV2(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancer },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancer) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const subgraphClient = getV2SubgraphClient(balancer, Number(chainId));
            const entries = await syncSwaps(subgraphClient, chain);
            return entries;
        },
    };
}
