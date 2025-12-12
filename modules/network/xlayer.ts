import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import config from '../../config';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV3, lbpWorkerJobs } from './worker-jobs';

const xlayerNetworkData: NetworkData = config.XLAYER;

export const xlayerNetworkConfig: NetworkConfig = {
    data: xlayerNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: xlayerNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV3, ...lbpWorkerJobs],
};
