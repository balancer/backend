import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'monad',
        id: 143,
        nativeAssetAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        wrappedNativeAssetAddress: '0x3bd359c1119da7da1d913d1c4d2b7c461115433a',
        prismaId: 'MONAD',
        gqlId: 'MONAD',
    },
    subgraphs: {
        startDate: '2025-09-12',
        balancer: ``,
        balancerV3: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v3-vault-monad-smol/latest/gn`,
        balancerPoolsV3: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v3-pools-monad-smol/latest/gn`,
        gauge: ``,
    },
    hooks: {
        ['0x6817149cb753bf529565b4d023d7507ed2ff4bc0']: 'STABLE_SURGE',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'MON',
        name: 'MON',
    },
    weth: {
        address: '0x3bd359c1119da7da1d913d1c4d2b7c461115433a',
        addressFormatted: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
    },
    coingecko: {
        nativeAssetId: 'monad',
        platformId: 'monad',
        excludedTokenAddresses: [],
    },
    rpcUrl: env.DRPC_API_KEY ? `https://lb.drpc.live/monad-mainnet/${env.DRPC_API_KEY}` : 'https://rpc.monad.xyz',
    rpcMaxBlockRange: 1000,
    acceptableSGLag: 30,
    protocolToken: 'bal',
    balancer: {
        v2: {
            vaultAddress: '',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '',
        },
        v3: {
            vaultAddress: '0xba1333333333a1ba1108e8412f11850a5c319ba9',
            protocolFeeController: '0xcacc7e1efeea8bb3af6d5720d12c1876aa6ee76b',
            routerAddress: '0x9da18982a33fd0c7051b19f0d7c76f2d5e7e017c',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    aprHandlers: {
        ybAprHandler: {
            http: [
                {
                    url: 'https://defi-api.yuzu.money/proxy/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x484be0540ad49f351eaa04eeb35df0f937d4e73f',
                            path: '$.data.syzusd_apy',
                        },
                    ],
                },
                {
                    url: 'https://www.ether.fi/api/dapp/protocol/protocol-detail',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xa3d68b74bf0528fdd07263c60d6488749044914b',
                            path: '$.7_day_apr',
                        },
                    ],
                },
                {
                    url: 'https://api.rocketpool.net/mainnet/reth/apr',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xc50f2e735edd9dcd8ccd41ecfe9894e679e3195f',
                            path: '$.yearlyAPR',
                        },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/ee40513c-9356-4c53-9f26-446b484a8ae2',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x1b68626dca36c7fe922fd2d55e4f631d962de19c',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    name: 'gmon',
                    url: 'https://indexer.hyperindex.xyz/a7dd119/v1/graphql',
                    body: JSON.stringify({
                        query: `{
                            CoreVault_APY {
                                totalAPR
                            }
                        }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    scale: 10000,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x8498312a6b3cbd158bf0c93abdcf29e6e4f55081',
                            path: '$.data.CoreVault_APY[0].totalAPR',
                        },
                    ],
                },
                {
                    name: 'smon',
                    url: 'https://kintsu.xyz/api/public/apy',
                    extractors: [
                        {
                            type: 'path',
                            token: '0xa3227c5969757783154c60bf0bc1944180ed81b9',
                            path: '$.data[0].apy',
                        },
                    ],
                },
                {
                    name: 'wnWMON',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xdb39a9d4a1f1b4e93a5684d602207628ad60613c',
                            path: '$.reserves.0x3bd359c1119da7da1d913d1c4d2b7c461115433a.supply.baseAPY',
                        },
                    ],
                },
                {
                    name: 'wnloAZND',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    convert: async (baseAPY: number) => {
                        const res = await (await fetch('https://app.neverland.money/api/pool-apy')).json();
                        const externalAPY =
                            (res as any).reserves['0x9c82eb49b51f7dc61e22ff347931ca32adc6cd90'].supply.externalAPY /
                            100;
                        return baseAPY + externalAPY;
                    },
                    extractors: [
                        {
                            type: 'path',
                            token: '0xd786f7569c39a9f64e6a54eb77db21364e90f279',
                            path: '$.reserves.0x9c82eb49b51f7dc61e22ff347931ca32adc6cd90.supply.baseAPY',
                        },
                    ],
                },
                {
                    name: 'wnAUSD',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x82c370ba90e38ef6acd8b1b078d34fd86fc6bac9',
                            path: '$.reserves.0x00000000efe302beaa2b3e6e1b18d08d69a9012a.supply.baseAPY',
                        },
                    ],
                },
                {
                    name: 'wnUSDC',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x8d5c2df3eef09088fcccf3376d8ecd0dd505f642',
                            path: '$.reserves.0x754704bc059f8c67012fed69bc8a327a5aafb603.supply.baseAPY',
                        },
                    ],
                },
                {
                    name: 'wnwETH',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xb3b850ac62b89fe9f4efb652b516108a8aeb8848',
                            path: '$.reserves.0xee8c0e9f1bffb4eb878d8f15f368a02a35481242.supply.baseAPY',
                        },
                    ],
                },
                {
                    name: 'wnUSDT0',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x4e8aaecce10ad9394e96fe5f2bd4e587a7b04298',
                            path: '$.reserves.0xe7cd86e13ac4309349f30b3435a9d337750fc82d.supply.baseAPY',
                        },
                    ],
                },
                {
                    name: 'wnGMON',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x29d2075e5151b1a6863bdc40ea86bd5e8afd1705',
                            path: '$.reserves.0x8498312a6b3cbd158bf0c93abdcf29e6e4f55081.supply.baseAPY',
                        },
                    ],
                },
                {
                    name: 'wnSMON',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x08139339dd9a480ceb84d9c7cce48be436db20b3',
                            path: '$.reserves.0xa3227c5969757783154c60bf0bc1944180ed81b9.supply.baseAPY',
                        },
                    ],
                },
                {
                    name: 'wnSHMON',
                    url: 'https://app.neverland.money/api/pool-apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x5e073494678fb7fa4a05bb17d45941dd9dc469c1',
                            path: '$.reserves.0x1b68626dca36c7fe922fd2d55e4f631d962de19c.supply.baseAPY',
                        },
                    ],
                },
            ],
        },
    },
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 1,
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
        },
    },
};
