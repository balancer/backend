import { fantomNetworkConfig } from './fantom';
import { optimismNetworkConfig } from './optimism';
import { NetworkConfig } from './network-config-types';
import { mainnetNetworkConfig } from './mainnet';
import { arbitrumNetworkConfig } from './arbitrum';
import { polygonNetworkConfig } from './polygon';

export const AllNetworkConfigs: { [chainId: string]: NetworkConfig } = {
    '250': fantomNetworkConfig,
    '10': optimismNetworkConfig,
    '1': mainnetNetworkConfig,
    '42161': arbitrumNetworkConfig,
    '137': polygonNetworkConfig,
};
