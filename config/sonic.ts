import { AaveV3Sonic } from '@bgd-labs/aave-address-book';
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
        balancer: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v2-sonic-smol/latest/gn`,
        balancerV3: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v3-vault-sonic-smol/latest/gn`,
        balancerPoolsV3: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v3-pools-sonic-smol/latest/gn`,
        gauge: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/balancer-gauges-sonic/latest/gn`,
        reliquary: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/mabeets-sonic/latest/gn`,
        sts: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/staked-sonic/latest/gn`,
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
    rpcMaxBlockRange: 5000,
    acceptableSGLag: 150, // ~1min
    protocolToken: 'beets',
    beets: {
        address: '0x2d0e0814e62d80056181f5cd932274405966e4f0',
    },
    bal: {
        address: '0x0000000000000000000000000000000000000000',
    },
    sts: {
        address: '0xe5da20f15420ad15de0fa650600afc998bbe3955',
        validatorFee: 0.15,
        sfcAddress: '0xfc00face00000000000000000000000000000000',
        constantsManagerAddress: '0xc7262d6cd7d748df8577d29f1e03059ff62b62cc',
    },
    loops: {
        address: '0xc76995054ce51dfbbc954840d699b2f33d2538ee',
        aavePoolDataProvider: '0x9005a69fe088680827f292e8ae885be4be1beb2f',
        aavePoolAddressesProvider: '0x5c2e738f6e27bce0f7558051bf90605dd6176900',
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
    hooks: {
        ['0x8a83aa9bb7c4cff14ae0aecec0fb9ef234901c0c']: 'STABLE_SURGE',
        ['0x049919ae32e50aee5ea1a0998a841d175ec6f1b3']: 'STABLE_SURGE',
    },
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    reliquary: {
        address: '0x973670ce19594f857a7cd85ee834c7a74a941684',
        excludedFarmIds: [],
    },
    avgBlockSpeed: 1,
    aprHandlers: {
        maBeetsAprHandler: {
            beetsAddress: '0x2d0e0814e62d80056181f5cd932274405966e4f0',
        },
        ybAprHandler: {
            loops: {
                token: '0xc76995054ce51dfbbc954840d699b2f33d2538ee',
            },
            aave: {
                markets: [AaveV3Sonic],
            },
            sts: {
                token: '0xe5da20f15420ad15de0fa650600afc998bbe3955',
            },
            euler: {
                url: 'https://raw.githubusercontent.com/euler-xyz/euler-labels/refs/heads/master/146/products.json',
                lens: '0xc3a705ea6e339a53a7d301d3c5d7e6f499a9366a',
                chain: 'SONIC',
            },
            contract: {
                calls: [
                    '0x11ba70c0ebab7946ac84f0e6d79162b0cbb2693f', // usdc 36
                ].map((market) => ({
                    chain: 'SONIC',
                    contract: '0xb6adbb29f2d8ae731c7c72036a7fd5a7e970b198',
                    abi: 'function getDepositAPR(address) view returns (uint256)',
                    functionName: 'getDepositAPR',
                    parser: (getDepositAPR: bigint) => Number(getDepositAPR) * 10 ** -18,
                    token: market,
                    args: [market],
                })),
            },
            http: [
                {
                    url: 'https://api.beefy.finance/apy/',
                    extractors: [
                        {
                            type: 'path',
                            token: '0x7870ddfd5aca4e977b2287e9a212bcbe8fc4135a',
                            path: '$.silov2-sonic-usdce-ws',
                        },
                        { type: 'path', token: '0x871a101dcf22fe4fe37be7b654098c801cba1c88', path: '$.beefy-besonic' },
                    ],
                },
                {
                    url: 'https://yields.llama.fi/chart/104b3467-bba3-4923-851d-aa9e6ff47611',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x67a298e5b65db2b4616e05c3b455e017275f53cb',
                            path: '$.data[-1:].apyBase',
                        },
                    ],
                },
                {
                    url: 'https://api.originprotocol.com/api/v2/os/apr/trailing/7',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0x9f0df7799f6fdad409300080cff680f5a23df4b1', path: '$.apr' }],
                },
                // {
                //     url: 'https://be.angles.fi/api/v2/angles/apr/trailing/7',
                //     scale: 100,
                //     extractors: [{ type: 'path', token: '0xfa85fe5a8f5560e9039c04f2b0a90de1415abd70', path: '$.apy' }],
                // },
                // {
                //     url: 'https://locks-usd-api-sonic-earn.trevee.xyz/wrapper/apy',
                //     extractors: [{ type: 'path', token: '0x9fb76f7ce5fceaa2c42887ff441d46095e494206', path: '$.apy' }],
                // },
                // {
                //     url: 'https://locks-eth-api-sonic-earn.trevee.xyz/wrapper/apy',
                //     extractors: [{ type: 'path', token: '0xe8a41c62bb4d5863c6eadc96792cfe90a1f37c47', path: '$.apy' }],
                // },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0xded4ac8645619334186f28b8798e07ca354cfa0e',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', token: '0xded4ac8645619334186f28b8798e07ca354cfa0e', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0x592d1e187729c76efacc6dffb9355bd7bf47b2a7',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', token: '0x592d1e187729c76efacc6dffb9355bd7bf47b2a7', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0x92ebf5a1fb4061b45222a6d76accf4698bde4b95',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', token: '0x92ebf5a1fb4061b45222a6d76accf4698bde4b95', path: '$.supplyApr' },
                    ],
                },
                {
                    url: 'https://v2.silo.finance/api/detailed-vault/sonic-0x423a7a5709213dea0f0c2368e5fb16338c87bba7',
                    scale: 1e18,
                    extractors: [
                        { type: 'path', token: '0x423a7a5709213dea0f0c2368e5fb16338c87bba7', path: '$.supplyApr' },
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
