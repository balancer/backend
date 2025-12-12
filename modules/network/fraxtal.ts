import { ethers } from 'ethers';
import { NetworkConfig } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV2, vebalWorkerJobs } from './worker-jobs';

export const fraxtalNetworkData = config.FRAXTAL;

export const fraxtalNetworkConfig: NetworkConfig = {
    data: fraxtalNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: fraxtalNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV2, ...vebalWorkerJobs],
};
