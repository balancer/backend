import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    vebalWorkerJobs,
    cowAmmWorkerJobs,
} from './worker-jobs';

const gnosisNetworkData: NetworkData = config.GNOSIS;

export const gnosisNetworkConfig: NetworkConfig = {
    data: gnosisNetworkData,
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...vebalWorkerJobs,
        ...cowAmmWorkerJobs,
    ],
};
