import { env } from '../../app/env';

export interface NetworkConfig {
    eth: {
        address: string;
        addressFormatted: string;
        symbol: string;
        name: string;
    };
    weth: {
        address: string;
        addressFormatted: string;
    };
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
    beets: {
        address: string;
    };
    fbeets: {
        address: string;
        farmId: string;
        poolId: string;
        poolAddress: string;
    };
    balancer: {
        vault: string;
    };
    multicall: string;
    masterchef: {
        address: string;
        excludedFarmIds: string[];
    };
    avgBlockSpeed: number;
}

const AllNetworkConfigs: { [chainId: string]: NetworkConfig } = {
    '250': {
        eth: {
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            symbol: 'FTM',
            name: 'Fantom',
        },
        weth: {
            address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
            addressFormatted: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
        },
        coingecko: {
            nativeAssetId: 'fantom',
            platformId: 'fantom',
        },
        rpcUrl: 'https://rpc.ftm.tools',
        sanity: {
            projectId: '1g2ag2hb',
            dataset: 'production',
        },
        beets: {
            address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
        },
        fbeets: {
            address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
            farmId: '22',
            poolId: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
            poolAddress: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837',
        },
        balancer: {
            vault: '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce',
        },
        multicall: '0x66335d7ad8011f6aa3f48aadcb523b62b38ed961',
        masterchef: {
            address: '0x8166994d9ebBe5829EC86Bd81258149B87faCfd3',
            excludedFarmIds: [
                '34', //OHM bonding farm
                '28', //OHM bonding farm
                '9', //old fidellio dueto (non fbeets)
            ],
        },
        avgBlockSpeed: 1,
    },
};

export const networkConfig = AllNetworkConfigs[env.CHAIN_ID];
