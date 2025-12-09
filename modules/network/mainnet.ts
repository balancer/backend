import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import { UserSyncVebalLockBalanceService } from '../user/lib/user-sync-vebal-lock-balance.service';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsGlobal,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    cowAmmWorkerJobs,
    fxWorkerJobs,
    lbpWorkerJobs,
    quantAmmWorkerJobs,
    vebalWorkerJobs,
} from './worker-jobs';

export const data: NetworkData = config.MAINNET;

export const mainnetNetworkConfig: NetworkConfig = {
    data,
    provider: new ethers.providers.JsonRpcProvider({ url: data.rpcUrl, timeout: 60000 }),

    userStakedBalanceServices: [
        new UserSyncGaugeBalanceService(),
        new UserSyncAuraBalanceService(),
        new UserSyncVebalLockBalanceService(),
    ],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(data.subgraphs.balancer, 'MAINNET'),
    },
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...cowAmmWorkerJobs,
        ...vebalWorkerJobs,
        ...quantAmmWorkerJobs,
        ...lbpWorkerJobs,
        ...fxWorkerJobs,
        ...activeChainWorkerJobsGlobal,
    ],
};
