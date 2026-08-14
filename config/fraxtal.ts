import { NetworkData } from './types';

export default <NetworkData>{
    chain: {
        slug: 'fraxtal',
        id: 252,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0xfc00000000000000000000000000000000000006',
        prismaId: 'FRAXTAL',
        gqlId: 'FRAXTAL',
    },
    subgraphs: {
        startDate: '2024-05-22',
        balancer: '',
        gauge: '',
        aura: 'https://data.aura.finance/graphql',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'frxETH',
        name: 'Frax Ether',
    },
    weth: {
        address: '0xfc00000000000000000000000000000000000006',
        addressFormatted: '0xFC00000000000000000000000000000000000006',
    },
    coingecko: {
        nativeAssetId: 'fraxtal',
        platformId: 'fraxtal',
        excludedTokenAddresses: [],
    },
    rpcUrl: 'https://rpc.frax.com/',
    rpcMaxBlockRange: 10000,
    acceptableSGLag: 30, // ~1min
    protocolToken: 'bal',
    bal: {
        address: '0x2fc7447f6cf71f9aa9e7ff8814b37e55b268ec91',
    },
    veBal: {
        address: '0x5cf4928a3205728bd12830e1840f7db85c62a4b9',
        bptAddress: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
        delegationProxy: '0xe3881627b8deebccf9c23b291430a549fc0be5f7',
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '0x4132f7acc9db7a6cf7be2dd3a9dc8b30c7e6e6c8',
        },
        v3: {
            vaultAddress: '',
            routerAddress: '',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
        },
    },
    aprHandlers: {
        ybAprHandler: {
            contract: {
                calls: [
                    {
                        name: 'maker sdai',
                        chain: 'MAINNET',
                        contract: '0x197e90f9fad81970ba7976f33cbd77088e5d7cf7',
                        abi: 'function dsr() view returns(uint256)',
                        functionName: 'dsr',
                        parser: (dsr) => (Number(dsr) * 10 ** -27 - 1) * 365 * 24 * 60 * 60,
                        token: '0x09eadcbaa812a4c076c3a6cde765dc4a22e0d775',
                    },
                ],
            },
            http: [
                {
                    url: 'https://api.frax.finance/v2/frxeth/summary/latest',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xfc00000000000000000000000000000000000005',
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
                            token: '0xfc00000000000000000000000000000000000008',
                            path: '$.items[0].sfraxApr',
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
            ],
        },
    },
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 2,
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
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
    stakingServices: ['gauge'],
    // workerJobs: [...deprecatedChainWorkerJobs, ...vebalWorkerJobs],
    workerJobs: [],
};
