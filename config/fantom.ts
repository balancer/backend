import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'fantom',
        id: 250,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
        prismaId: 'FANTOM',
        gqlId: 'FANTOM',
    },
    subgraphs: {
        startDate: '2021-10-08',
        balancer: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/Qme9r1RTFZ6hEZ4ebPSmo3J81FNHhjeNZs5nBaSGTzb2hb`,
        reliquary: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmQB4iZpeX9eYgLUaiBt2HwkobqE3NzVUiupXF6Ha9Nzbk`,
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
        excludedTokenAddresses: [
            '0x04068da6c83afcfa0e13ba15a6696662335d5b75', // multi usdc
            '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e', // multi usdt
            '0x049d68029688eabf473097a2fc38ef61633a3c7a', // multi dai
            '0x321162cd933e2be498cd2267a90534a804051b11', // multi wbtc
            '0x74b23882a30290451a17c44f4f05243b6b58c76d', // mutli weth
            '0xcfc785741dc0e98ad4c9f6394bb9d43cd1ef5179', // ankrftm
            '0xd67de0e0a0fd7b15dc8348bb9be742f3c5850454', // multi BNB
            '0x1e4f97b9f9f913c46f1632781732927b9019c68b', // multi CRV
            '0x511d35c52a3c244e7b8bd92c0c297755fbd89212', // multi AVAX
            '0x40df1ae6074c35047bff66675488aa2f9f6384f3', // multi matic
            '0x9fb9a33956351cf4fa040f65a13b835a3c8764e3', // multi multi
            '0xddcb3ffd12750b45d32e084887fdf1aabab34239', // multi any
            '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8', // multi link
            '0x468003b688943977e6130f4f68f23aad939a1040', // multi spell
            '0x10010078a54396f62c96df8532dc2b4847d47ed3', // multi hnd
            '0x6a07a792ab2965c72a5b8088d3a069a7ac3a993b', // multi aave
            '0x95dd59343a893637be1c3228060ee6afbf6f0730', // multi luna
            '0xae75a438b2e0cb8bb01ec1e1e376de11d44477cc', // multi sushi
            '0xddc0385169797937066bbd8ef409b5b3c0dfeb52', // multi wmemo
            '0xb67fa6defce4042070eb1ae1511dcd6dcc6a532e', // multi alusd
            '0xfb98b335551a418cd0737375a2ea0ded62ea213b', // multi mai
            '0x68aa691a8819b07988b18923f712f3f4c8d36346', // multi qi
            '0x29b0da86e484e1c0029b56e817912d778ac0ec69', // multi yfi
            '0xd6070ae98b8069de6b494332d1a1a81b6179d960', // multi bifi
            '0xe2d27f06f63d98b8e11b38b5b08a75d0c8dd62b9', // multi ust
            '0x9879abdea01a879644185341f7af7d8343556b7a', // multi tusd
            '0x3129662808bec728a27ab6a6b9afd3cbaca8a43c', // multi dola
            '0x0615dbba33fe61a31c7ed131bda6655ed76748b1', // multi ankr
            '0xb7c2ddb1ebac1056231ef22c1b0a13988537a274', // new tarot
        ],
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=fantom&dkey=${env.DRPC_BEETS_API_KEY}`
        : `https://rpc.ankr.com/fantom`,
    rpcMaxBlockRange: 10000,
    acceptableSGLag: 60, // ~1min
    protocolToken: 'beets',
    beets: {
        address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
    },
    balancer: {
        v2: {
            vaultAddress: '0x20dd72ed959b6147912c2e529f0a0c651c33c9ce',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.25',
            balancerQueriesAddress: '0x1b0a42663df1edea171cd8732d288a81efff6d23',
        },
        v3: {
            vaultAddress: '0x20dd72ed959b6147912c2e529f0a0c651c33c9ce',
            routerAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.25',
            defaultYieldFeePercentage: '0.25',
        },
    },
    multicall: '0x66335d7ad8011f6aa3f48aadcb523b62b38ed961',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    masterchef: {
        address: '0x8166994d9ebbe5829ec86bd81258149b87facfd3',
        excludedFarmIds: [
            '34', //OHM bonding farm
            '28', //OHM bonding farm
            '9', //old fidellio dueto (non fbeets)
            '98', //reliquary beets streaming farm
        ],
    },
    reliquary: {
        address: '0x1ed6411670c709f4e163854654bd52c74e66d7ec',
        excludedFarmIds: [
            '0', // test with dummy token
            '1', // test with fresh beets pool BPT
        ],
    },
    avgBlockSpeed: 1,
    aprHandlers: {},
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
