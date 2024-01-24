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
import { sepoliaNetworkConfig } from './sepolia';

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
    '11155111': sepoliaNetworkConfig,
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
    SEPOLIA: sepoliaNetworkConfig,
};

export const chainIdToChain: { [id: string]: Chain } = {
    '1': Chain.MAINNET,
    '10': Chain.OPTIMISM,
    '100': Chain.GNOSIS,
    '137': Chain.POLYGON,
    '250': Chain.FANTOM,
    '1101': Chain.ZKEVM,
    '8453': Chain.BASE,
    '42161': Chain.ARBITRUM,
    '43114': Chain.AVALANCHE,
    '11155111': Chain.SEPOLIA,
};

export const BalancerChainIds = ['1', '137', '42161', '100', '1101', '43114', '8453', '11155111'];
export const BeethovenChainIds = ['250', '10'];

export const chainToIdMap = Object.values(AllNetworkConfigs).reduce((acc, config) => {
    acc[config.data.chain.gqlId] = String(config.data.chain.id);
    return acc;
}, {} as { [chain in Chain]: string });
