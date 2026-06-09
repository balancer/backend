import { AaveV3Polygon } from '@bgd-labs/aave-address-book';
import { env } from '../apps/env';
import { NetworkData } from './types';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV2, vebalWorkerJobs, fxWorkerJobs } from './worker-jobs';

export default <NetworkData>{
    chain: {
        slug: 'polygon',
        id: 137,
        nativeAssetAddress: '0x0000000000000000000000000000000000001010',
        wrappedNativeAssetAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        prismaId: 'POLYGON',
        gqlId: 'POLYGON',
    },
    subgraphs: {
        startDate: '2021-06-16',
        balancer: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v2-polygon-smol/latest/gn`,
        gauge: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/balancer-gauges-polygon/latest/gn`,
        aura: 'https://data.aura.finance/graphql',
    },
    eth: {
        address: '0x0000000000000000000000000000000000001010',
        addressFormatted: '0x0000000000000000000000000000000000001010',
        symbol: 'POL',
        name: 'Polygon Token',
    },
    weth: {
        address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        addressFormatted: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    },
    coingecko: {
        nativeAssetId: 'matic',
        platformId: 'polygon-pos',
        excludedTokenAddresses: [],
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=polygon&dkey=${env.DRPC_API_KEY}`
        : 'https://1rpc.io/matic',
    rpcMaxBlockRange: 10000,
    acceptableSGLag: 30, // ~1min
    protocolToken: 'bal',
    bal: {
        address: '0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        bptAddress: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
        delegationProxy: '0x0f08eef2c785aa5e7539684af04755dec1347b7c',
    },
    gyro: {
        config: '0xfdc2e9e03f515804744a40d0f8d25c16e93fbe67',
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '0xe39b5e3b6d74016b2f6a9673d7d7493b6df549d5',
        },
        v3: {
            vaultAddress: '',
            routerAddress: '',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
        },
    },
    multicall: '0x275617327c958bd06b5d6b871e7f491d76113dd8',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 1,
    aprHandlers: {
        ybAprHandler: {
            aave: {
                markets: [AaveV3Polygon],
            },
            http: [
                {
                    url: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x03b54a6e9a984069379fae1a4fc4dbae93b3bccd',
                            path: '$.data.smaApr',
                        },
                    ],
                },
                {
                    url: 'https://universe.staderlabs.com/polygon/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xfa68fb4628dff1028cfec22b4162fccd0d45efb6',
                            path: '$.value',
                        },
                    ],
                },
                {
                    url: 'https://www.binance.com/bapi/earn/v1/public/pos/cftoken/project/rewardRateList?projectId=BETH',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xa2e3356610840701bdf5611a53974510ae27e2e1',
                            path: '$.data[0].rewardRate',
                        },
                    ],
                },
                {
                    url: 'https://api.trufin.io/staker/apy?staker=MATIC',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xf33687811f3ad0cd6b48dd4b39f9f977bd7165a2',
                            path: '$.apy',
                        },
                    ],
                },
            ],
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
    stakingServices: ['gauge'],
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV2, ...vebalWorkerJobs, ...fxWorkerJobs],
};
