import { env } from '../../app/env';

export interface NetworkConfig {
    ethAddress: string;
    ethSymbol: string;
    wethAddress: string;
    wethAddressFormatted: string;
    rpcUrl: string;
    coingecko: {
        nativeAssetId: string;
        platformId: string;
    };
    /*subgraphs: {
        balancer: string;
        blocks: string;
        masterchef: string;
        beetsBar: string;
        changelog: string;
        locking: string;
    };*/
    sanity: {
        projectId: string;
        dataset: string;
    };
}

const AllNetworkConfigs: { [chainId: string]: NetworkConfig } = {
    '250': {
        ethAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        ethSymbol: 'FTM',
        wethAddress: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
        wethAddressFormatted: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
        coingecko: {
            nativeAssetId: 'fantom',
            platformId: 'fantom',
        },
        rpcUrl: 'https://rpc.ftm.tools',
        sanity: {
            projectId: '1g2ag2hb',
            dataset: 'production',
        },
    },
};

export const networkConfig = AllNetworkConfigs[env.CHAIN_ID];
