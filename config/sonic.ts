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
        balancer: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmW3NWk8gTu3d1uyfmb3FBK3WjXCbkukWk4bmx8Ad1ccEy`,
        balancerV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmSgCPJD4YNcwoEw9LoXtcGS6jiMTYmqz1h4Yor12kTjUG`,
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmddFGnsFRhucWWk7ozsqw72mtDcS84UoqB5a2s6Rb7q2o`,
        gauge: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmSRNzwTmLu55ZxxyxYULS5T1Kar7upz1jzL5FsMzLpB2e`,
        reliquary: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/QmUM8aU6H3gFx6JL65GQV5baPPjczU9hUb6VRiDQ1jEp3B`,
        sts: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_FANTOM}/deployments/id/Qmf7YfRPHCaSf6jeNbu8HUAWQ9Wba5ovk4HEPNaA8NTbvW`,
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
    rpcMaxBlockRange: 2000,
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
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    reliquary: {
        address: '0x973670ce19594f857a7cd85ee834c7a74a941684',
        excludedFarmIds: [],
    },
    avgBlockSpeed: 1,
    ybAprConfig: {
        sts: {
            token: '0xe5da20f15420ad15de0fa650600afc998bbe3955',
        },
        beefy: {
            sourceUrl: 'https://api.beefy.finance/apy/',
            tokens: {
                'silov2-usdc': {
                    address: '0x7870ddfd5aca4e977b2287e9a212bcbe8fc4135a',
                    vaultId: 'silov2-sonic-usdce-ws',
                    isIbYield: true,
                },
            },
        },
        silo: {
            markets: [
                '0x87178fe8698c7eda8aa207083c3d66aea569ab98', //solvbtc market 13
                '0x52fc9e0a68b6a4c9b57b9d1d99fb71449a99dcd8', // solvbtc.bbn market 13
                '0x016C306e103FbF48EC24810D078C65aD13c5f11B', // wS market 25
                '0x219656f33c58488d09d518badf50aa8cdcaca2aa', // wETH market 26
            ],
        },
        avalon: {
            solv: {
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
        },
        defaultHandlers: {
            wOS: {
                tokenAddress: '0x9f0df7799f6fdad409300080cff680f5a23df4b1',
                sourceUrl: 'https://api.originprotocol.com/api/v2/os/apr/trailing/7?146',
                path: 'apr',
                isIbYield: true,
            },
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
