import { AaveV3Base } from '@bgd-labs/aave-address-book';
import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'base',
        id: 8453,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x4200000000000000000000000000000000000006',
        prismaId: 'BASE',
        gqlId: 'BASE',
    },
    subgraphs: {
        startDate: '2023-07-10',
        balancer: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/v2-base-smol/latest/gn`,
        balancerV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmXs2bcH91cbcC8Sz7qW8SFWpDRWbDvZzsz6RmAX5wgxj3`,
        balancerPoolsV3: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmcjhEzoEeNFs4QCEyfPgNXASAR8YdckuS2jNieMBwzv2w`,
        cowAmm: `https://gateway.thegraph.com/api/${env.THEGRAPH_API_KEY_BALANCER}/deployments/id/QmVRCjhFz7XXJoeJ5t4FdysN2JaBVdUCvpTVoMzXRNjA87`,
        gauge: `https://api.subgraph.ormilabs.com/api/public/717cf785-de57-4761-94dd-9ac51b019902/subgraphs/balancer-gauges-base/latest/gn`,
        aura: 'https://data.aura.finance/graphql',
    },
    hooks: {
        ['0xb2007b8b7e0260042517f635cfd8e6dd2dd7f007']: 'STABLE_SURGE',
        ['0xdb8d758bcb971e482b2c45f7f8a7740283a1bd3a']: 'STABLE_SURGE',
        ['0x97b05bafb3c592089d382ba7cfa7abb9d85f599e']: 'UNKNOWN',
        ['0xa64cde229697d500ecaceb0611d603ad21fe4ce5']: 'UNKNOWN',
        ['0x7a2535f5fb47b8e44c02ef5d9990588313fe8f05']: 'MEV_TAX',
        ['0xa45570815dbe7bf7010c41f1f74479be322d02bd']: 'AKRON',
    },
    gyro: {
        config: '0x8a5eb9a5b726583a213c7e4de2403d2dfd42c8a6',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ether',
    },
    weth: {
        address: '0x4200000000000000000000000000000000000006',
        addressFormatted: '0x4200000000000000000000000000000000000006',
    },
    coingecko: {
        nativeAssetId: 'ethereum',
        platformId: 'base',
        excludedTokenAddresses: [],
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=base&dkey=${env.DRPC_API_KEY}`
        : 'https://base.gateway.tenderly.co/7mM7DbBouY1JjnQd9MMDsd',
    rpcMaxBlockRange: 25000,
    acceptableSGLag: 30, // ~1min
    protocolToken: 'bal',
    bal: {
        address: '0x4158734d47fc9692176b5085e0f52ee0da5d47f1',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        bptAddress: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
        delegationProxy: '0xd87f44df0159dc78029ab9ca7d7e57e7249f5acd',
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '0x300ab2038eac391f26d9f895dc61f8f66a548833',
        },
        v3: {
            vaultAddress: '0xba1333333333a1ba1108e8412f11850a5c319ba9',
            protocolFeeController: '0xa731c23d7c95436baaae9d52782f966e1ed07cc8',
            routerAddress: '0x76578ecf9a141296ec657847fb45b0585bcda3a6',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    aprHandlers: {
        morphoRewardsAprHandler: true,
        aaveRewardsAprHandler: true,
        ybAprHandler: {
            http: [
                {
                    url: 'https://www.ether.fi/api/dapp/protocol/protocol-detail',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a',
                            path: '$.7_day_apr',
                        },
                    ],
                },
                {
                    url: 'https://extra-static.s3.amazonaws.com/data/xlend/pools/apr.json',
                    extractors: [
                        {
                            type: 'path',
                            token: '0x589a7339c6d0c8777e7429f57f2f95c069c37288',
                            path: '$.base[?(@.symbol == "USDC")].totalAPY',
                        },
                        {
                            type: 'path',
                            token: '0x98efe85735f253a0ed0be8e2915ff39f9e4aff0f',
                            path: '$.base[?(@.symbol == "USR")].totalAPY',
                        },
                    ],
                },
                {
                    url: 'https://api.yo.xyz/api/v1/vault/base/0x3A43AEC53490CB9Fa922847385D82fe25d0E9De7',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x3a43aec53490cb9fa922847385d82fe25d0e9de7',
                            path: '$.data.stats.yield.7d',
                        },
                    ],
                },
                {
                    url: 'https://api.yo.xyz/api/v1/vault/base/0x0000000f2eB9f69274678c76222B35eEc7588a65',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x0000000f2eb9f69274678c76222b35eec7588a65',
                            path: '$.data.stats.yield.7d',
                        },
                    ],
                },
                {
                    url: 'https://api.yo.xyz/api/v1/vault/base/0xbCbc8cb4D1e8ED048a6276a5E94A3e952660BcbC',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xbcbc8cb4d1e8ed048a6276a5e94a3e952660bcbc',
                            path: '$.data.stats.yield.7d',
                        },
                    ],
                },
                {
                    url: 'https://app.renzoprotocol.com/api/apr',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x2416092f143378750bb29b79ed961ab195cceea5',
                            path: '$.apr',
                        },
                    ],
                },
                {
                    url: 'https://rwa-api.anzen.finance/metrics/susdz_stats',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xe31ee12bdfdd0573d634124611e85338e2cbf0cf',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://api.superform.xyz/stats/vault/supervault/vL7k-5ZgYCoFgi6kz2jIJ/',
                    scale: 100,
                    headers: {
                        'SF-API-KEY': env.SUPERFORM_API_KEY,
                    },
                    extractors: [
                        {
                            type: 'path',
                            token: '0xffe8b2295cef70290819a8193834cc7900bcef5f',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://api.superform.xyz/stats/vault/supervault/zLVQbgScIbXJuSz-NNsK-/',
                    scale: 100,
                    headers: {
                        'SF-API-KEY': env.SUPERFORM_API_KEY,
                    },
                    extractors: [
                        {
                            type: 'path',
                            token: '0xe9f2a5f9f3c846f29066d7fb3564f8e6b6b2d65b',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://ctrl.yield.fi/t/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x895e15020c3f52ddd4d8e9514eb83c39f53b1579',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://api.yield.fi/t/yusd/apy',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x4772d2e014f9fc3a820c444e3313968e9a5c8121',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://api.exchange.coinbase.com/wrapped-assets/CBETH/',
                    scale: 1,
                    extractors: [
                        {
                            type: 'path',
                            token: '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22',
                            path: '$.apy',
                        },
                    ],
                },
                {
                    url: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
                            path: '$.data.smaApr',
                        },
                    ],
                },
                {
                    url: 'https://api.rocketpool.net/mainnet/reth/apr',
                    scale: 100,
                    extractors: [
                        {
                            type: 'path',
                            token: '0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c',
                            path: '$.yearlyAPR',
                        },
                    ],
                },
                {
                    url: 'https://api.fluid.instad.app/v2/lending/8453/tokens',
                    extractors: [
                        {
                            type: 'enumerate',
                            path: '$.data',
                            entries: (token: any): [string, number] => [
                                token.address.toLowerCase(),
                                parseFloat(token.supplyRate) / 10000,
                            ],
                        },
                    ],
                },
                {
                    url: 'https://blue-api.morpho.org/graphql',
                    body: JSON.stringify({
                        query: `{
                          vaults(first: 1000, where: { chainId_in: [8453], apy_gte: 0.00001 }) {
                              items {
                                  address
                                  state {
                                      apy
                                      fee
                                  }
                              }
                          }
                      }`,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                    extractors: [
                        {
                            type: 'enumerate',
                            path: '$.data.vaults.items',
                            entries: (vault: any): [string, number] => [
                                vault.address.toLowerCase(),
                                vault.state.apy * (1 - vault.state.fee),
                            ],
                        },
                    ],
                },
            ],
            contract: {
                calls: [
                    {
                        name: 'maker sdai',
                        chain: 'MAINNET',
                        contract: '0x197e90f9fad81970ba7976f33cbd77088e5d7cf7',
                        abi: 'function dsr() view returns(uint256)',
                        functionName: 'dsr',
                        parser: (dsr: bigint) => (Number(dsr) * 10 ** -27 - 1) * 365 * 24 * 60 * 60,
                        token: '0x99ac4484e8a1dbd6a185380b3a811913ac884d87',
                    },
                    {
                        name: 'susds',
                        chain: 'BASE',
                        contract: '0x65d946e533748a998b1f0e430803e39a6388f7a1',
                        abi: 'function getAPR() view returns (uint256)',
                        functionName: 'getAPR',
                        parser: (getAPR: bigint) => Number(getAPR) * 10 ** -27,
                        token: '0x5875eee11cf8398102fdad704c9e96607675467a',
                    },
                ],
            },
            aave: {
                markets: [AaveV3Base],
            },
            teth: {
                address: '0xd09acb80c1e8f2291862c4978a008791c9167003',
            },
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
};
