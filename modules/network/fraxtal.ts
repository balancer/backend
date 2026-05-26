import { NetworkConfig } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { deprecatedChainWorkerJobs, vebalWorkerJobs } from './worker-jobs';

export const fraxtalNetworkData = config.FRAXTAL;

export const fraxtalNetworkConfig: NetworkConfig = {
    data: fraxtalNetworkData,
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    workerJobs: [...deprecatedChainWorkerJobs, ...vebalWorkerJobs],
};
