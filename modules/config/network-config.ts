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
        masterchef?: string;
        reliquary?: string;
        beetsBar?: string;
        gauge?: string;
        userBalances: string;
    };
    sanity: {
        projectId: string;
        dataset: string;
    };
    beets: {
        address: string;
    };
    fbeets?: {
        address: string;
        farmId: string;
        reliquaryFarmPid: number;
        poolId: string;
        poolIdV2: string;
        poolAddress: string;
        poolAddressV2: string;
    };
    bal: {
        address: string;
    };
    balancer: {
        vault: string;
        weightedPoolV2Factories: string[];
        composableStablePoolFactories: string[];
        poolsInRecoveryMode: string[];
        yieldProtocolFeePercentage: number;
        swapProtocolFeePercentage: number;
    };
    multicall: string;
    masterchef: {
        address: string;
        excludedFarmIds: string[];
    };
    reliquary?: {
        address: string;
    };
    copper?: {
        proxyAddress: string;
    };
    reaper: {
        linearPoolFactories: string[];
        averageAPRAcrossLastNHarvests: number;
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
            masterchef: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/masterchefv2',
            reliquary: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/reliquary',
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
            reliquaryFarmPid: 1,
            poolId: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
            poolIdV2: '0x9e4341acef4147196e99d648c5e43b3fc9d026780002000000000000000005ec',
            poolAddress: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837',
            poolAddressV2: '0x9e4341acef4147196e99d648c5e43b3fc9d02678',
        },
        bal: {
            address: '',
        },
        balancer: {
            vault: '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce',
            composableStablePoolFactories: [
                '0x5AdAF6509BCEc3219455348AC45d6D3261b1A990',
                '0xB384A86F2Fd7788720db42f9daa60fc07EcBeA06',
                '0x44814E3A603bb7F1198617995c5696C232F6e8Ed',
            ],
            weightedPoolV2Factories: [
                '0xB2ED595Afc445b47Db7043bEC25e772bf0FA1fbb',
                '0x8ea1c497c16726E097f62C8C9FBD944143F27090',
                '0xea87F3dFfc679035653C0FBa70e7bfe46E3FB733',
            ],
            poolsInRecoveryMode: [''],
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
                '98', //reliquary beets streaming farm
            ],
        },
        reliquary: {
            address: '0x1ed6411670c709F4e163854654BD52c74E66D7eC',
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
            averageAPRAcrossLastNHarvests: 5,
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
        bal: {
            address: '0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921',
        },
        balancer: {
            vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
            composableStablePoolFactories: ['0xf145caFB67081895EE80eB7c04A30Cf87f07b745'],
            weightedPoolV2Factories: ['0xad901309d9e9DbC5Df19c84f729f429F0189a633'],
            poolsInRecoveryMode: [
                '0x05e7732bf9ae5592e6aa05afe8cd80f7ab0a7bea',
                '0x359ea8618c405023fc4b98dab1b01f373792a126',
                '0x3fdb6fb126521a28f06893f9629da12f7b7266eb',
                '0x435272180a4125f3b47c92826f482fc6cc165958',
                '0x785f08fb77ec934c01736e30546f87b4daccbe50',
                '0x899f737750db562b88c1e412ee1902980d3a4844',
                '0x981fb05b738e981ac532a99e77170ecb4bc27aef',
                '0xb0de49429fbb80c635432bbad0b3965b28560177',
                '0xc77e5645dbe48d54afc06655e39d3fe17eb76c1c',
                '0xe0b50b0635b90f7021d2618f76ab9a31b92d0094',
                '0xf30db0ca4605e5115df91b56bd299564dca02666',
                '0x1f131ec1175f023ee1534b16fa8ab237c00e2381',
                '0x428e1cc3099cf461b87d124957a0d48273f334b1',
                '0x479a7d1fcdd71ce0c2ed3184bfbe9d23b92e8337',
                '0x593acbfb1eaf3b6ec86fa60325d816996fdcbc0d',
                '0x6222ae1d2a9f6894da50aa25cb7b303497f9bebd',
                '0x62de5ca16a618e22f6dfe5315ebd31acb10c44b6',
                '0x7d6bff131b359da66d92f215fd4e186003bfaa42',
                '0x96a78983932b8739d1117b16d30c15607926b0c5',
                '0x9964b1bd3cc530e5c58ba564e45d45290f677be2',
                '0xb0f2c34b9cd5c377c5efbba3b31e67114810cbc8',
                '0xb1c9ac57594e9b1ec0f3787d9f6744ef4cb0a024',
                '0xde45f101250f2ca1c0f8adfc172576d10c12072d',
                '0xf572649606db4743d217a2fa6e8b8eb79742c24a',
                '0x373b347bc87998b151a5e9b6bb6ca692b766648a',
            ],
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
            averageAPRAcrossLastNHarvests: 2,
        },
        lido: {
            wstEthAprEndpoint: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
            wstEthContract: '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb',
        },
        overnight: {
            aprEndpoint: 'https://api.overnight.fi/optimism',
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
};

export const networkConfig = AllNetworkConfigs[env.CHAIN_ID];

export function isFantomNetwork() {
    return env.CHAIN_ID === '250';
}

export function isOptimismNetwork() {
    return env.CHAIN_ID === '10';
}
