import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
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
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...cowAmmWorkerJobs,
        ...vebalWorkerJobs,
        ...quantAmmWorkerJobs,
    ],
};
