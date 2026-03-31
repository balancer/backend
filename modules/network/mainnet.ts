import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import { UserSyncVebalLockBalanceService } from '../user/lib/user-sync-vebal-lock-balance.service';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsGlobal,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    cowAmmWorkerJobs,
    fxWorkerJobs,
    quantAmmWorkerJobs,
    vebalWorkerJobs,
} from './worker-jobs';

export const data: NetworkData = config.MAINNET;

export const mainnetNetworkConfig: NetworkConfig = {
    data,
    userStakedBalanceServices: [
        new UserSyncGaugeBalanceService(),
        new UserSyncAuraBalanceService(),
        new UserSyncVebalLockBalanceService(),
    ],
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...cowAmmWorkerJobs,
        ...vebalWorkerJobs,
        ...quantAmmWorkerJobs,
        ...fxWorkerJobs,
        ...activeChainWorkerJobsGlobal,
    ],
};
