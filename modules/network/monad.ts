import { NetworkConfig, NetworkData } from './network-config-types';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV3, lbpWorkerJobs } from './worker-jobs';

const monadNetworkData: NetworkData = config.MONAD;

export const monadNetworkConfig: NetworkConfig = {
    data: monadNetworkData,
    userStakedBalanceServices: [],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV3, ...lbpWorkerJobs],
};
