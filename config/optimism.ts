import { BigNumber } from 'ethers';
import { env } from '../app/env';
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
        balancer: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-optimism-v2',
        beetsBar: 'https://',
        blocks: 'https://api.thegraph.com/subgraphs/name/danielmkm/optimism-blocks',
        gauge: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges-optimism',
        userBalances: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/user-bpt-balances-optimism',
        veBalLocks: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
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
    rpcUrl: env.INFURA_API_KEY
        ? `https://optimism-mainnet.infura.io/v3/${env.INFURA_API_KEY}`
        : 'https://mainnet.optimism.io',
    rpcMaxBlockRange: 2000,
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
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            routerAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
        },
    },
    multicall: '0x2dc0e2aa608532da689e89e237df582b783e552c',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    masterchef: {
        address: '0x0000000000000000000000000000000000000000',
        excludedFarmIds: [],
    },
    avgBlockSpeed: 1,
    sor: {
        env: {
            main: {
                url: 'https://nplks2oknz5lhxn6kpgxbfrxgm0hzicm.lambda-url.ca-central-1.on.aws/',
                maxPools: 8,
                forceRefresh: false,
                gasPrice: BigNumber.from(10),
                swapGas: BigNumber.from('1000000'),
            },
            canary: {
                url: 'https://svlitjilcr5qtp7iolimlrlg7e0ipupj.lambda-url.eu-central-1.on.aws/',
                maxPools: 8,
                forceRefresh: false,
                gasPrice: BigNumber.from(10),
                swapGas: BigNumber.from('1000000'),
            },
        },
    },
    ybAprConfig: {
        aave: {
            v3: {
                subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-optimism',
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
        },
        beefy: {
            sourceUrl: 'https://api.beefy.finance/apy/breakdown?_=',
            tokens: {
                wmooExactlySupplyUSDC: {
                    address: '0xe5e9168b45a90c1e5730da6184cc5901c6e4353f',
                    vaultId: 'exactly-supply-usdc',
                },
                wmooExactlySupplyETH: {
                    address: '0x44b1cea4f597f493e2fd0833a9c04dfb1e479ef0',
                    vaultId: 'exactly-supply-eth',
                },
                // To get the vaultId, get the vault address from the token contract(token.vault()),
                // and search for the vault address in the link: https://api.beefy.finance/vaults
            },
        },
        reaper: {
            subgraphSource: {
                subgraphUrl: 'https://api.thegraph.com/subgraphs/name/byte-masons/multi-strategy-vaults-optimism',
                tokens: {
                    rfUSDT: {
                        address: '0x51868bb8b71fb423b87129908fa039b880c8612d',
                    },
                    rfWETH: {
                        address: '0x1bad45e92dce078cf68c2141cd34f54a02c92806',
                    },
                    rfOP: {
                        address: '0xcecd29559a84e4d4f6467b36bbd4b9c3e6b89771',
                    },
                    rfwstETH: {
                        address: '0xb19f4d65882f6c103c332f0bc012354548e9ce0e',
                        isWstETH: true,
                    },
                    rfWBTC: {
                        address: '0xf6533b6fcb3f42d2fc91da7c379858ae6ebc7448',
                    },
                    rfDAI: {
                        address: '0xc0f5da4fb484ce6d8a6832819299f7cd0d15726e',
                    },
                    rfUSDC: {
                        address: '0x508734b52ba7e04ba068a2d4f67720ac1f63df47',
                    },
                },
            },
            onchainSource: {
                averageAPRAcrossLastNHarvests: 2,
                tokens: {
                    rfsoUSDC: {
                        address: '0x875456b73cbc58aa1be98dfe3b0459e0c0bf7b0e',
                    },
                    rfsoUSDT: {
                        address: '0x1e1bf73db9b278a95c9fe9205759956edea8b6ae',
                    },
                    rfsoDAI: {
                        address: '0x19ca00d242e96a30a1cad12f08c375caa989628f',
                    },
                    rfsoWBTC: {
                        address: '0x73e51b0368ef8bd0070b12dd992c54aa53bcb5f4',
                    },
                    rfsoWSTETH: {
                        address: '0x3573de618ae4a740fb24215d93f4483436fbb2b6',
                    },
                },
            },
        },
        defaultHandlers: {
            wstEth: {
                tokenAddress: '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb',
                sourceUrl: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                path: 'data.smaApr',
                isIbYield: true,
            },
            rETH: {
                tokenAddress: '0x9bcef72be871e61ed4fbbc7630889bee758eb81d',
                sourceUrl: 'https://rocketpool.net/api/mainnet/payload',
                path: 'rethAPR',
                isIbYield: true,
            },
            overnightDAIPlus: {
                tokenAddress: '0x0b8f31480249cc717081928b8af733f45f6915bb',
                sourceUrl: 'https://api.overnight.fi/optimism/dai+/fin-data/avg-apr/week',
                path: 'value',
                group: 'OVERNIGHT',
            },
            overnightUSDPlus: {
                tokenAddress: '0xa348700745d249c3b49d2c2acac9a5ae8155f826',
                sourceUrl: 'https://api.overnight.fi/optimism/usd+/fin-data/avg-apr/week',
                path: 'value',
                group: 'OVERNIGHT',
            },
            sfrxETH: {
                tokenAddress: '0x484c2d6e3cdd945a8b2df735e079178c1036578c',
                sourceUrl: 'https://api.frax.finance/v2/frxeth/summary/latest',
                path: 'sfrxethApr',
                isIbYield: true,
            },
            sFRAX: {
                tokenAddress: '0x2dd1b4d4548accea497050619965f91f78b3b532',
                sourceUrl: 'https://api.frax.finance/v2/frax/sfrax/summary/history?range=1d',
                path: 'items.0.sfraxApr',
                isIbYield: true,
            },
            stERN: {
                tokenAddress: '0x3ee6107d9c93955acbb3f39871d32b02f82b78ab',
                sourceUrl:
                    'https://2ch9hbg8hh.execute-api.us-east-1.amazonaws.com/dev/api/vault/0x3eE6107d9C93955acBb3f39871D32B02F82B78AB:0xa',
                path: 'data.yields.apy',
                scale: 1,
                isIbYield: true,
            },
            ankrETH: {
                tokenAddress: '0xe05a08226c49b636acf99c40da8dc6af83ce5bb3',
                sourceUrl: 'https://api.staking.ankr.com/v1alpha/metrics',
                path: 'services.{serviceName == "eth"}.apy',
                isIbYield: true,
            },
        },
    },
    beefy: {
        linearPools: [
            '0x5bdd8c19b44c3e4a15305601a2c9841bde9366f00000000000000000000000ca',
            '0x72d6df381cac8c2283c0b13fe5262a1f5e8e8d1b0000000000000000000000cb',
        ],
    },
    rocket: {
        rEthContract: '0x9bcef72be871e61ed4fbbc7630889bee758eb81d',
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
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
        },
    },
};
