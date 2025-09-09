import { env } from '../apps/env';
import { DeploymentEnv, NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'avalanche',
        id: 43114,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        prismaId: 'AVALANCHE',
        gqlId: 'AVALANCHE',
    },
    subgraphs: {
        startDate: '2023-06-06',
        balancer: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmNudbtVu2eACfxNpFz37MVwKxxHPh1Lg5MzFKwQZG2xsU`,
        balancerV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmSj437ejL2f1pMP2r5E2m5GjhqJa3rmbvFD5kyscmq7u2`,
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmRYBxZjtduz4jTBvnYcEqriJRLnfswnCw81Gof941WRpk`,
        gauge: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmQYUD5riMQmA8yzJQjSFonEZxkA9PLEoaxpQVjQdnBPHM`,
        aura: 'https://data.aura.finance/graphql',
    },
    hooks: {
        ['0x86705ee19c0509ff68f1118c55ee2ebde383d122']: 'STABLE_SURGE',
        ['0x6ead84af26e997d27998fc9f8614e8a19bb93938']: 'MEV_TAX',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'AVAX',
        name: 'Avax',
    },
    weth: {
        address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        addressFormatted: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    },
    coingecko: {
        nativeAssetId: 'avalanche-2',
        platformId: 'avalanche',
        excludedTokenAddresses: [],
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=avalanche&dkey=${env.DRPC_API_KEY}`
        : 'https://rpc.ankr.com/avalanche',
    rpcMaxBlockRange: 10000,
    acceptableSGLag: 30, // ~1min
    protocolToken: 'bal',
    bal: {
        address: '0xe15bcb9e0ea69e6ab9fa080c4c4a5632896298c3',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        bptAddress: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
        delegationProxy: '0x0c6052254551eae3ecac77b01dfcf1025418828f',
    },
    gyro: {
        config: '0x8a5eb9a5b726583a213c7e4de2403d2dfd42c8a6',
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
            routerAddress: '0xf39ca6ede9bf7820a952b52f3c94af526bab9015',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 2,
    aprHandlers: {
        aaveRewardsAprHandler: true,
        ybAprHandler: {
            aave: [
                {
                    market: 'v3',
                    chain: 'AVALANCHE',
                    subgraphUrl: `https://gateway-arbitrum.network.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/subgraphs/id/2h9woxy8RTjHu1HJsCEnmzpPHFArU33avmUh4f71JpVn`,
                },
            ],
            euler: {
                url: 'https://raw.githubusercontent.com/euler-xyz/euler-labels/refs/heads/master/43114/vaults.json',
                lens: '0xc820c24905c210aefe21dae40723ec28d62c1544',
                chain: 'AVALANCHE',
            },
            http: [
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
                            token: '0xa3d68b74bf0528fdd07263c60d6488749044914b',
                            path: '$.data.rebaseEventLinkedLists[0].latest_aprs',
                        },
                    ],
                },
                {
                    url: 'https://api.xsy.fi/v1/yuty',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x580d5e1399157fd0d58218b7a514b60974f2ab01',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://api.benqi.fi/liquidstaking/apr',
                    extractors: [
                        {
                            type: 'path',
                            token: '0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be',
                            path: '$.apr',
                        },
                    ],
                },
                {
                    url: 'https://staging-api.yieldyak.com/yyavax',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xf7d9281e8e363584973f946201b82ba72c965d27',
                            path: '$.yyAVAX.apr',
                        },
                    ],
                },
                {
                    url: 'https://api.gogopool.com/metrics',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xa25eaf2906fa1a3a13edac9b9657108af7b703e3',
                            path: '$.ggavax_apy',
                        },
                    ],
                    // Updated from https://ceres.gogopool.com/ which used below calculation and scale -8.3333
                    // According to solarcurve, the AVAX Monthly Interest must be multiplied by -12 to represent the APR in normal scale, for example, if the monthly interest is -0,15, the APR would be -0,15 * -12 = 1,8%.
                    // @solarcurve: We estimate by multiplying that value by -12 since its the exchange rate of AVAX -> ggAVAX, which will always return less ggAVAX than AVAX
                    // How this -12 became -8,333? It's because the scale parameter is used to divide the number, and the final apr percentage is in decimal format (1,8% = 0,018), so if:
                    // M * -12 = A (M is monthly rate and A is APR) => (M/x) = (A/100) => (A / -12x) = (A / 100) [replacing M by A/-12] => x = 100/-12 = -8,33333
                },
                {
                    url: 'https://api.staking.ankr.com/v1alpha/metrics',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xc3344870d52688874b06d844e0c36cc39fc727f6',
                            path: '$.services[?(@.serviceName=="avax")].apy',
                        },
                    ],
                },
                {
                    url: 'https://api-deusd-prod-public.elixir.xyz/public/deusd_apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x68088c91446c7bea49ea7dbd3b96ce62b272dc96',
                            path: '$.deusd_apy',
                        },
                    ],
                },
                {
                    url: 'https://app.avantprotocol.com/api/savusdApy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x06d47f3fb376649c3a9dafe069b3d6e35572219e',
                            path: '$.savusdApy',
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
};
