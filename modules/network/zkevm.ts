import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { deprecatedChainWorkerJobs, vebalWorkerJobs } from './worker-jobs';

const zkevmNetworkData: NetworkData = config.ZKEVM;

export const zkevmNetworkConfig: NetworkConfig = {
    data: zkevmNetworkData,
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    workerJobs: [...deprecatedChainWorkerJobs, ...vebalWorkerJobs],
};
