import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { UserSyncReliquaryFarmBalanceService } from '../user/lib/user-sync-reliquary-farm-balance.service';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    datastudioWorkerJobs,
    lbpWorkerJobs,
    loopsWorkerJobs,
    quantAmmWorkerJobs,
    reliquaryWorkerJobs,
    stsWorkerJobs,
} from './worker-jobs';

const sonicNetworkData: NetworkData = config.SONIC;

export const sonicNetworkConfig: NetworkConfig = {
    data: sonicNetworkData,
    userStakedBalanceServices: [
        new UserSyncGaugeBalanceService(),
        new UserSyncReliquaryFarmBalanceService(sonicNetworkData.reliquary!.address),
    ],
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...quantAmmWorkerJobs,
        ...lbpWorkerJobs,
        ...stsWorkerJobs,
        ...loopsWorkerJobs,
        ...datastudioWorkerJobs,
        ...reliquaryWorkerJobs,
    ],
};
