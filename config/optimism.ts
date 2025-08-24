import { BigNumber } from 'ethers';
import { env } from '../apps/env';
import { DeploymentEnv, NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'optimism',
        id: 10,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x4200000000000000000000000000000000000006',
        prismaId: 'OPTIMISM',
        gqlId: 'OPTIMISM',
    },
    subgraphs: {
        startDate: '2022-01-01',
        balancer: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmWUgkiUM5c3BW1Z51DUkZfnyQfyfesE8p3BRnEtA9vyPL`,
        balancerV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmecD1yHQqmY11rx997C2e4TMP1EGCaX4shZ8AT959bo6Z`,
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmXyH5Q3fpkqcUVQCkU6rWZ7c9VSpAc38JWPp6zag2ER5X`,
        gauge: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/Qmdtj1ix1nUCRtSoiyF7a3oKMSvrKT8KTEFJdep53EHtRy`,
        aura: 'https://data.aura.finance/graphql',
    },
    hooks: {
        ['0xf39ca6ede9bf7820a952b52f3c94af526bab9015']: 'STABLE_SURGE',
        ['0x3630d26e51c03026f4f063d69d65f8e234eeaf5b']: 'MEV_TAX',
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
        excludedTokenAddresses: ['0x97513e975a7fa9072c72c92d8000b0db90b163c5'], //multibeets
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=optimism&dkey=${env.DRPC_BEETS_API_KEY}`
        : 'https://mainnet.optimism.io',
    rpcMaxBlockRange: 10000,
    acceptableSGLag: 30, // ~1min
    protocolToken: 'beets',
    beets: {
        address: '0xb4bc46bc6cb217b59ea8f4530bae26bf69f677f0',
    },
    bal: {
        address: '0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        delegationProxy: '0x9da18982a33fd0c7051b19f0d7c76f2d5e7e017c',
        bptAddress: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
    },
    gyro: {
        config: '0x32acb44fc929339b9f16f0449525cc590d2a23f3',
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '0xe39b5e3b6d74016b2f6a9673d7d7493b6df549d5',
        },
        v3: {
            vaultAddress: '0xba1333333333a1ba1108e8412f11850a5c319ba9',
            protocolFeeController: '0xcacc7e1efeea8bb3af6d5720d12c1876aa6ee76b',
            routerAddress: '0xe2fa4e1d17725e72dcdafe943ecf45df4b9e285b',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    multicall: '0x2dc0e2aa608532da689e89e237df582b783e552c',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    masterchef: {
        address: '0x0000000000000000000000000000000000000000',
        excludedFarmIds: [],
    },
    avgBlockSpeed: 1,
    aprHandlers: {
        ybAprHandler: {
            aave: [
                {
                    market: 'v3',
                    subgraphUrl: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/DSfLz8oQBUeU5atALgUFQKMTSYV9mZAVYp4noLSXAfvb`,
                    tokens: {
                        USDCe: {
                            underlyingAssetAddress: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
                            aTokenAddress: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
                            wrappedTokens: {
                                stataOptUSDC: '0x9f281eb58fd98ad98ede0fc4c553ad4d73e7ca2c',
                            },
                        },
                        USDCn: {
                            underlyingAssetAddress: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
                            aTokenAddress: '0x38d693ce1df5aadf7bc62595a37d667ad57922e5',
                            wrappedTokens: {
                                stataOptUSDCn: '0x4dd03dfd36548c840b563745e3fbec320f37ba7e',
                            },
                        },
                        USDT: {
                            underlyingAssetAddress: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
                            aTokenAddress: '0x6ab707aca953edaefbc4fd23ba73294241490620',
                            wrappedTokens: {
                                stataOptUSDT: '0x035c93db04e5aaea54e6cd0261c492a3e0638b37',
                            },
                        },
                    },
                },
            ],
            maker: {
                sdai: '0x2218a117083f5b482b0bb821d27056ba9c04b1d3',
            },
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
                            key: '0x5a7facb970d094b6c7ff1df0ea68d99e6e73cbff',
                            path: '$.data.rebaseEventLinkedLists[0].latest_aprs',
                        },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/46f3828a-cbf6-419e-8399-a83b905bf556',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0x5a7a183b6b44dc4ec2e3d2ef43f98c5152b1d76d',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    // To get the vaultId, get the vault address from the token contract(token.vault()),
                    // and search for the vault address in the link: https://api.beefy.finance/vaults
                    url: 'https://api.beefy.finance/apy/',
                    extractors: [
                        {
                            type: 'path',
                            key: '0xe5e9168b45a90c1e5730da6184cc5901c6e4353f',
                            path: '$.exactly-supply-usdc',
                        },
                        {
                            type: 'path',
                            key: '0x44b1cea4f597f493e2fd0833a9c04dfb1e479ef0',
                            path: '$.exactly-supply-eth',
                        },
                    ],
                },
                {
                    url: 'https://ctrl.yield.fi/t/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0x895e15020c3f52ddd4d8e9514eb83c39f53b1579',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb',
                            path: '$.data.smaApr',
                        },
                    ],
                },
                {
                    url: 'https://api.rocketpool.net/mainnet/reth/apr',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0x9bcef72be871e61ed4fbbc7630889bee758eb81d',
                            path: '$.yearlyAPR',
                        },
                    ],
                },
                {
                    url: 'https://api.frax.finance/v2/frxeth/summary/latest',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0x484c2d6e3cdd945a8b2df735e079178c1036578c',
                            path: '$.sfrxethApr',
                        },
                        {
                            type: 'path',
                            key: '0x3ec3849c33291a9ef4c5db86de593eb4a37fde45',
                            path: '$.sfrxethApr',
                        },
                    ],
                },
                {
                    url: 'https://api.frax.finance/v2/frax/sfrax/summary/history?range=1d',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0x5bff88ca1442c2496f7e475e9e7786383bc070c0',
                            path: '$.items[0].sfraxApr',
                        },
                        {
                            type: 'path',
                            key: '0x2dd1b4d4548accea497050619965f91f78b3b532',
                            path: '$.items[0].sfraxApr',
                        },
                    ],
                },
                {
                    url: 'https://api.staking.ankr.com/v1alpha/metrics',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0xe05a08226c49b636acf99c40da8dc6af83ce5bb3',
                            path: '$.services[?(@.serviceName=="eth")].apy',
                        },
                    ],
                },
                {
                    url: 'https://universe.kelpdao.xyz/rseth/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            key: '0x87eee96d50fb761ad85b1c982d28a042169d61b1',
                            path: '$.value',
                        },
                    ],
                },
                {
                    url: 'https://apy.prod.mountainprotocol.com',
                    extractors: [
                        {
                            type: 'path',
                            key: '0x57f5e098cad7a3d1eed53991d4d66c45c9af7812',
                            path: '$.value',
                        },
                    ],
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
