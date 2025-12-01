import { ethers } from 'ethers';
import { NetworkConfig } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    cowAmmWorkerJobs,
    quantAmmWorkerJobs,
    lbpWorkerJobs,
} from './worker-jobs';

export const sepoliaNetworkData = config.SEPOLIA;

export const sepoliaNetworkConfig: NetworkConfig = {
    data: sepoliaNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: sepoliaNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            sepoliaNetworkData.subgraphs.balancer,
            sepoliaNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...cowAmmWorkerJobs,
        ...quantAmmWorkerJobs,
        ...lbpWorkerJobs,
    ],
};
