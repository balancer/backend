import { env } from '../../app/env';

export interface NetworkConfig {
    chain: {
        slug: string;
        id: number;
        nativeAssetAddress: string;
        wrappedNativeAssetAddress: string;
    };
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
    beetsPriceProviderRpcUrl: string;
    coingecko: {
        nativeAssetId: string;
        platformId: string;
    };
    subgraphs: {
        startDate: string;
        balancer: string;
        blocks: string;
        masterchef: string;
        beetsBar: string;
        changelog: string;
        gauge: string;
        userBalances: string;
    };
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
    bal: {
        address: string;
    };
    balancer: {
        vault: string;
    };
    multicall: string;
    masterchef: {
        address: string;
        excludedFarmIds: string[];
    };
    copper: {
        proxyAddress: string;
    };
    yearn: {
        vaultsEndpoint: string;
    };
    avgBlockSpeed: number;
    sor: {
        url: string;
    };
}

const AllNetworkConfigs: { [chainId: string]: NetworkConfig } = {
    '250': {
        chain: {
            slug: 'fantom',
            id: 250,
            nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            wrappedNativeAssetAddress: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
        },
        subgraphs: {
            startDate: '2021-10-08',
            balancer: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/beethovenx',
            beetsBar: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/beets-bar',
            blocks: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/fantom-blocks',
            changelog: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/changelog',
            masterchef: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/masterchefv2',
            gauge: 'https://#/',
            userBalances: 'https://api.thegraph.com/subgraphs/name/danielmkm/user-balances-fantom',
        },
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
        beetsPriceProviderRpcUrl: 'https://rpc.ftm.tools',
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
        bal: {
            address: '',
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
        sor: {
            url: 'https://22nltjhtfsyhecuudusuv2m5i40zeafa.lambda-url.eu-central-1.on.aws/',
        },
        yearn: {
            vaultsEndpoint: 'https://d28fcsszptni1s.cloudfront.net/v1/chains/250/vaults/all',
        },
        copper: {
            proxyAddress: '0xbC8a71C75ffbd2807c021F4F81a8832392dEF93c',
        },
    },
    '10': {
        chain: {
            slug: 'optimism',
            id: 10,
            nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            wrappedNativeAssetAddress: '0x4200000000000000000000000000000000000006',
        },
        subgraphs: {
            startDate: '2022-01-01',
            balancer: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/beethovenx-optimism',
            beetsBar: 'https://',
            blocks: 'https://api.thegraph.com/subgraphs/name/danielmkm/optimism-blocks',
            changelog: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/changelog-optimism',
            masterchef: 'https://',
            gauge: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/balancer-gauges-optimism',
            userBalances: 'https://api.thegraph.com/subgraphs/name/danielmkm/bpt-balances',
        },
        eth: {
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            symbol: 'ETH',
            name: 'Ether',
        },
        weth: {
            address: '0x4200000000000000000000000000000000000006',
            addressFormatted: '0x4200000000000000000000000000000000000006',
        },
        coingecko: {
            nativeAssetId: 'ethereum',
            platformId: 'optimistic-ethereum',
        },
        rpcUrl: 'https://mainnet.optimism.io/',
        beetsPriceProviderRpcUrl: 'https://rpc.ftm.tools',
        sanity: {
            projectId: '1g2ag2hb',
            dataset: 'production',
        },
        beets: {
            address: '0x97513e975a7fa9072c72c92d8000b0db90b163c5',
        },
        fbeets: {
            address: '0x0000000000000000000000000000000000000000',
            farmId: '-1',
            poolId: '0x0000000000000000000000000000000000000000',
            poolAddress: '0x0000000000000000000000000000000000000000',
        },
        bal: {
            address: '0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921',
        },
        balancer: {
            vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        },
        multicall: '0x2DC0E2aa608532Da689e89e237dF582B783E552C',
        masterchef: {
            address: '0x0000000000000000000000000000000000000000',
            excludedFarmIds: [],
        },
        avgBlockSpeed: 1,
        sor: {
            url: 'https://ksa66wlkjbvteijxmflqjehsay0jmekw.lambda-url.eu-central-1.on.aws/',
        },
        yearn: {
            vaultsEndpoint: 'https://#/',
        },
        copper: {
            proxyAddress: '0x0000000000000000000000000000000000000000',
        },
    },
};

export const networkConfig = AllNetworkConfigs[env.CHAIN_ID];

export function isFantomNetwork() {
    return env.CHAIN_ID === '250';
}

export function isOptimismNetwork() {
    return env.CHAIN_ID === '10';
}
