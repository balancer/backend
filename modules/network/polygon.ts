import { BigNumber, ethers } from 'ethers';
import { DeploymentEnv, NetworkConfig, NetworkData } from './network-config-types';
import { tokenService } from '../token/token.service';
import { PhantomStableAprService } from '../pool/lib/apr-data-sources/phantom-stable-apr.service';
import { BoostedPoolAprService } from '../pool/lib/apr-data-sources/boosted-pool-apr.service';
import { SwapFeeAprService } from '../pool/lib/apr-data-sources/swap-fee-apr.service';
import { GaugeAprService } from '../pool/lib/apr-data-sources/ve-bal-gauge-apr.service';
import { GaugeStakingService } from '../pool/lib/staking/gauge-staking.service';
import { BptPriceHandlerService } from '../token/lib/token-price-handlers/bpt-price-handler.service';
import { LinearWrappedTokenPriceHandlerService } from '../token/lib/token-price-handlers/linear-wrapped-token-price-handler.service';
import { SwapsPriceHandlerService } from '../token/lib/token-price-handlers/swaps-price-handler.service';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { every } from '../../worker/intervals';
import { GithubContentService } from '../content/github-content.service';
import { gaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { coingeckoService } from '../coingecko/coingecko.service';
import { CoingeckoPriceHandlerService } from '../token/lib/token-price-handlers/coingecko-price-handler.service';
import { IbTokensAprService } from '../pool/lib/apr-data-sources/ib-tokens-apr.service';
import { env } from '../../app/env';

const polygonNetworkData: NetworkData = {
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
        balancer: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-prune-v2',
        beetsBar: 'https://',
        blocks: 'https://api.thegraph.com/subgraphs/name/ianlapham/polygon-blocks',
        gauge: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges-polygon',
        veBalLocks: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
        userBalances: 'https://',
    },
    eth: {
        address: '0x0000000000000000000000000000000000001010',
        addressFormatted: '0x0000000000000000000000000000000000001010',
        symbol: 'MATIC',
        name: 'Matic',
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
    tokenPrices: {
        maxHourlyPriceHistoryNumDays: 100,
    },
    rpcUrl: env.INFURA_API_KEY
        ? `https://polygon-mainnet.infura.io/v3/${env.INFURA_API_KEY}`
        : 'https://polygon.sakurarpc.io',
    rpcMaxBlockRange: 2000,
    protocolToken: 'bal',
    bal: {
        address: '0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        delegationProxy: '0x0f08eef2c785aa5e7539684af04755dec1347b7c',
    },
    gyro: {
        config: '0xfdc2e9e03f515804744a40d0f8d25c16e93fbe67'
    },
    balancer: {
        vault: '0xba12222222228d8ba445958a75a0704d566bf2c8',
        composableStablePoolFactories: [
            '0x136fd06fa01ecf624c7f2b3cb15742c1339dc2c4',
            '0x85a80afee867adf27b50bdb7b76da70f1e853062',
            '0x7bc6c0e73edaa66ef3f6e2f27b0ee8661834c6c9',
            '0x6ab5549bbd766a43afb687776ad8466f8b42f777',
            '0xe2fa4e1d17725e72dcdafe943ecf45df4b9e285b',
        ],
        weightedPoolV2Factories: [
            '0x0e39c3d9b2ec765efd9c5c70bb290b1fcd8536e3',
            '0x82e4cfaef85b1b6299935340c964c942280327f4',
            '0xfc8a407bba312ac761d8bfe04ce1201904842b76',
        ],
        swapProtocolFeePercentage: 0.5,
        yieldProtocolFeePercentage: 0.5,
    },
    multicall: '0x275617327c958bd06b5d6b871e7f491d76113dd8',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 1,
    sor: {
        main: {
            url: 'https://uu6cfghhd5lqa7py3nojxkivd40zuugb.lambda-url.ca-central-1.on.aws/',
            maxPools: 8,
            forceRefresh: false,
            gasPrice: BigNumber.from(10),
            swapGas: BigNumber.from('1000000'),
        },
        canary: {
            url: 'https://ksa66wlkjbvteijxmflqjehsay0jmekw.lambda-url.eu-central-1.on.aws/',
            maxPools: 8,
            forceRefresh: false,
            gasPrice: BigNumber.from(10),
            swapGas: BigNumber.from('1000000'),
        },
    },
    ibAprConfig: {
        aave: {
            v2: {
                subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/aave-v2-matic',
                tokens: {
                    USDC: {
                        underlyingAssetAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
                        aTokenAddress: '0x1a13f4ca1d028320a707d99520abfefca3998b7f',
                        wrappedTokens: {
                            waUSDC: '0x221836a597948dce8f3568e044ff123108acc42a',
                        },
                    },
                    USDT: {
                        underlyingAssetAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
                        aTokenAddress: '0x60d55f02a771d515e077c9c2403a1ef324885cec',
                        wrappedTokens: {
                            waUSDT: '0x19c60a251e525fa88cd6f3768416a8024e98fc19',
                        },
                    },
                    DAI: {
                        underlyingAssetAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
                        aTokenAddress: '0x27f8d03b3a2196956ed754badc28d73be8830a6e',
                        wrappedTokens: {
                            waDAI: '0xee029120c72b0607344f35b17cdd90025e647b00',
                        },
                    },
                },
            },
            v3: {
                subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-polygon',
                tokens: {
                    USDC: {
                        underlyingAssetAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
                        aTokenAddress: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
                        wrappedTokens: {
                            waUSDC: '0xac69e38ed4298490906a3f8d84aefe883f3e86b5',
                            stataPolUSDC: '0xc04296aa4534f5a3bab2d948705bc89317b2f1ed',
                        },
                    },
                    USDT: {
                        underlyingAssetAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                        aTokenAddress: '0x23878914efe38d27c4d67ab83ed1b93a74d4086a',
                        wrappedTokens: {
                            waUSDT: '0x715d73a88f2f0115d87cfe5e0f25d756b2f9679f',
                            stataPolUSDT: '0x31f5ac91804a4c0b54c0243789df5208993235a1',
                        },
                    },
                    DAI: {
                        underlyingAssetAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
                        aTokenAddress: '0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee',
                        wrappedTokens: {
                            waDAI: '0xdb6df721a6e7fdb97363079b01f107860ac156f9',
                            stataPolDAI: '0xfcf5d4b313e06bb3628eb4fe73320e94039dc4b7',
                        },
                    },
                    wETH: {
                        underlyingAssetAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
                        aTokenAddress: '0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8',
                        wrappedTokens: {
                            waWETH: '0xa5bbf0f46b9dc8a43147862ba35c8134eb45f1f5',
                            stataPolWETH: '0xd08b78b11df105d2861568959fca28e30c91cf68',
                        },
                    },
                    wMATIC: {
                        underlyingAssetAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
                        aTokenAddress: '0x6d80113e533a2c0fe82eabd35f1875dcea89ea97',
                        wrappedTokens: {
                            waWMATIC: '0x0d6135b2cfbae3b1c58368a93b855fa54fa5aae1',
                            stataPolWMATIC: '0x6f3913333f2d4b7b01d17bedbce1e4c758b94465',
                        },
                    },
                },
            },
        },
        tetu: {
            sourceUrl: 'https://api.tetu.io/api/v1/reader/compoundAPRs?network=MATIC',
            tokens: {
                tUSDC: { address: '0x113f3d54c31ebc71510fd664c8303b34fbc2b355' },
                tUSDT: { address: '0x236975da9f0761e9cf3c2b0f705d705e22829886' },
                tDAI: { address: '0xace2ac58e1e5a7bfe274916c4d82914d490ed4a5' },
                tetuStQI: { address: '0x4cd44ced63d9a6fef595f6ad3f7ced13fceac768' },
            },
        },
        defaultHandlers: {
            wstETH: {
                tokenAddress: '0x03b54a6e9a984069379fae1a4fc4dbae93b3bccd',
                sourceUrl: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                path: 'data.smaApr',
                isIbYield: true,
            },
            stMATIC: {
                tokenAddress: '0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4',
                sourceUrl: 'https://polygon.lido.fi/api/stats',
                path: 'apr',
                isIbYield: true,
            },
            MATICX: {
                tokenAddress: '0xfa68fb4628dff1028cfec22b4162fccd0d45efb6',
                sourceUrl: 'https://universe.staderlabs.com/polygon/apy',
                path: 'value',
                isIbYield: true,
            },
            overnightUSDPlus: {
                tokenAddress: '0x5d9d8509c522a47d9285b9e4e9ec686e6a580850',
                sourceUrl: 'https://api.overnight.fi/optimism/usd+/fin-data/avg-apr/week',
                path: 'value',
                group: 'OVERNIGHT',
            },
            overnightstUSDPlus: {
                tokenAddress: '0x5a5c6aa6164750b530b8f7658b827163b3549a4d',
                sourceUrl: 'https://api.overnight.fi/optimism/usd+/fin-data/avg-apr/week',
                path: 'value',
                group: 'OVERNIGHT',
            },
            wbETH: {
                tokenAddress: '0xa2e3356610840701bdf5611a53974510ae27e2e1',
                sourceUrl:
                    'https://www.binance.com/bapi/earn/v1/public/pos/cftoken/project/rewardRateList?projectId=BETH',
                path: 'data.0.rewardRate',
                isIbYield: true,
            },
        },
    },
    beefy: {
        linearPools: [''],
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

export const polygonNetworkConfig: NetworkConfig = {
    data: polygonNetworkData,
    contentService: new GithubContentService(),
    provider: new ethers.providers.JsonRpcProvider({ url: polygonNetworkData.rpcUrl, timeout: 60000 }),
    poolAprServices: [
        new IbTokensAprService(polygonNetworkData.ibAprConfig),
        new PhantomStableAprService(),
        new BoostedPoolAprService(),
        new SwapFeeAprService(polygonNetworkData.balancer.swapProtocolFeePercentage),
        new GaugeAprService(tokenService, [polygonNetworkData.bal!.address]),
    ],
    poolStakingServices: [new GaugeStakingService(gaugeSubgraphService, polygonNetworkData.bal!.address)],
    tokenPriceHandlers: [
        new CoingeckoPriceHandlerService(coingeckoService),
        new BptPriceHandlerService(),
        new LinearWrappedTokenPriceHandlerService(),
        new SwapsPriceHandlerService(),
    ],
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    /*
    For sub-minute jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3. 
    This is needed because the minimum alarm period is 1 minute and we want the alarm to trigger already after 1 minute instead of 3.

    For every 1 days jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3. 
    This is needed because the maximum alarm evaluation period is 1 day (period * evaluationPeriod).
    */
    workerJobs: [
        {
            name: 'update-token-prices',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'update-liquidity-for-inactive-pools',
            interval: every(1, 'days'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'update-liquidity-for-active-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(6, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'update-pool-apr',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(6, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'load-on-chain-data-for-pools-with-active-updates',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'minutes') : every(1, 'minutes'),
        },
        {
            name: 'sync-new-pools-from-subgraph',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(6, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'sync-tokens-from-pool-tokens',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
        {
            name: 'update-liquidity-24h-ago-for-all-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
        {
            name: 'cache-average-block-time',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-staking-for-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
        {
            name: 'sync-latest-snapshots-for-all-pools',
            interval: every(1, 'hours'),
        },
        {
            name: 'update-lifetime-values-for-all-pools',
            interval: every(30, 'minutes'),
        },
        {
            name: 'sync-changed-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'minutes') : every(20, 'seconds'),
            alarmEvaluationPeriod: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
            alarmDatapointsToAlarm: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
        },
        {
            name: 'user-sync-wallet-balances-for-all-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(10, 'minutes'),
        },
        {
            name: 'user-sync-staked-balances',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(10, 'minutes'),
        },
        {
            name: 'sync-coingecko-coinids',
            interval: every(2, 'hours'),
        },
        {
            name: 'purge-old-tokenprices',
            interval: every(1, 'days'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'update-fee-volume-yield-all-pools',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-vebal-balances',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(9, 'minutes') : every(3, 'minutes'),
        },
        {
            name: 'sync-vebal-totalSupply',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
    ],
};
