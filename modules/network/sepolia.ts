import { ethers } from 'ethers';
import { NetworkConfig } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import config from '../../config';
import {
    activeChainWorkerJobsGeneric,
    activeChainWorkerJobsV2,
    activeChainWorkerJobsV3,
    cowAmmWorkerJobs,
    quantAmmWorkerJobs,
    lbpWorkerJobs,
} from './worker-jobs';

export const sepoliaNetworkData = config.SEPOLIA;

export const sepoliaNetworkConfig: NetworkConfig = {
    data: sepoliaNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: sepoliaNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    workerJobs: [
        ...activeChainWorkerJobsGeneric,
        ...activeChainWorkerJobsV2,
        ...activeChainWorkerJobsV3,
        ...cowAmmWorkerJobs,
        ...quantAmmWorkerJobs,
        ...lbpWorkerJobs,
    ],
};
