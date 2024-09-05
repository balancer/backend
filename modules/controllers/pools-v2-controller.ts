import config from '../../config';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { addPools } from '../actions/pool/add-pools-v2';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';

export function PoolsV2Controller(tracer?: any) {
    return {
        async addPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const subgraphUrl = config[chain].subgraphs.balancer;
            const subgraphService = getV2SubgraphClient(subgraphUrl, Number(chainId));

            return addPools(subgraphService, chain);
        },
    };
}
