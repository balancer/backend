import { BigNumber } from 'ethers';
import { env } from '../../app/env';

export type DeploymentEnv = 'canary' | 'main';

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
        weightedPoolV2Factory: string;
        coposableStablePoolFactory: string;
        yieldProtocolFeePercentage: number;
        swapProtocolFeePercentage: number;
    };
    multicall: string;
    masterchef: {
        address: string;
        excludedFarmIds: string[];
    };
    copper: {
        proxyAddress: string;
    };
    reaper?: {
        linearPoolFactories: string[];
    };
    yearn: {
        vaultsEndpoint: string;
    };
    lido?: {
        wstEthContract: string;
        wstEthAprEndpoint: string;
    };
    overnight?: {
        aprEndpoint: string;
    };
    avgBlockSpeed: number;
    sor: {
        [key in DeploymentEnv]: {
            url: string;
            maxPools: number;
            forceRefresh: boolean;
            gasPrice: BigNumber;
            swapGas: BigNumber;
        };
    };
    datastudio: {
        [key in DeploymentEnv]: {
            user: string;
            sheetId: string;
            compositionTabName: string;
            databaseTabName: string;
            emissionDataTabName: string;
        };
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
            userBalances: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/user-bpt-balances-fantom',
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
            coposableStablePoolFactory: '0xB384A86F2Fd7788720db42f9daa60fc07EcBeA06',
            weightedPoolV2Factory: '0x8ea1c497c16726E097f62C8C9FBD944143F27090',
            swapProtocolFeePercentage: 0.25,
            yieldProtocolFeePercentage: 0.25,
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
            main: {
                url: 'https://seb3bxrechp46fx7h3d2ksmjce0minwk.lambda-url.ca-central-1.on.aws/',
                maxPools: 8,
                forceRefresh: false,
                gasPrice: BigNumber.from(10),
                swapGas: BigNumber.from('1000000'),
            },
            canary: {
                url: 'https://22nltjhtfsyhecuudusuv2m5i40zeafa.lambda-url.eu-central-1.on.aws/',
                maxPools: 8,
                forceRefresh: false,
                gasPrice: BigNumber.from(10),
                swapGas: BigNumber.from('1000000'),
            },
        },
        yearn: {
            vaultsEndpoint: 'https://d28fcsszptni1s.cloudfront.net/v1/chains/250/vaults/all',
        },
        copper: {
            proxyAddress: '0xbC8a71C75ffbd2807c021F4F81a8832392dEF93c',
        },
        reaper: {
            linearPoolFactories: ['0xd448c4156b8de31e56fdfc071c8d96459bb28119'],
        },
        datastudio: {
            main: {
                user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
                sheetId: '1Ifbfh8njyssWKuLlUvlfXt-r3rnd4gAIP5sSM-lEuBU',
                databaseTabName: 'Database v2',
                compositionTabName: 'Pool Composition v2',
                emissionDataTabName: 'EmissionData',
            },
            canary: {
                user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
                sheetId: '17bYDbQAdMwGevfJ7thiwI8mjYeZppVRi8gD8ER6CtSs',
                databaseTabName: 'Database v2',
                compositionTabName: 'Pool Composition v2',
                emissionDataTabName: 'EmissionData',
            },
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
            userBalances: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/user-bpt-balances-optimism',
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
        rpcUrl: 'https://rpc.ankr.com/optimism',
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
            coposableStablePoolFactory: '0xf145caFB67081895EE80eB7c04A30Cf87f07b745',
            weightedPoolV2Factory: '0xad901309d9e9DbC5Df19c84f729f429F0189a633',
            swapProtocolFeePercentage: 0.5,
            yieldProtocolFeePercentage: 0.5,
        },
        multicall: '0x2DC0E2aa608532Da689e89e237dF582B783E552C',
        masterchef: {
            address: '0x0000000000000000000000000000000000000000',
            excludedFarmIds: [],
        },
        avgBlockSpeed: 1,
        sor: {
            main: {
                url: 'https://uu6cfghhd5lqa7py3nojxkivd40zuugb.lambda-url.ca-central-1.on.aws/',
                maxPools: 8,
                forceRefresh: false,
                gasPrice: BigNumber.from(10),
                swapGas: BigNumber.from('1000000'),
            },
            canary: {
                url: 'https://ksa66wlkjbvteijxmflqjehsay0jmekw.lambda-url.eu-central-1.on.aws/',
                maxPools: 8,
                forceRefresh: false,
                gasPrice: BigNumber.from(10),
                swapGas: BigNumber.from('1000000'),
            },
        },
        yearn: {
            vaultsEndpoint: 'https://#/',
        },
        reaper: {
            linearPoolFactories: [
                '0x19968d4b7126904fd665ed25417599df9604df83',
                '0xe4b88e745dce9084b9fc2439f85a9a4c5cd6f361',
            ],
        },
        lido: {
            wstEthAprEndpoint: 'https://stake.lido.fi/api/steth-apr',
            wstEthContract: '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb',
        },
        overnight: {
            aprEndpoint: 'https://api.overnight.fi/optimism',
        },
        copper: {
            proxyAddress: '0x0000000000000000000000000000000000000000',
        },
        datastudio: {
            main: {
                user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
                sheetId: '1Ifbfh8njyssWKuLlUvlfXt-r3rnd4gAIP5sSM-lEuBU',
                databaseTabName: 'DatabaseOptimism v2',
                compositionTabName: 'Pool Composition Optimism v2',
                emissionDataTabName: 'EmissionData Optimism',
            },
            canary: {
                user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
                sheetId: '17bYDbQAdMwGevfJ7thiwI8mjYeZppVRi8gD8ER6CtSs',
                databaseTabName: 'DatabaseOptimism v2',
                compositionTabName: 'Pool Composition Optimism v2',
                emissionDataTabName: 'EmissionData Optimism',
            },
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
