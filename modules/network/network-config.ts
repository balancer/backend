import { fantomNetworkConfig } from './fantom';
import { optimismNetworkConfig } from './optimism';
import { NetworkConfig } from './network-config-types';
import { mainnetNetworkConfig } from './mainnet';
import { arbitrumNetworkConfig } from './arbitrum';
import { polygonNetworkConfig } from './polygon';
import { gnosisNetworkConfig } from './gnosis';

export const AllNetworkConfigs: { [chainId: string]: NetworkConfig } = {
    '250': fantomNetworkConfig,
    '10': optimismNetworkConfig,
    '1': mainnetNetworkConfig,
    '42161': arbitrumNetworkConfig,
    '137': polygonNetworkConfig,
    '100': gnosisNetworkConfig,
};

export const BalancerChainIds = ['1', '137', '42161', '100'];
export const BeethovenChainIds = ['250', '10'];
