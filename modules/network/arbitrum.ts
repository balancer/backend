import { ethers } from 'ethers';
import { NetworkConfig } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    cowAmmWorkerJobs,
    lbpWorkerJobs,
    quantAmmWorkerJobs,
    vebalWorkerJobs,
} from './worker-jobs';
export const arbitrumNetworkData = config.ARBITRUM;

export const arbitrumNetworkConfig: NetworkConfig = {
    data: arbitrumNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: arbitrumNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],

    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...cowAmmWorkerJobs,
        ...quantAmmWorkerJobs,
        ...lbpWorkerJobs,
        ...vebalWorkerJobs,
    ],
};
