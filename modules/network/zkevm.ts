import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV2, vebalWorkerJobs } from './worker-jobs';

const zkevmNetworkData: NetworkData = config.ZKEVM;

export const zkevmNetworkConfig: NetworkConfig = {
    data: zkevmNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: zkevmNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV2, ...vebalWorkerJobs],
};
