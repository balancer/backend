import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV3, lbpWorkerJobs } from './worker-jobs';

const hyperEvmNetworkData: NetworkData = config.HYPEREVM;

export const hyperevmNetworkConfig: NetworkConfig = {
    data: hyperEvmNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: hyperEvmNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV3, ...lbpWorkerJobs],
};
