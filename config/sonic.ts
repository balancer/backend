import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'sonic',
        id: 146,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
        prismaId: 'SONIC',
        gqlId: 'SONIC',
    },
    subgraphs: {
        startDate: '2024-12-12',
        balancer: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmPXaLKDvMMZdjD1ZuMpMSkRjKf8ALLVRtjUpTwWdKSvpQ`,
        balancerV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmUgRWkb5JUocGkVidpKtZFMHjexJzkBiSbjufURsXwn9X`,
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmVZrey68W5HEhth7PKim8Do9cZdP8WsEMFpBpDXccAo9G`,
        gauge: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmPvzExEGhqUYBB1oVLdQDXoHWUxuBJ8Sb3Dowx5qt5xze`,
        reliquary: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmUM8aU6H3gFx6JL65GQV5baPPjczU9hUb6VRiDQ1jEp3B`,
        sts: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmYmPEGqVZPyJKRah4NVbCYtxkHrXq3QzqBrnVQYBt15MU`,
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'S',
        name: 'Sonic',
    },
    weth: {
        address: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
        addressFormatted: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    },
    coingecko: {
        nativeAssetId: 'sonic',
        platformId: 'sonic-mainnet',
        excludedTokenAddresses: [],
    },
    rpcUrl: `https://lb.drpc.org/ogrpc?network=sonic&dkey=${env.DRPC_BEETS_API_KEY}`,
    rpcMaxBlockRange: 5000,
    acceptableSGLag: 150, // ~1min
    protocolToken: 'beets',
    beets: {
        address: '0x2d0e0814e62d80056181f5cd932274405966e4f0',
    },
    bal: {
        address: '0x0000000000000000000000000000000000000000',
    },
    sts: {
        address: '0xe5da20f15420ad15de0fa650600afc998bbe3955',
        baseAprUrl: 'https://apr.soniclabs.com/current',
        validatorFee: 0.15,
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.25',
            defaultYieldFeePercentage: '0.25',
            balancerQueriesAddress: '0x4b29db997ec0efdfef13baee2a2d7783bcf67f17',
        },
        v3: {
            vaultAddress: '0xba1333333333a1ba1108e8412f11850a5c319ba9',
            protocolFeeController: '0xa731c23d7c95436baaae9d52782f966e1ed07cc8',
            routerAddress: '0x6077b9801b5627a65a5eee70697c793751d1a71c',
            defaultSwapFeePercentage: '0.25',
            defaultYieldFeePercentage: '0.25',
        },
    },
    hooks: {
        ['0x8a83aa9bb7c4cff14ae0aecec0fb9ef234901c0c']: 'STABLE_SURGE',
        ['0x049919ae32e50aee5ea1a0998a841d175ec6f1b3']: 'STABLE_SURGE',
    },
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    reliquary: {
        address: '0x973670ce19594f857a7cd85ee834c7a74a941684',
        excludedFarmIds: [],
    },
    avgBlockSpeed: 1,
    aprHandlers: {
        maBeetsAprHandler: {
            beetsAddress: '0x2d0e0814e62d80056181f5cd932274405966e4f0',
        },
        ybAprHandler: {
            sts: {
                token: '0xe5da20f15420ad15de0fa650600afc998bbe3955',
            },
            euler: {
                url: 'https://raw.githubusercontent.com/euler-xyz/euler-labels/refs/heads/master/146/vaults.json',
                lens: '0xc3a705ea6e339a53a7d301d3c5d7e6f499a9366a',
                chain: 'SONIC',
            },
            silo: {
                markets: [
                    '0x87178fe8698c7eda8aa207083c3d66aea569ab98', //solvbtc market 13
                    '0x52fc9e0a68b6a4c9b57b9d1d99fb71449a99dcd8', // solvbtc.bbn market 13
                    '0x016c306e103fbf48ec24810d078c65ad13c5f11b', // wS market 25
                    '0x219656f33c58488d09d518badf50aa8cdcaca2aa', // wETH market 26
                    '0x5954ce6671d97d24b782920ddcdbb4b1e63ab2de', // usdc market 23
                    '0x6c49b18333a1135e9a376560c07e6d1fd0350eaf', // Ws market 28
                    '0xda14a41dbda731f03a94cb722191639dd22b35b2', // frxUSD market 37
                    '0x0a94e18bdbccd048198806d7ff28a1b1d2590724', // scbtc market 32
                    '0x42ce2234fd5a26bf161477a996961c4d01f466a3', // usdc 33
                    '0xe6605932e4a686534d19005bb9db0fba1f101272', // scusdc 46
                    '0x08c320a84a59c6f533e0dca655cf497594bca1f9', // weth 35
                    '0x24c74b30d1a4261608e84bf5a618693032681dac', // sceth 47
                    '0x11ba70c0ebab7946ac84f0e6d79162b0cbb2693f', // usdc 36
                ],
            },
            avalon: [
                {
                    subgraphUrl: `https://api.studio.thegraph.com/query/102993/avalon-defi-lending-v3/version/latest`,
                    tokens: {
                        SOLVBTC: {
                            underlyingAssetAddress: '0x541fd749419ca806a8bc7da8ac23d346f2df8b77',
                            aTokenAddress: '0x6c56ddccb3726faa089a5e9e29b712525cf916d7',
                            wrappedTokens: {
                                waSOLVBTC: '0xd31e89ffb929b38ba60d1c7dbeb68c7712eaab0a',
                            },
                        },
                        SOLVBTCBBN: {
                            underlyingAssetAddress: '0xcc0966d8418d412c599a6421b760a847eb169a8c',
                            aTokenAddress: '0xe3a97c4cc6725b96fb133c636d2e88cc3d6cfdbe',
                            wrappedTokens: {
                                waSOLVBTCBBN: '0xa28d4dbcc90c849e3249d642f356d85296a12954',
                            },
                        },
                    },
                },
            ],
            http: [
                {
                    url: 'https://api.beefy.finance/apy/',
                    extractors: [
                        {
                            type: 'path',
                            key: '0x7870ddfd5aca4e977b2287e9a212bcbe8fc4135a',
                            path: '$.silov2-sonic-usdce-ws',
                        },
                        { type: 'path', key: '0x871a101dcf22fe4fe37be7b654098c801cba1c88', path: '$.beefy-besonic' },
                    ],
                },
                {
                    url: 'https://api.goldsky.com/api/public/project_cmcccb4vz1nhh01x888di8lgk/subgraphs/mainstreet/0.0.1/gn',
                    body: JSON.stringify({
                        query: `{
                    smsUsdStats(id: "statsSmsUsd") {
                      apy
                    }
                  }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0xc7990369da608c2f4903715e3bd22f2970536c29',
                            path: '$.data.smsUsdStats.apy',
                        },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/104b3467-bba3-4923-851d-aa9e6ff47611',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0x67a298e5b65db2b4616e05c3b455e017275f53cb',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    url: 'https://api.originprotocol.com/api/v2/os/apr/trailing/7?146',
                    scale: 100,
                    extractors: [{ type: 'path', key: '0x9f0df7799f6fdad409300080cff680f5a23df4b1', path: '$.apr' }],
                },
                {
                    url: 'https://be.angles.fi/api/v2/angles/apr/trailing/7',
                    scale: 100,
                    extractors: [{ type: 'path', key: '0xfa85fe5a8f5560e9039c04f2b0a90de1415abd70', path: '$.apy' }],
                },
                {
                    url: 'https://usd-locks-api.rings.money/wrapper/apy',
                    extractors: [{ type: 'path', key: '0x9fb76f7ce5fceaa2c42887ff441d46095e494206', path: '$.apy' }],
                },
                {
                    url: 'https://eth-locks-api.rings.money/wrapper/apy',
                    extractors: [{ type: 'path', key: '0xe8a41c62bb4d5863c6eadc96792cfe90a1f37c47', path: '$.apy' }],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0xf6f87073cf8929c206a77b0694619dc776f89885',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', key: '0xf6f87073cf8929c206a77b0694619dc776f89885', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0xded4ac8645619334186f28b8798e07ca354cfa0e',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', key: '0xded4ac8645619334186f28b8798e07ca354cfa0e', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0xb6a23cb29e512df41876b28d7a848bd831f9c5ba',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', key: '0xb6a23cb29e512df41876b28d7a848bd831f9c5ba', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0x9a1bf5365edbb99c2c61ca6d9ffad0b705acfc6f',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', key: '0x9a1bf5365edbb99c2c61ca6d9ffad0b705acfc6f', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0x592d1e187729c76efacc6dffb9355bd7bf47b2a7',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', key: '0x592d1e187729c76efacc6dffb9355bd7bf47b2a7', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0x92ebf5a1fb4061b45222a6d76accf4698bde4b95',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', key: '0x92ebf5a1fb4061b45222a6d76accf4698bde4b95', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0xf6bc16b79c469b94cdd25f3e2334dd4fee47a581',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', key: '0xf6bc16b79c469b94cdd25f3e2334dd4fee47a581', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://api-v2.streamprotocol.money/vaults/xUSD/apy',
                    scale: 100,
                    extractors: [{ type: 'path', key: '0x6202b9f02e30e5e1c62cc01e4305450e5d83b926', path: '$.apy' }],
                },
            ],
        },
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
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
        },
    },
};
