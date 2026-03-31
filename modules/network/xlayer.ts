import { NetworkConfig, NetworkData } from './network-config-types';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV3 } from './worker-jobs';

const xlayerNetworkData: NetworkData = config.XLAYER;

export const xlayerNetworkConfig: NetworkConfig = {
    data: xlayerNetworkData,
    userStakedBalanceServices: [],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV3],
};
