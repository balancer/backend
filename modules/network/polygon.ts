import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV2, vebalWorkerJobs, fxWorkerJobs } from './worker-jobs';

const polygonNetworkData: NetworkData = config.POLYGON;

export const polygonNetworkConfig: NetworkConfig = {
    data: polygonNetworkData,
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV2, ...vebalWorkerJobs, ...fxWorkerJobs],
};
