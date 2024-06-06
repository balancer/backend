import { NetworkData } from '../modules/network/network-config-types';

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
        balancer:
            'https://api.goldsky.com/api/public/project_clwhu1vopoigi01wmbn514m1z/subgraphs/balancer-fraxtal-v2/1.0.0/gn',
        beetsBar: '',
        blocks: 'https://api.goldsky.com/api/public/project_clwhu1vopoigi01wmbn514m1z/subgraphs/fraxtal-blocks/1.0.0/gn',
        gauge: 'https://api.goldsky.com/api/public/project_clwhu1vopoigi01wmbn514m1z/subgraphs/balancer-gauges-fraxtal/1.0.0/gn',
        veBalLocks: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
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
    rpcMaxBlockRange: 5000,
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
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            routerAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
        },
    },
    ybAprConfig: {},
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
};
