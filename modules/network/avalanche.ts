import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    vebalWorkerJobs,
    fxWorkerJobs,
} from './worker-jobs';

const avalancheNetworkData: NetworkData = config.AVALANCHE;

export const avalancheNetworkConfig: NetworkConfig = {
    data: avalancheNetworkData,
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...fxWorkerJobs,
        ...vebalWorkerJobs,
    ],
};
