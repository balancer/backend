import { AaveV3Plasma } from '@bgd-labs/aave-address-book';
import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'xlayer',
        id: 196,
        nativeAssetAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        wrappedNativeAssetAddress: '0xe538905cf8410324e03a5a23c1c177a474d59b2b',
        prismaId: 'XLAYER',
        gqlId: 'XLAYER',
    },
    subgraphs: {
        startDate: '2025-10-30',
        balancer: ``,
        balancerV3: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v3-vault-xlayer-smol/latest/gn`,
        balancerPoolsV3: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v3-pools-xlayer-smol/latest/gn`,
        gauge: ``,
    },
    hooks: {
        ['0xa523f47a933d5020b23629ddf689695aa94612dc']: 'STABLE_SURGE',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'OKB',
        name: 'OKB',
    },
    weth: {
        address: '0xe538905cf8410324e03a5a23c1c177a474d59b2b',
        addressFormatted: '0xe538905cf8410324e03A5A23C1c177a474D59b2b',
    },
    coingecko: {
        nativeAssetId: 'okb',
        platformId: 'x-layer',
        excludedTokenAddresses: [],
    },
    rpcUrl: 'https://rpc.xlayer.tech',
    rpcMaxBlockRange: 100,
    acceptableSGLag: 90,
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
            routerAddress: '0xc3ccace87f6d3a81724075adcb5ddd85a8a1bb68',
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
