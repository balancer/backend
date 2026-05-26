import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    cowAmmWorkerJobs,
    quantAmmWorkerJobs,
    vebalWorkerJobs,
} from './worker-jobs';

const baseNetworkData: NetworkData = config.BASE;

export const baseNetworkConfig: NetworkConfig = {
    data: baseNetworkData,
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...cowAmmWorkerJobs,
        ...vebalWorkerJobs,
        ...quantAmmWorkerJobs,
    ],
};
