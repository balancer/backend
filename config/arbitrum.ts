import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

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
        balancer: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmPbjY6L1NhPjpBv7wDTfG9EPx5FpCuBqeg1XxByzBTLcs`,
        balancerV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmWYjRi4vSRZnf6wEAzYPvCYyS6rh4JnEbuYEDKHwKEuJw`,
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmRBz45HYxdqSti3zKRHtKpgsmMV84mki771G2svfRnbo6`,
        cowAmm: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmUDGSJXdMzG4ezDzf1LvXVb2igwY6rnaNFLC62ZJZ3Pbv`,
        gauge: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmT3h6pogdPkxfWsBxKNtpq7kR9fqKaQ9jGxe7fZx7MUVE`,
        aura: 'https://data.aura.finance/graphql',
    },
    hooks: {
        ['0x0fa0f9990d7969a7ae6f9961d663e4a201ed6417']: 'STABLE_SURGE',
        ['0x7c1b7a97bfacd39975de53e989a16c7bc4c78275']: 'STABLE_SURGE',
        ['0x5b42ec6d40f7b7965be5308c70e2603c0281c1e9']: 'MEV_TAX',
        ['0xd221affabdd3c1281ea14c5781dec6b0fca8937e']: 'AKRON',
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
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=arbitrum&dkey=${env.DRPC_API_KEY}`
        : 'https://1rpc.io/arb',
    rpcMaxBlockRange: 100000,
    acceptableSGLag: 240, // ~1min
    protocolToken: 'bal',
    bal: {
        address: '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        bptAddress: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
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
            vaultAddress: '0xba1333333333a1ba1108e8412f11850a5c319ba9',
            protocolFeeController: '0xa731c23d7c95436baaae9d52782f966e1ed07cc8',
            routerAddress: '0x0f08eef2c785aa5e7539684af04755dec1347b7c',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    multicall: '0x80c7dd17b01855a6d2347444a0fcc36136a314de',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 1,
    aprHandlers: {
        aaveRewardsAprHandler: true,
        ybAprHandler: {
            teth: {
                address: '0xd09acb80c1e8f2291862c4978a008791c9167003',
            },
            aave: [
                {
                    market: 'v3',
                    chain: 'ARBITRUM',
                    subgraphUrl: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/DLuE98kEb5pQNXAcKFQGQgfSQ57Xdou4jnVbAEqMfy3B`,
                },
            ],
            contract: {
                calls: [
                    {
                        chain: 'ARBITRUM',
                        contract: '0xbc404429558292ee2d769e57d57d6e74bbd2792d',
                        token: '0xbc404429558292ee2d769e57d57d6e74bbd2792d',
                        functionName: 'currentAPY',
                        abi: 'function currentAPY() view returns (uint256 _apy, uint256 _startTime, uint256 _endTime)',
                        parser: ([apy]) => Number((Number(apy) / 1e27 - 1).toFixed(6)),
                    },
                ],
            },
            http: [
                {
                    name: 'Varlamore USDC Growth',
                    url: 'https://app.silo.finance/api/earn',
                    body: JSON.stringify({
                        chainKeys: ['arbitrum'],
                        type: 'vault',
                        limit: 100,
                        offset: 0,
                    }),
                    scale: 1e18,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x2ba39e5388ac6c702cb29aea78d52aa66832f1ee',
                            path: '$.pools[?(@.vaultAddress=="0x2BA39e5388aC6C702Cb29AEA78d52aa66832f1ee")].supplyApr',
                        },
                    ],
                },
                {
                    name: 'eeUSDC',
                    url: 'https://indexer-main.euler.finance/v1/earn/vault?chainId=42161&vaultAddress=0xe4783824593a50Bfe9dc873204CEc171ebC62dE0',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xe4783824593a50Bfe9dc873204CEc171ebC62dE0',
                            path: '$.vault.apyCurrent',
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
                            token: '0x35751007a407ca6feffe80b3cb397736d2cf4dbe',
                            path: '$.data.rebaseEventLinkedLists[0].latest_aprs',
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
                            token: '0xf7d4e7273e5015c96728a6b02f31c505ee184603',
                            path: '$.data.osTokens[0].apy',
                        },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/46f3828a-cbf6-419e-8399-a83b905bf556',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x5a7a183b6b44dc4ec2e3d2ef43f98c5152b1d76d',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    url: 'https://api-platform-analytics.metastreet.xyz/v2/usdai/dashboard/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x0b2b2b2076d95dda7817e785989fe353fe955ef9',
                            path: '$',
                        },
                    ],
                },
                {
                    url: 'https://dinero.xyz/api/apr',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xcf6c2bb97a8978321c9e207afe8a2037fa9be45c',
                            path: '$.apxEth',
                        },
                    ],
                },
                {
                    url: 'https://ctrl.yield.fi/t/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x895e15020c3f52ddd4d8e9514eb83c39f53b1579',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://api.yield.fi/t/yusd/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x4772d2e014f9fc3a820c444e3313968e9a5c8121',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://apy.prod.mountainprotocol.com',
                    extractors: [
                        {
                            type: 'path',
                            token: '0x57f5e098cad7a3d1eed53991d4d66c45c9af7812',
                            path: '$.value',
                        },
                    ],
                },
                {
                    url: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x5979d7b546e38e414f7e9822514be443a4800529',
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
                            token: '0xec70dcb4a1efa46b8f2d97c310c9c4790ba5ffa8',
                            path: '$.yearlyAPR',
                        },
                    ],
                },
                {
                    url: 'https://api.exchange.coinbase.com/wrapped-assets/CBETH/',
                    extractors: [
                        {
                            type: 'path',
                            token: '0x1debd73e752beaf79865fd6446b0c970eae7732f',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://api.frax.finance/v2/frxeth/summary/latest',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x95ab45875cffdba1e5f451b950bc2e42c0053f39',
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
                            token: '0xe3b3fe7bca19ca77ad877a5bebab186becfad906',
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
                            token: '0xe05a08226c49b636acf99c40da8dc6af83ce5bb3',
                            path: '$.services[?(@.serviceName=="eth")].apy',
                        },
                    ],
                },
                // {
                //     url: 'https://www.plutusdao.io/api/getPlsRdntInfo',
                //     extractors: [
                //         {
                //             type: 'path',
                //             token: '0x6dbf2155b0636cb3fd5359fccefb8a2c02b6cb51',
                //             path: '$.apr',
                //         },
                //     ],
                // },
                {
                    url: 'https://app.renzoprotocol.com/api/apr',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x2416092f143378750bb29b79ed961ab195cceea5',
                            path: '$.apr',
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
                    url: 'https://kobe.mainnet.jito.network/api/v1/stake_pool_stats',
                    extractors: [
                        {
                            type: 'path',
                            token: '0x83e1d2310ade410676b1733d16e89f91822fd5c3',
                            path: '$.apy[0].data',
                        },
                    ],
                },
                {
                    url: 'https://universe.staderlabs.com/eth/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xed65c5085a18fa160af0313e60dcc7905e944dc7',
                            path: '$.value',
                        },
                    ],
                },
                {
                    url: 'https://backend-arbitrum.gains.trade/apr',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xd3443ee1e91af28e5fb858fbd0d72a63ba8046e0',
                            path: '$.collateralRewards[?(@.symbol=="USDC")].vaultApr',
                        },
                    ],
                },
                {
                    url: 'https://app.usdx.money/v1/base/apyInfo',
                    extractors: [
                        {
                            type: 'path',
                            token: '0x7788a3538c5fc7f9c7c8a74eac4c898fc8d87d92',
                            path: '$.result.susdxApy',
                        },
                    ],
                },
                {
                    url: 'https://universe.kelpdao.xyz/rseth/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x4186bfc76e2e237523cbc30fd220fe055156b41f',
                            path: '$.value',
                        },
                    ],
                },
            ],
        },
    },
    gyro: {
        config: '0x9b683ca24b0e013512e2566b68704dbe9677413c',
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
