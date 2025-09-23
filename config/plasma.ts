import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'plasma',
        id: 9745,
        nativeAssetAddress: '0x2222222222222222222222222222222222222222',
        wrappedNativeAssetAddress: '0x5555555555555555555555555555555555555555',
        prismaId: 'PLASMA',
        gqlId: 'PLASMA',
    },
    subgraphs: {
        startDate: '2025-09-12',
        balancer: ``,
        balancerV3: `https://api.goldsky.com/api/public/project_cmcigparivg3z01yhbv14ddl8/subgraphs/balancer-v3-plasma/latest/gn`,
        balancerPoolsV3: `https://api.goldsky.com/api/public/project_cmcigparivg3z01yhbv14ddl8/subgraphs/balancer-pools-v3-plasma/latest/gn`,
        gauge: ``,
    },
    hooks: {},
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'XPL',
        name: 'Plasma',
    },
    weth: {
        address: '0x6100e367285b01f48d07953803a2d8dca5d19873',
        addressFormatted: '0x6100E367285b01F48D07953803A2d8dCA5D19873',
    },
    coingecko: {
        nativeAssetId: 'plasma',
        platformId: 'plasma',
        excludedTokenAddresses: [],
    },
    rpcUrl: 'https://rpc.plasma.to',
    rpcMaxBlockRange: 1000,
    acceptableSGLag: 30, // ~1min
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
            routerAddress: '0xa8920455934da4d853faac1f94fe7bef72943ef1',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    aprHandlers: {
        ybAprHandler: {
            http: [
                {
                    url: 'https://ded76165a2fb6f7887260a3a0f626de7.thegraph.chainnodes.org/subgraphs/name/etherfi/etherfi-subgraph-v0-8-2',
                    body: JSON.stringify({
                        query: `{
                      rebaseEventLinkedLists {
                        latest_aprs
                      }
                    }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    average: true,
                    scale: 10000,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xA3D68b74bF0528fdD07263c60d6488749044914b',
                            path: '$.data.rebaseEventLinkedLists[0].latest_aprs',
                        },
                    ],
                },
                {
                    url: 'https://ethena.fi/api/yields/protocol-and-staking-yield',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
                            path: '$.stakingYield.value',
                        },
                    ],
                },
            ],
            aaveV3: {
                chain: 'PLASMA',
            },
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
