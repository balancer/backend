import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV3, lbpWorkerJobs } from './worker-jobs';

const plasmaNetworkData: NetworkData = config.PLASMA;

export const plasmaNetworkConfig: NetworkConfig = {
    data: plasmaNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: plasmaNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV3, ...lbpWorkerJobs],
};
