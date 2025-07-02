import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'hyperevm',
        id: 999,
        nativeAssetAddress: '0x2222222222222222222222222222222222222222',
        wrappedNativeAssetAddress: '0x5555555555555555555555555555555555555555',
        prismaId: 'HYPEREVM',
        gqlId: 'HYPEREVM',
    },
    subgraphs: {
        startDate: '2025-06-18',
        balancer: ``,
        balancerV3: `https://api.goldsky.com/api/public/project_cmcigparivg3z01yhbv14ddl8/subgraphs/balancer-v3-hyperevm/latest/gn`,
        balancerPoolsV3: `https://api.goldsky.com/api/public/project_cmcigparivg3z01yhbv14ddl8/subgraphs/balancer-pools-v3-hyperevm/latest/gn`,
        gauge: ``,
    },
    hooks: {
        ['0x5dbad78818d4c8958eff2d5b95b28385a22113cd']: 'STABLE_SURGE',
        ['0x7ba29fe8e83dd6097a7298075c4affdbda3121cc']: 'MEV_TAX',
    },
    eth: {
        address: '0x2222222222222222222222222222222222222222',
        addressFormatted: '0x2222222222222222222222222222222222222222',
        symbol: 'HYPE',
        name: 'Hyperliquid',
    },
    weth: {
        address: '0x5555555555555555555555555555555555555555',
        addressFormatted: '0x5555555555555555555555555555555555555555',
    },
    coingecko: {
        nativeAssetId: 'hyperliquid',
        platformId: 'hyperliquid',
        excludedTokenAddresses: [],
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=hyperliquid&dkey=${env.DRPC_API_KEY}`
        : 'https://rpc.hyperliquid.xyz/evm',
    rpcMaxBlockRange: 25000,
    acceptableSGLag: 30, // ~1min
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
            routerAddress: '0xa8920455934da4d853faac1f94fe7bef72943ef1',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    aprHandlers: {
        ybAprHandler: {
            defaultHandlers: {
                siUSD: {
                    tokenAddress: '0xdbdc1ef57537e34680b898e1febd3d68c7389bcb',
                    sourceUrl: 'https://api.infinifi.xyz/api/protocol/data',
                    path: 'data.stats.siusd.lastWeekAPY',
                    scale: 1,
                },
            },
        },
    },
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
