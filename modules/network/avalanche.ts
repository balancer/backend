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
    cowAmmWorkerJobs,
    lbpWorkerJobs,
    vebalWorkerJobs,
    fxWorkerJobs,
} from './worker-jobs';

const avalancheNetworkData: NetworkData = config.AVALANCHE;

export const avalancheNetworkConfig: NetworkConfig = {
    data: avalancheNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: avalancheNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            avalancheNetworkData.subgraphs.balancer,
            avalancheNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...lbpWorkerJobs,
        ...fxWorkerJobs,
        ...vebalWorkerJobs,
    ],
};
