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
        platformId: 'hyperevm',
        excludedTokenAddresses: [],
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=hyperliquid&dkey=${env.DRPC_API_KEY}`
        : 'https://rpc.hyperliquid.xyz/evm',
    rpcMaxBlockRange: 1000,
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
                hlhype: {
                    tokenAddress: '0xd704254eb350e0d3baecd194d095862267897ae0',
                    sourceUrl: 'https://api.hyperlend.finance/data/markets/rates',
                    path: '0x5555555555555555555555555555555555555555.supplyAPR',
                    scale: 100,
                },
                usdtwhlp: {
                    tokenAddress: '0x06fd9d03b3d0f18e4919919b72d30c582f0a97e5',
                    sourceUrl: 'https://api.hyperlend.finance/data/markets/rates',
                    path: '0x06Fd9D03b3d0F18E4919919b72D30c582f0a97E5.supplyAPR',
                    scale: 100,
                },
                whlp: {
                    tokenAddress: '0x1359b05241ca5076c9f59605214f4f84114c0de8',
                    sourceUrl:
                        'https://backend.nucleusearn.io/v1/vaults/apy?token_address=0x1359b05241cA5076c9F59605214f4F84114c0dE8&lookback_days=14',
                    path: 'apy',
                    scale: 100,
                },
                lhype: {
                    tokenAddress: '0x5748ae796ae46a4f1348a1693de4b50560485562',
                    sourceUrl:
                        'https://backend.nucleusearn.io/v1/vaults/apy?token_address=0x5748ae796AE46A4F1348a1693de4b50560485562&lookback_days=14',
                    path: 'apy',
                    scale: 100,
                },
                khype: {
                    tokenAddress: '0xfd739d4e423301ce9385c1fb8850539d657c296d',
                    sourceUrl: 'https://api.kinetiq.xyz/v1/public/protocol',
                    path: 'apy',
                    scale: 1,
                },
            },
            hypurrfi: [
                '0x1c5164a764844356d57654ea83f9f1b72cd10db5', // hyUSD₮0-lhype
                '0x2c910f67dbf81099e6f8e126e7265d7595dc20ad', // hyUSD₮0-hwHLP
            ],
            morphoVaultHyperevm: [
                '0xfc5126377f0efc0041c0969ef9ba903ce67d151e', // feUSDT0
                '0x9c59a9389d8f72de2cdaf1126f36ea4790e2275e', // feUSDhl
                '0x5eec795d919fa97688fb9844eeb0072e6b846f9d', // gtUSDe
                '0xd3a9cb7312b9c29113290758f5adfe12304cd16a', // mcUSR
                '0x3bcc0a5a66bb5bdceef5dd8a659a4ec75f3834d8', // mcUSDT
                '0xd19e3d00f8547f7d108abfd4bbb015486437b487', // mcHYPE
                '0x53a333e51e96fe288bc9add7cdc4b1ead2cd2ffa', // gtUSDT0
                '0x0571362ba5ea9784a97605f57483f865a37dbeaa', // gtuETH
            ],
            defillama: [
                {
                    defillamaPoolId: 'a8a2a14b-2345-4666-adab-227c991c4837',
                    tokenAddress: '0x9fd7466f987fd4c45a5bbde22ed8aba5bc8d72d1',
                },
            ],
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
