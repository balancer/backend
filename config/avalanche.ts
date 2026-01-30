import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';
import { AaveV3Avalanche } from '@bgd-labs/aave-address-book';

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
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmPxfzF4eo5vcy887jjug4pP1dSdQ17eq6cWBvKisVEngz`,
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
            aave: {
                markets: [AaveV3Avalanche],
            },
            euler: {
                url: 'https://raw.githubusercontent.com/euler-xyz/euler-labels/refs/heads/master/43114/vaults.json',
                lens: '0xc820c24905c210aefe21dae40723ec28d62c1544',
                chain: 'AVALANCHE',
            },
            http: [
                {
                    name: 'MEV USDC',
                    url: 'https://app.silo.finance/api/earn',
                    body: JSON.stringify({
                        chainKeys: ['avalanche'],
                        type: 'vault',
                        limit: 100,
                        offset: 0,
                    }),
                    scale: 1e18,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x4dc1ce9b9f9ef00c144bfad305f16c62293dc0e8',
                            path: '$.pools[?(@.vaultAddress=="0x4dc1ce9b9f9EF00c144BfAD305f16c62293dC0E8")].supplyApr',
                        },
                    ],
                },
                {
                    name: 'MEV BTC',
                    url: 'https://app.silo.finance/api/earn',
                    body: JSON.stringify({
                        chainKeys: ['avalanche'],
                        type: 'vault',
                        limit: 100,
                        offset: 0,
                    }),
                    scale: 1e18,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x1f8e769b5b6010b2c2bbcd68629ea1a0a0eda7e3',
                            path: '$.pools[?(@.vaultAddress=="0x1f8E769B5B6010B2C2BBCd68629EA1a0a0Eda7E3")].supplyApr',
                        },
                    ],
                },
                {
                    name: 'Gami USDC',
                    url: 'https://app.silo.finance/api/earn',
                    body: JSON.stringify({
                        chainKeys: ['avalanche'],
                        type: 'vault',
                        limit: 100,
                        offset: 0,
                    }),
                    scale: 1e18,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x1f0570a081fee0e4df6eac470f9d2d53cdeda1c5',
                            path: '$.pools[?(@.vaultAddress=="0x1F0570a081FeE0e4dF6eAC470f9d2D53CDEDa1c5")].supplyApr',
                        },
                    ],
                },
                {
                    url: 'https://www.ether.fi/api/dapp/protocol/protocol-detail',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xa3d68b74bf0528fdd07263c60d6488749044914b',
                            path: '$.7_day_apr',
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
                    url: 'https://protocol-api.treehouse.finance/protocol_mey',
                    scale: 100,
                    convert: async (val: number) => {
                        const benqi = (
                            (await (await fetch('https://api.benqi.fi/liquidstaking/apr')).json()) as { apr: number }
                        ).apr;

                        return benqi + val;
                    },
                    extractors: [
                        {
                            type: 'path',
                            token: '0x14a84f1a61ccd7d1be596a6cc11fe33a36bc1646',
                            path: '$[?(@.tasset=="tAVAX")].sma_mey',
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
                {
                    url: 'https://api-v2.streamprotocol.money/vaults/xUSD/apy',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0x94f9bb5c972285728dcee7eaece48bec2ff341ce', path: '$.apy' }],
                },
                {
                    url: 'https://api-v2.streamprotocol.money/vaults/xBTC/apy',
                    scale: 100,
                    extractors: [{ type: 'path', token: '0x6eaf19b2fc24552925db245f9ff613157a7dbb4c', path: '$.apy' }],
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
