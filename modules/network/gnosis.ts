import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    vebalWorkerJobs,
    cowAmmWorkerJobs,
    lbpWorkerJobs,
} from './worker-jobs';

const gnosisNetworkData: NetworkData = config.GNOSIS;

export const gnosisNetworkConfig: NetworkConfig = {
    data: gnosisNetworkData,
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...vebalWorkerJobs,
        ...cowAmmWorkerJobs,
        ...lbpWorkerJobs,
    ],
};
