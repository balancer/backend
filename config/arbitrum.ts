import { env } from '../app/env';
import { DeploymentEnv, NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'arbitrum',
        id: 42161,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        prismaId: 'ARBITRUM',
        gqlId: 'ARBITRUM',
    },
    subgraphs: {
        startDate: '2021-08-23',
        balancer: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-arbitrum-v2',
        beetsBar: 'https://',
        blocks: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-one-blocks',
        gauge: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges-arbitrum',
        veBalLocks: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
        userBalances: 'https://',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ether',
    },
    weth: {
        address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        addressFormatted: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
    coingecko: {
        nativeAssetId: 'ethereum',
        platformId: 'arbitrum-one',
        excludedTokenAddresses: ['0x6dbf2155b0636cb3fd5359fccefb8a2c02b6cb51'], // plsRDNT, has coingecko entry but no price
    },
    rpcUrl:
        env.INFURA_API_KEY && (env.DEPLOYMENT_ENV as DeploymentEnv) === 'main'
            ? `https://arbitrum-mainnet.infura.io/v3/${env.INFURA_API_KEY}`
            : env.ALCHEMY_API_KEY
            ? `https://arb-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`
            : 'https://1rpc.io/arb',
    rpcMaxBlockRange: 2000,
    protocolToken: 'bal',
    bal: {
        address: '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        delegationProxy: '0x81cfae226343b24ba12ec6521db2c79e7aeeb310',
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '0xe39b5e3b6d74016b2f6a9673d7d7493b6df549d5',
        },
        v3: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
        },
    },
    multicall: '0x80c7dd17b01855a6d2347444a0fcc36136a314de',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 1,
    ybAprConfig: {
        aave: {
            v3: {
                subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum',
                tokens: {
                    USDC: {
                        underlyingAssetAddress: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
                        aTokenAddress: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
                        wrappedTokens: {
                            waUSDC: '0xe719aef17468c7e10c0c205be62c990754dff7e5',
                            stataArbUSDC: '0x3a301e7917689b8e8a19498b8a28fc912583490c',
                            stataArbUSDCn: '0xbde67e089886ec0e615d6f054bc6f746189a3d56',
                        },
                    },
                    USDT: {
                        underlyingAssetAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
                        aTokenAddress: '0x6ab707aca953edaefbc4fd23ba73294241490620',
                        wrappedTokens: {
                            waUSDT: '0x3c7680dfe7f732ca0279c39ff30fe2eafdae49db',
                            stataArbUSDT: '0x8b5541b773dd781852940490b0c3dc1a8cdb6a87',
                        },
                    },
                    DAI: {
                        underlyingAssetAddress: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
                        aTokenAddress: '0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee',
                        wrappedTokens: {
                            waDAI: '0x345a864ac644c82c2d649491c905c71f240700b2',
                            stataArbDAI: '0x426e8778bf7f54b0e4fc703dcca6f26a4e5b71de',
                        },
                    },
                    wETH: {
                        underlyingAssetAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                        aTokenAddress: '0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8',
                        wrappedTokens: {
                            waWETH: '0x18c100415988bef4354effad1188d1c22041b046',
                            stataArbWETH: '0x18468b6eba332285c6d9bb03fe7fb52e108c4596',
                        },
                    },
                },
            },
        },
        reaper: {
            onchainSource: {
                averageAPRAcrossLastNHarvests: 5,
                tokens: {
                    rfGrainDAI: {
                        address: '0x12f256109e744081f633a827be80e06d97ff7447',
                    },
                    rfGrainUSDT: {
                        address: '0x0179bac7493a92ac812730a4c64a0b41b7ea0ecf',
                    },
                    rfGrainUSDC: {
                        address: '0xaeacf641a0342330ec681b57c0a6af0b71d5cbff',
                    },
                },
            },
        },
        defaultHandlers: {
            wstETH: {
                tokenAddress: '0x5979d7b546e38e414f7e9822514be443a4800529',
                sourceUrl: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                path: 'data.smaApr',
                isIbYield: true,
            },
            rETH: {
                tokenAddress: '0xec70dcb4a1efa46b8f2d97c310c9c4790ba5ffa8',
                sourceUrl: 'https://rocketpool.net/api/mainnet/payload',
                path: 'rethAPR',
                isIbYield: true,
            },
            cbETH: {
                tokenAddress: '0x1debd73e752beaf79865fd6446b0c970eae7732f',
                sourceUrl: 'https://api.exchange.coinbase.com/wrapped-assets/CBETH/',
                path: 'apy',
                scale: 1,
            },
            sfrxETH: {
                tokenAddress: '0x95ab45875cffdba1e5f451b950bc2e42c0053f39',
                sourceUrl: 'https://api.frax.finance/v2/frxeth/summary/latest',
                path: 'sfrxethApr',
                isIbYield: true,
            },
            sFRAX: {
                tokenAddress: '0xe3b3fe7bca19ca77ad877a5bebab186becfad906',
                sourceUrl: 'https://api.frax.finance/v2/frax/sfrax/summary/history?range=1d',
                path: 'items.0.sfraxApr',
                isIbYield: true,
            },
            ankrETH: {
                tokenAddress: '0xe05a08226c49b636acf99c40da8dc6af83ce5bb3',
                sourceUrl: 'https://api.staking.ankr.com/v1alpha/metrics',
                path: 'services.{serviceName == "eth"}.apy',
                isIbYield: true,
            },
            plsRDNT: {
                tokenAddress: '0x6dbf2155b0636cb3fd5359fccefb8a2c02b6cb51',
                sourceUrl: 'https://www.plutusdao.io/api/getPlsRdntInfo',
                path: 'apr',
                scale: 10000,
                isIbYield: true,
            },
        },
    },
    beefy: {
        linearPools: [''],
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
