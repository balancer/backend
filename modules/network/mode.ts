import { ethers } from 'ethers';
import { NetworkConfig } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV2, vebalWorkerJobs } from './worker-jobs';

export const modeNetworkData = config.MODE;

export const modeNetworkConfig: NetworkConfig = {
    data: modeNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: modeNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            modeNetworkData.subgraphs.balancer,
            modeNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV2, ...vebalWorkerJobs],
};
