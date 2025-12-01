import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV3, lbpWorkerJobs } from './worker-jobs';

const hyperEvmNetworkData: NetworkData = config.HYPEREVM;

export const hyperevmNetworkConfig: NetworkConfig = {
    data: hyperEvmNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: hyperEvmNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            hyperEvmNetworkData.subgraphs.balancer,
            hyperEvmNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV3, ...lbpWorkerJobs],
};
