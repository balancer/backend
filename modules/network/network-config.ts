import { fantomNetworkConfig } from './fantom';
import { optimismNetworkConfig } from './optimism';
import { NetworkConfig } from './network-config-types';
import { mainnetNetworkConfig } from './mainnet';
import { arbitrumNetworkConfig } from './arbitrum';
import { polygonNetworkConfig } from './polygon';
import { gnosisNetworkConfig } from './gnosis';
import { zkevmNetworkConfig } from './zkevm';
import { avalancheNetworkConfig } from './avalanche';
import { baseNetworkConfig } from './base';
import { Chain } from '@prisma/client';
import { keyBy, pickBy } from 'lodash';

export const AllNetworkConfigs: { [chainId: string]: NetworkConfig } = {
    '250': fantomNetworkConfig,
    '10': optimismNetworkConfig,
    '1': mainnetNetworkConfig,
    '42161': arbitrumNetworkConfig,
    '137': polygonNetworkConfig,
    '100': gnosisNetworkConfig,
    '1101': zkevmNetworkConfig,
    '43114': avalancheNetworkConfig,
    '8453': baseNetworkConfig,
};

export const AllNetworkConfigsKeyedOnChain: { [chain in Chain]: NetworkConfig } = {
    FANTOM: fantomNetworkConfig,
    OPTIMISM: optimismNetworkConfig,
    MAINNET: mainnetNetworkConfig,
    ARBITRUM: arbitrumNetworkConfig,
    POLYGON: polygonNetworkConfig,
    GNOSIS: gnosisNetworkConfig,
    ZKEVM: zkevmNetworkConfig,
    AVALANCHE: avalancheNetworkConfig,
    BASE: baseNetworkConfig,
};

export const BalancerChainIds = ['1', '137', '42161', '100', '1101', '43114', '8453'];
export const BeethovenChainIds = ['250', '10'];
