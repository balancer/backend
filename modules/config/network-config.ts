import { env } from '../../app/env';

export interface NetworkConfig {
    nativeAssetAddress: string;
    nativeAssetSymbol: string;
    wrappedNativeAssetAddress: string;
}

const AllNetworkConfigs: { [chainId: string]: NetworkConfig } = {
    '250': {
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        nativeAssetSymbol: 'FTM',
        wrappedNativeAssetAddress: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    },
};

export const networkConfig = AllNetworkConfigs[env.CHAIN_ID];
