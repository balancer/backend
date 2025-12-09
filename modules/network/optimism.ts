import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    vebalWorkerJobs,
    lbpWorkerJobs,
    datastudioWorkerJobs,
} from './worker-jobs';

const optimismNetworkData: NetworkData = config.OPTIMISM;

export const optimismNetworkConfig: NetworkConfig = {
    data: optimismNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: optimismNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            optimismNetworkData.subgraphs.balancer,
            optimismNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...vebalWorkerJobs,
        ...lbpWorkerJobs,
        ...datastudioWorkerJobs,
    ],
};
