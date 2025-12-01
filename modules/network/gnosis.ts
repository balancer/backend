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
    cowAmmWorkerJobs,
    lbpWorkerJobs,
} from './worker-jobs';

const gnosisNetworkData: NetworkData = config.GNOSIS;

export const gnosisNetworkConfig: NetworkConfig = {
    data: gnosisNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: gnosisNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            gnosisNetworkData.subgraphs.balancer,
            gnosisNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...vebalWorkerJobs,
        ...cowAmmWorkerJobs,
        ...lbpWorkerJobs,
    ],
};
