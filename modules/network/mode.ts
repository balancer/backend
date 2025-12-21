import { NetworkConfig } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    deprecatedChainWorkerJobs,
    vebalWorkerJobs,
} from './worker-jobs';

export const modeNetworkData = config.MODE;

export const modeNetworkConfig: NetworkConfig = {
    data: modeNetworkData,
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    workerJobs: [...deprecatedChainWorkerJobs, ...vebalWorkerJobs],
};
