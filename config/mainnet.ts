import { BigNumber } from 'ethers';
import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

const underlyingTokens = {
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    wETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    crvUSD: '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e',
    LUSD: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0',
    USDe: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3',
};

export default <NetworkData>{
    chain: {
        slug: 'ethereum',
        id: 1,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        prismaId: 'MAINNET',
        gqlId: 'MAINNET',
    },
    subgraphs: {
        startDate: '2019-04-20',
        cowAmm: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmQ3c9CTJBZdgy3uTLB929ARZucMUCf6piZBDxSgBKnf6m`,
        balancer: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmQ5TT2yYBZgoUxsat3bKmNe5Fr9LW9YAtDs8aeuc1BRhj`,
        balancerV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmNnNEjysGvpPqYDA9aQE1FjB2emtUXgSMiZ4ez11UdcaW`,
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmRsEi73GaatVxNYmfTfJSByX5DrxU5eTGScKPy6r4N2k1`,
        gauge: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmNrMRgSeUUkQsvhE6ExBEPETZ6P2jiJL3SzXftNQcAEcW`,
        aura: 'https://data.aura.finance/graphql',
    },
    hooks: {
        ['0xb18fa0cb5de8cecb8899aae6e38b1b7ed77885da']: 'STABLE_SURGE',
        ['0xbdbadc891bb95dee80ebc491699228ef0f7d6ff1']: 'STABLE_SURGE',
        ['0x1bca39b01f451b0a05d7030e6e6981a73b716b1c']: 'MEV_TAX',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ether',
    },
    weth: {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        addressFormatted: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    coingecko: {
        nativeAssetId: 'ethereum',
        platformId: 'ethereum',
        excludedTokenAddresses: [
            '0x04c154b66cb340f3ae24111cc767e0184ed00cc6', // pxETH, has Coingecko entry but no price
            '0xb45ad160634c528cc3d2926d9807104fa3157305', // sDOLA, has Coingecko entry but no price
        ],
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=ethereum&dkey=${env.DRPC_API_KEY}`
        : 'https://rpc.ankr.com/eth',
    rpcMaxBlockRange: 5000,
    acceptableSGLag: 5, // ~1min
    protocolToken: 'bal',
    bal: {
        address: '0xba100000625a3754423978a60c9317c58a424e3d',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        bptAddress: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
        delegationProxy: '0x0000000000000000000000000000000000000000',
    },
    gaugeControllerAddress: '0xc128468b7ce63ea702c1f104d55a2566b13d3abd',
    gaugeControllerHelperAddress: '0x8e5698dc4897dc12243c8642e77b4f21349db97c',
    gyro: {
        config: '0xac89cc9d78bbad7eb3a02601b4d65daa1f908aa6',
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            tokenAdmin: '0xf302f9f50958c5593770fdf4d4812309ff77414f',
            balancerQueriesAddress: '0xe39b5e3b6d74016b2f6a9673d7d7493b6df549d5',
        },
        v3: {
            vaultAddress: '0xba1333333333a1ba1108e8412f11850a5c319ba9',
            protocolFeeController: '0xa731c23d7c95436baaae9d52782f966e1ed07cc8',
            routerAddress: '0x5c6fb490bdfd3246eb0bb062c168decaf4bd9fdd',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    multicall: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 10,
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
    aprHandlers: {
        morphoRewardsAprHandler: true,
        aaveRewardsAprHandler: true,
        ybAprHandler: {
            aave: [
                {
                    market: 'v2',
                    subgraphUrl: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/8wR23o1zkS4gpLqLNU4kG3JHYVucqGyopL5utGxP2q1N`,
                    tokens: {
                        USDC: {
                            underlyingAssetAddress: underlyingTokens.USDC,
                            aTokenAddress: '0xbcca60bb61934080951369a648fb03df4f96263c',
                            wrappedTokens: {
                                waUSDC: '0xd093fa4fb80d09bb30817fdcd442d4d02ed3e5de',
                            },
                        },
                        USDT: {
                            underlyingAssetAddress: underlyingTokens.USDT,
                            aTokenAddress: '0x3ed3b47dd13ec9a98b44e6204a523e766b225811',
                            wrappedTokens: {
                                waUSDT: '0xf8fd466f12e236f4c96f7cce6c79eadb819abf58',
                            },
                        },
                        DAI: {
                            underlyingAssetAddress: underlyingTokens.DAI,
                            aTokenAddress: '0x028171bca77440897b824ca71d1c56cac55b68a3',
                            wrappedTokens: {
                                waDAI: '0x02d60b84491589974263d922d9cc7a3152618ef6',
                            },
                        },
                    },
                },
                {
                    market: 'v3',
                    subgraphUrl: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g`,
                    tokens: {
                        USDC: {
                            underlyingAssetAddress: underlyingTokens.USDC,
                            aTokenAddress: '0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c',
                            wrappedTokens: {
                                waUSDC: '0x57d20c946a7a3812a7225b881cdcd8431d23431c',
                                stataEthUSDC: '0x02c2d189b45ce213a40097b62d311cf0dd16ec92',
                                stataV2USDC: '0xd4fa2d31b7968e448877f69a96de69f5de8cd23e',
                            },
                        },
                        USDT: {
                            underlyingAssetAddress: underlyingTokens.USDT,
                            aTokenAddress: '0x23878914efe38d27c4d67ab83ed1b93a74d4086a',
                            wrappedTokens: {
                                waUSDT: '0xa7e0e66f38b8ad8343cff67118c1f33e827d1455',
                                stataEthUSDT: '0x65799b9fd4206cdaa4a1db79254fcbc2fd2ffee6',
                                stataEthUSDT2: '0x862c57d48becb45583aeba3f489696d22466ca1b',
                                stataV2USDT: '0x7bc3485026ac48b6cf9baf0a377477fff5703af8',
                            },
                        },
                        DAI: {
                            underlyingAssetAddress: underlyingTokens.DAI,
                            aTokenAddress: '0x018008bfb33d285247a21d44e50697654f754e63',
                            wrappedTokens: {
                                waDAI: '0x098256c06ab24f5655c5506a6488781bd711c14b',
                                stataEthDAI: '0xeb708639e8e518b86a916db3685f90216b1c1c67',
                            },
                        },
                        wETH: {
                            underlyingAssetAddress: underlyingTokens.wETH,
                            aTokenAddress: '0x4d5f47fa6a74757f35c14fd3a6ef8e3c9bc514e8',
                            wrappedTokens: {
                                waWETH: '0x59463bb67ddd04fe58ed291ba36c26d99a39fbc6',
                                stataEthWETH: '0x03928473f25bb2da6bc880b07ecbadc636822264',
                                stataV2WETH: '0x0bfc9d54fc184518a81162f8fb99c2eaca081202',
                            },
                        },
                        crvUSD: {
                            underlyingAssetAddress: underlyingTokens.crvUSD,
                            aTokenAddress: '0xb82fa9f31612989525992fcfbb09ab22eff5c85a',
                            wrappedTokens: {
                                stataEthcrvUSD: '0x848107491e029afde0ac543779c7790382f15929',
                            },
                        },
                        LUSD: {
                            underlyingAssetAddress: underlyingTokens.LUSD,
                            aTokenAddress: '0x3fe6a295459fae07df8a0cecc36f37160fe86aa9',
                            wrappedTokens: {
                                stataEthLUSD: '0xdbf5e36569798d1e39ee9d7b1c61a7409a74f23a',
                            },
                        },
                        USDe: {
                            underlyingAssetAddress: underlyingTokens.USDe,
                            aTokenAddress: '0x4f5923fc5fd4a93352581b38b7cd26943012decf',
                            wrappedTokens: {
                                stataEthUSDe: '0x5f9d59db355b4a60501544637b00e94082ca575b',
                            },
                        },
                        pyUSD: {
                            underlyingAssetAddress: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
                            aTokenAddress: '0x0c0d01abf3e6adfca0989ebba9d6e85dd58eab1e',
                            wrappedTokens: {
                                waEthPYUSD: '0xb51edddd8c47856d81c8681ea71404cec93e92c6',
                            },
                        },
                    },
                },
                {
                    market: 'lido',
                    subgraphUrl: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/5vxMbXRhG1oQr55MWC5j6qg78waWujx1wjeuEWDA6j3`,
                    tokens: {
                        LidoWETH: {
                            underlyingAssetAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                            aTokenAddress: '0xfa1fdbbd71b0aa16162d76914d69cd8cb3ef92da',
                            wrappedTokens: {
                                waEthLido: '0x0fe906e030a44ef24ca8c7dc7b7c53a6c4f00ce9',
                            },
                        },
                        LidoWSTETH: {
                            underlyingAssetAddress: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
                            aTokenAddress: '0xc035a7cf15375ce2706766804551791ad035e0c2',
                            wrappedTokens: {
                                waEthLidowstETH: '0x775f661b0bd1739349b9a2a3ef60be277c5d2d29',
                            },
                        },
                        LidoGHO: {
                            underlyingAssetAddress: '0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f',
                            aTokenAddress: '0x18efe565a5373f430e2f809b97de30335b3ad96a',
                            wrappedTokens: {
                                waEthLidoGHO: '0xc71ea051a5f82c67adcf634c36ffe6334793d24c',
                            },
                        },
                    },
                },
            ],
            http: [
                {
                    url: 'https://yields.llama.fi/chart/5a9c2073-2190-4002-9654-8c245d1e8534',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x6dc3ce9c57b20131347fdc9089d740daf6eb34c5',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/46f3828a-cbf6-419e-8399-a83b905bf556',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xf073bac22dab7faf4a3dd6c6189a70d54110525c',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/0aedb3f6-9298-49de-8bb0-2f611a4df784',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x1202f5c7b4b9e47a1a484e8b270be34dbbc75055',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/2ad8497d-c855-4840-85ad-cdc536b92ced',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x4956b52ae2ff65d74ca2d61207523288e4528f96',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/a8a2a14b-2345-4666-adab-227c991c4837',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x9fd7466f987fd4c45a5bbde22ed8aba5bc8d72d1',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    url: 'https://graphs.stakewise.io/mainnet/subgraphs/name/stakewise/prod',
                    body: JSON.stringify({
                        query: `{
                          osTokens {
                            apy
                          }
                        }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xf1c9acdc66974dfb6decb12aa385b9cd01190e38',
                            path: '$.data.osTokens[0].apy',
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
                            token: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
                            path: '$.data.rebaseEventLinkedLists[0].latest_aprs',
                        },
                    ],
                },
                {
                    name: 'usdl',
                    url: 'https://blue-api.morpho.org/graphql',
                    body: JSON.stringify({
                        query: `{
                        vault(id: "560b57bd-0e46-425f-9549-f3e38be0e1e6") {
                            asset {
                                yield {
                                    apr
                                }
                            }
                        }
                    }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    extractors: [
                        {
                            type: 'path',
                            token: '0x7751e2f4b8ae93ef6b79d86419d42fe3295a4559',
                            path: '$.data.vault.asset.yield.apr',
                        },
                    ],
                },
                {
                    url: 'https://blue-api.morpho.org/graphql',
                    body: JSON.stringify({
                        query: `{
                            vaults(first: 1000, where: { chainId_in: [1], apy_gte: 0.00001 }) {
                                items {
                                    address
                                    state {
                                        apy
                                        fee
                                        netApy
                                    }
                                }
                            }
                        }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    extractors: [
                        {
                            type: 'enumerate',
                            path: '$.data.vaults.items',
                            entries: (vault: any): [string, number] => [
                                vault.address.toLowerCase(),
                                vault.state.apy * (1 - vault.state.fee),
                            ],
                        },
                    ],
                },
                {
                    url: 'https://api.fluid.instad.app/v2/lending/1/tokens',
                    extractors: [
                        {
                            type: 'enumerate',
                            path: '$.data',
                            entries: (token: any): [string, number] => [
                                token.address.toLowerCase(),
                                parseFloat(token.supplyRate) / 10000,
                            ],
                        },
                    ],
                },
                {
                    url: 'https://gateway.yieldnest.finance/api/v1/graphql',
                    body: JSON.stringify({
                        query: `{
                      getApr {
                        apr7d
                      }
                    }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x09db87a538bd693e9d08544577d5ccfaa6373a48',
                            path: '$.data.getApr.apr7d',
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
                            token: '0x80ac24aa929eaf5013f6436cda2a7ba190f5cc0b',
                            path: '$.data.syrupGlobals.apy',
                        },
                    ],
                },
                {
                    url: 'https://api.infinifi.xyz/api/protocol/data',
                    extractors: [
                        {
                            type: 'path',
                            token: '0xdbdc1ef57537e34680b898e1febd3d68c7389bcb',
                            path: '$.data.stats.siusd.lastWeekAPY',
                        },
                    ],
                },
                {
                    url: 'https://prod-gw.openeden.com/sys/apy',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0xad55aebc9b8c03fc43cd9f62260391c13c23e7c0', path: '$.apy' }],
                },
                // {
                //     url: 'https://api-data.loopfi.xyz/api/getData',
                //     extractors: [
                //         { type: 'path', token: '0x3976d71e7ddfbab9bd120ec281b7d35fa0f28528', path: '$.loop.slpETHApr' },
                //         {
                //             type: 'path',
                //             token: '0xbfb53910c935e837c74e6c4ef584557352d20fde',
                //             path: '$.lpUSDLoop.slpUSDApr',
                //         }, // slpUSD too
                //     ],
                // },
                {
                    url: 'https://ctrl.yield.fi/t/apy',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0x1ce7d9942ff78c328a4181b9f3826fee6d845a97', path: '$.apy' }, // yUSD
                    ],
                },
                {
                    url: 'https://app.bedrock.technology/unieth/api/v1/e2ls/apy',
                    scale: 10000,
                    extractors: [
                        { type: 'path', token: '0xf1376bcef0f78459c0ed0ba5ddce976f1ddf51f4', path: '$.data.apy' }, // unieth
                    ],
                },
                {
                    url: 'https://dapi.bifrost.io/api/site',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0x4bc3263eb5bb2ef7ad9ab6fb68be80e43b43801f', path: '$.vETH.totalApy' },
                    ],
                },
                {
                    url: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', path: '$.data.smaApr' }, // stETH
                        { type: 'path', token: '0x5fd13359ba15a84b76f7f87568309040176167cd', path: '$.data.smaApr' }, // amphrETH
                        { type: 'path', token: '0x7a4effd87c2f3c55ca251080b1343b605f327e3a', path: '$.data.smaApr' }, // rstETH
                        { type: 'path', token: '0x84631c0d0081fde56deb72f6de77abbbf6a9f93a', path: '$.data.smaApr' }, // Re7LRT
                        { type: 'path', token: '0xbeef69ac7870777598a04b2bd4771c71212e6abc', path: '$.data.smaApr' }, // steakLRT
                        { type: 'path', token: '0xd9a442856c234a39a81a089c06451ebaa4306a72', path: '$.data.smaApr' }, // pufETH
                        { type: 'path', token: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', path: '$.data.smaApr' }, // wstETH
                        { type: 'path', token: '0x8e0789d39db454dbe9f4a77acef6dc7c69f6d552', path: '$.data.smaApr' }, // inwstETHs
                        { type: 'path', token: '0x5e362eb2c0706bd1d134689ec75176018385430b', path: '$.data.smaApr' }, // dvstETH
                    ],
                },
                {
                    url: 'https://api.exchange.coinbase.com/wrapped-assets/CBETH/',
                    extractors: [{ type: 'path', token: '0xbe9895146f7af43049ca1c1ae358b0541ea49704', path: '$.apy' }],
                },
                {
                    url: 'https://api.frax.finance/v2/frxeth/summary/latest',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0xac3e018457b222d93114458476f3e3416abbe38f', path: '$.sfrxethApr' },
                    ],
                },
                {
                    url: 'https://drop-api.stafi.io/reth/v1/poolData',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0x9559aaa82d9649c7a7b220e7c461d2e74c9a3593', path: '$.data.stakeApr' },
                    ],
                },
                {
                    url: 'https://api.rocketpool.net/mainnet/reth/apr',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0xae78736cd615f374d3085123a210448e74fc6393', path: '$.yearlyAPR' },
                    ],
                },
                {
                    url: 'https://data.jonesdao.io/api/v1/jones/apy-wjaura',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0x198d7387fa97a73f05b8578cdeff8f2a1f34cd1f', path: '$.wjauraApy' },
                    ],
                },
                {
                    url: 'https://universe.staderlabs.com/eth/apy',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0xa35b1b31ce002fbf2058d22f30f95d405200a15b', path: '$.value' },
                    ],
                },
                {
                    url: 'https://apy.prod.mountainprotocol.com',
                    extractors: [
                        { type: 'path', token: '0x57f5e098cad7a3d1eed53991d4d66c45c9af7812', path: '$.value' },
                    ],
                },
                {
                    url: 'https://api.staking.ankr.com/v1alpha/metrics',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xe95a203b1a91a908f9b9ce46459d101078c2c3cb',
                            path: '$.services[?(@.serviceName=="eth")].apy',
                        },
                    ],
                },
                {
                    url: 'https://app.renzoprotocol.com/api/apr',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0xbf5495efe5db9ce00f80364c8b423567e58d2110', path: '$.apr' }],
                },
                {
                    url: 'https://universe.kelpdao.xyz/rseth/apy',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0xa1290d69c65a6fe4df752f95823fae25cb99e5a7', path: '$.value' }, // rsETH
                        { type: 'path', token: '0xe1b4d34e8754600962cd944b535180bd758e6c2e', path: '$.value' }, // agETH
                    ],
                },
                {
                    url: 'https://universe.kelpdao.xyz/rseth/gainApy',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0xc824a08db624942c5e5f330d56530cd1598859fd', path: '$.hgETH' },
                    ],
                },
                {
                    url: 'https://www.inverse.finance/api/dola-staking',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0xb45ad160634c528cc3d2926d9807104fa3157305', path: '$.apr' }],
                },
                {
                    url: 'https://v3-lrt.svc.swellnetwork.io/api/tokens/rsweth/apr',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0xfae103dc9cf190ed75350761e95403b7b8afa6c0', path: '$' }],
                },
                {
                    url: 'https://ethena.fi/api/yields/protocol-and-staking-yield',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x9d39a5de30e57443bff2a8307a4256c8797a3497',
                            path: '$.stakingYield.value',
                        },
                    ],
                },
                {
                    url: 'https://api.crypto.com/pos/v1/public/get-staking-instruments',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ params: { country_code: 'POL' } }),
                    extractors: [
                        {
                            type: 'path',
                            token: '0xfe18ae03741a5b84e39c295ac9c856ed7991c38e',
                            path: '$.result.data[?(@.instrument_name=="ETH.staked")].est_rewards',
                        },
                    ],
                },
                {
                    url: 'https://api-deusd-prod-public.elixir.xyz/public/deusd_apy',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0x5c5b196abe0d54485975d1ec29617d42d9198326', path: '$.deusd_apy' },
                    ],
                },
                {
                    url: 'https://app.usdx.money/v1/base/apyInfo',
                    scale: 1,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x7788a3538c5fc7f9c7c8a74eac4c898fc8d87d92',
                            path: '$.result.susdxApy',
                        },
                    ],
                },
                {
                    url: 'https://usdn.api.smardex.io/v1/wusdn/apr',
                    extractors: [{ type: 'path', token: '0x99999999999999cc837c997b882957dafdcb1af9', path: '$' }],
                },
                {
                    url: 'https://info-sky.blockanalitica.com/api/v1/savings-rate/?format=json',
                    scale: 100,
                    extractors: [
                        { type: 'path', token: '0xa3931d71877c0e7a3148cb7eb4463524fec27fbd', path: '$[0].ssr_rate' },
                    ],
                },
            ],
            contract: {
                calls: [
                    {
                        name: 'maker sdai',
                        chain: 'MAINNET',
                        contract: '0x197e90f9fad81970ba7976f33cbd77088e5d7cf7',
                        abi: 'function dsr() view returns(uint256)',
                        functionName: 'dsr',
                        parser: (dsr) => (Number(dsr) * 10 ** -27 - 1) * 365 * 24 * 60 * 60,
                        token: '0x83f20f44975d03b1b09e64809b757c47f942beea',
                    },
                ],
            },
            teth: {
                address: '0xd11c452fc99cf405034ee446803b6f6c1f6d5ed8',
            },
        },
    },
    datastudio: {
        main: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '11anHUEb9snGwvB-errb5HvO8TvoLTRJhkDdD80Gxw1Q',
            databaseTabName: 'Database v2',
            compositionTabName: 'Pool Composition v2',
            emissionDataTabName: 'EmissionData',
        },
        canary: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '1HnJOuRQXGy06tNgqjYMzQNIsaCSCC01Yxe_lZhXBDpY',
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
