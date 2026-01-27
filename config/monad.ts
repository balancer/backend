import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'monad',
        id: 143,
        nativeAssetAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        wrappedNativeAssetAddress: '0x3bd359c1119da7da1d913d1c4d2b7c461115433a',
        prismaId: 'MONAD',
        gqlId: 'MONAD',
    },
    subgraphs: {
        startDate: '2025-09-12',
        balancer: ``,
        balancerV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmUjY6FNcecCopHx5sWWMqWCq6yKEXsB2DAPryyBuAYKnT`,
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmcJsNHBKWWBfF4ma8rMKjwBa1bwdsJdjvLEaKFzEdqP2q`,
        gauge: ``,
    },
    hooks: {
        ['0x6817149cb753bf529565b4d023d7507ed2ff4bc0']: 'STABLE_SURGE',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'MON',
        name: 'MON',
    },
    weth: {
        address: '0x3bd359c1119da7da1d913d1c4d2b7c461115433a',
        addressFormatted: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
    },
    coingecko: {
        nativeAssetId: 'monad',
        platformId: 'monad',
        excludedTokenAddresses: [],
    },
    rpcUrl: env.DRPC_API_KEY ? `https://lb.drpc.live/monad-mainnet/${env.DRPC_API_KEY}` : 'https://rpc.monad.xyz',
    rpcMaxBlockRange: 1000,
    acceptableSGLag: 30,
    protocolToken: 'bal',
    balancer: {
        v2: {
            vaultAddress: '',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '',
        },
        v3: {
            vaultAddress: '0xba1333333333a1ba1108e8412f11850a5c319ba9',
            protocolFeeController: '0xcacc7e1efeea8bb3af6d5720d12c1876aa6ee76b',
            routerAddress: '0x9da18982a33fd0c7051b19f0d7c76f2d5e7e017c',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    aprHandlers: {},
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 1,
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
        },
    },
};
