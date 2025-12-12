import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncMasterchefFarmBalanceService } from '../user/lib/user-sync-masterchef-farm-balance.service';
import { UserSyncReliquaryFarmBalanceService } from '../user/lib/user-sync-reliquary-farm-balance.service';
import config from '../../config';
import { deprecatedChainWorkerJobs, sftmxWorkerJobs } from './worker-jobs';

const fantomNetworkData: NetworkData = config.FANTOM;

export const fantomNetworkConfig: NetworkConfig = {
    data: fantomNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: fantomNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [
        new UserSyncMasterchefFarmBalanceService(
            fantomNetworkData.fbeets!.address,
            fantomNetworkData.fbeets!.farmId,
            fantomNetworkData.masterchef!.address,
            fantomNetworkData.masterchef!.excludedFarmIds,
        ),
        new UserSyncReliquaryFarmBalanceService(fantomNetworkData.reliquary!.address),
    ],
    workerJobs: [...deprecatedChainWorkerJobs, ...sftmxWorkerJobs],
};
