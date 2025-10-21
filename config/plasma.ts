import { AaveV3Plasma } from '@bgd-labs/aave-address-book';
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
    hooks: {
        ['0x6817149cb753bf529565b4d023d7507ed2ff4bc0']: 'STABLE_SURGE',
    },
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
            contract: {
                calls: [
                    {
                        name: 'gearbox usdt0 pool',
                        chain: 'PLASMA',
                        contract: '0x76309a9a56309104518847bba321c261b7b4a43f',
                        abi: 'function supplyRate() view returns(uint256)',
                        functionName: 'supplyRate',
                        parser: (rate) => Number(rate) * 10 ** -27,
                        token: '0x76309a9a56309104518847bba321c261b7b4a43f',
                    },
                ],
            },
            http: [
                {
                    url: 'https://app.avantprotocol.com/api/savusdApy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xa29420057f3e3b9512d4786df135da1674bd74d4',
                            path: '$.savusdApy',
                        },
                    ],
                },
                {
                    url: 'https://api.maple.finance/v2/graphql',
                    body: JSON.stringify({
                        query: `{
                          syrupGlobals {
                            apy
                          }
                        }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    scale: 1e30,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xc4374775489cb9c56003bf2c9b12495fc64f0771',
                            path: '$.data.syrupGlobals.apy',
                        },
                    ],
                },
                {
                    url: 'https://universe.kelpdao.xyz/rseth/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xe561fe05c39075312aa9bc6af79ddae981461359',
                            path: '$.value',
                        },
                    ],
                },
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
                            token: '0xa3d68b74bf0528fdd07263c60d6488749044914b',
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
                            token: '0x211cc4dd073734da055fbf44a2b4667d5e5fe5d2',
                            path: '$.stakingYield.value',
                        },
                    ],
                },
                {
                    url: 'https://api-v2.streamprotocol.money/vaults/xUSD/apy',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0x6eaf19b2fc24552925db245f9ff613157a7dbb4c', path: '$.apy' }],
                },
                {
                    url: 'https://api-platform-analytics.metastreet.xyz/v2/usdai/dashboard/apy',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0x0b2b2b2076d95dda7817e785989fe353fe955ef9', path: '$' }],
                },
                {
                    name: 'tcUSDT0',
                    url: 'https://indexer-main.euler.finance/v1/earn/vault?chainId=9745&vaultAddress=0xa9c251f8304b1b3fc2b9e8fcae78d94eff82ac66',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xa9c251f8304b1b3fc2b9e8fcae78d94eff82ac66',
                            path: '$.vault.apyCurrent',
                        },
                    ],
                },
                {
                    url: 'https://apr-api-plasma-earn.trevee.xyz/apy/current',
                    extractors: [
                        { type: 'path', token: '0x616185600989bf8339b58ac9e539d49536598343', path: '$.staking' },
                    ],
                },
            ],
            aave: {
                markets: [AaveV3Plasma],
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
