import { NetworkConfig, NetworkData } from './network-config-types';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV3 } from './worker-jobs';

const hyperEvmNetworkData: NetworkData = config.HYPEREVM;

export const hyperevmNetworkConfig: NetworkConfig = {
    data: hyperEvmNetworkData,
    userStakedBalanceServices: [],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV3],
};
