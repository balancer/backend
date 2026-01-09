import { NetworkConfig, NetworkData } from './network-config-types';
import config from '../../config';

const fantomNetworkData: NetworkData = config.FANTOM;

export const fantomNetworkConfig: NetworkConfig = {
    data: fantomNetworkData,
    userStakedBalanceServices: [],
    workerJobs: [],
};
