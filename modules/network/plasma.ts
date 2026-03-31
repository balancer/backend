import { NetworkConfig, NetworkData } from './network-config-types';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV3 } from './worker-jobs';

const plasmaNetworkData: NetworkData = config.PLASMA;

export const plasmaNetworkConfig: NetworkConfig = {
    data: plasmaNetworkData,
    userStakedBalanceServices: [],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV3],
};
