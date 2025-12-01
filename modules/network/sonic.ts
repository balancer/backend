import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';
import { UserSyncReliquaryFarmBalanceService } from '../user/lib/user-sync-reliquary-farm-balance.service';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    lbpWorkerJobs,
    loopsWorkerJobs,
    quantAmmWorkerJobs,
    stsWorkerJobs,
} from './worker-jobs';

const sonicNetworkData: NetworkData = config.SONIC;

export const sonicNetworkConfig: NetworkConfig = {
    data: sonicNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: sonicNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [
        new UserSyncGaugeBalanceService(),
        new UserSyncReliquaryFarmBalanceService(sonicNetworkData.reliquary!.address),
    ],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            sonicNetworkData.subgraphs.balancer,
            sonicNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...quantAmmWorkerJobs,
        ...lbpWorkerJobs,
        ...stsWorkerJobs,
        ...loopsWorkerJobs,
    ],
};
