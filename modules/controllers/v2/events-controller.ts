import config from '../../../config';

import { syncJoinExits, syncSwaps } from '../../actions/v2';
import { chainIdToChain } from '../../network/chain-id-to-chain';
import { BalancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { getV2SubgraphClient } from '../../subgraphs/balancer-subgraph';

export function EventController() {
    return {
        async syncJoinExits(chainId: string) {
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
        async syncSwaps(chainId: string) {
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
