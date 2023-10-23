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
import { CoingeckoPriceHandlerService } from '../token/lib/token-price-handlers/coingecko-price-handler.service';
import { coingeckoService } from '../coingecko/coingecko.service';
import { IbTokensAprService } from '../pool/lib/apr-data-sources/ib-tokens-apr.service';
import { env } from '../../app/env';

const arbitrumNetworkData: NetworkData = {
    chain: {
        slug: 'arbitrum',
        id: 42161,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        prismaId: 'ARBITRUM',
        gqlId: 'ARBITRUM',
    },
    subgraphs: {
        startDate: '2021-08-23',
        balancer: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-arbitrum-v2',
        beetsBar: 'https://',
        blocks: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-one-blocks',
        gauge: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges-arbitrum',
        veBalLocks: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
        userBalances: 'https://',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ether',
    },
    weth: {
        address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        addressFormatted: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
    coingecko: {
        nativeAssetId: 'ethereum',
        platformId: 'arbitrum-one',
        excludedTokenAddresses: [],
    },
    tokenPrices: {
        maxHourlyPriceHistoryNumDays: 100,
    },
    rpcUrl:
        env.INFURA_API_KEY && (env.DEPLOYMENT_ENV as DeploymentEnv) === 'main'
            ? `https://arbitrum-mainnet.infura.io/v3/${env.INFURA_API_KEY}`
            : 'https://rpc.ankr.com/arbitrum',
    rpcMaxBlockRange: 2000,
    protocolToken: 'bal',
    bal: {
        address: '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        delegationProxy: '0x81cfae226343b24ba12ec6521db2c79e7aeeb310',
    },
    balancer: {
        vault: '0xba12222222228d8ba445958a75a0704d566bf2c8',
        composableStablePoolFactories: [
            '0xaeb406b0e430bf5ea2dc0b9fe62e4e53f74b3a33',
            '0x85a80afee867adf27b50bdb7b76da70f1e853062',
            '0x1c99324edc771c82a0dccb780cc7dda0045e50e7',
            '0x2498a2b0d6462d2260eac50ae1c3e03f4829ba95',
            '0xa8920455934da4d853faac1f94fe7bef72943ef1',
        ],
        weightedPoolV2Factories: [
            '0x8df6efec5547e31b0eb7d1291b511ff8a2bf987c',
            '0xf1665e19bc105be4edd3739f88315cc699cc5b65',
            '0xc7e5ed1054a24ef31d827e6f86caa58b3bc168d7',
        ],
        swapProtocolFeePercentage: 0.5,
        yieldProtocolFeePercentage: 0.5,
    },
    multicall: '0x80c7dd17b01855a6d2347444a0fcc36136a314de',
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
            v3: {
                subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum',
                tokens: {
                    USDC: {
                        underlyingAssetAddress: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
                        aTokenAddress: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
                        wrappedTokens: {
                            waUSDC: '0xe719aef17468c7e10c0c205be62c990754dff7e5',
                            stataArbUSDC: '0x3a301e7917689b8e8a19498b8a28fc912583490c',
                            stataArbUSDCn: '0xbde67e089886ec0e615d6f054bc6f746189a3d56',
                        },
                    },
                    USDT: {
                        underlyingAssetAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
                        aTokenAddress: '0x6ab707aca953edaefbc4fd23ba73294241490620',
                        wrappedTokens: {
                            waUSDT: '0x3c7680dfe7f732ca0279c39ff30fe2eafdae49db',
                            stataArbUSDT: '0x8b5541b773dd781852940490b0c3dc1a8cdb6a87',
                        },
                    },
                    DAI: {
                        underlyingAssetAddress: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
                        aTokenAddress: '0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee',
                        wrappedTokens: {
                            waDAI: '0x345a864ac644c82c2d649491c905c71f240700b2',
                            stataArbDAI: '0x426e8778bf7f54b0e4fc703dcca6f26a4e5b71de',
                        },
                    },
                    wETH: {
                        underlyingAssetAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                        aTokenAddress: '0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8',
                        wrappedTokens: {
                            waWETH: '0x18c100415988bef4354effad1188d1c22041b046',
                            stataArbWETH: '0x18468b6eba332285c6d9bb03fe7fb52e108c4596',
                        },
                    },
                },
            },
        },
        reaper: {
            onchainSource: {
                averageAPRAcrossLastNHarvests: 5,
                tokens: {
                    rfGrainDAI: {
                        address: '0x12f256109e744081f633a827be80e06d97ff7447',
                    },
                    rfGrainUSDT: {
                        address: '0x0179bac7493a92ac812730a4c64a0b41b7ea0ecf',
                    },
                    rfGrainUSDC: {
                        address: '0xaeacf641a0342330ec681b57c0a6af0b71d5cbff',
                    },
                },
            },
        },
        defaultHandlers: {
            wstETH: {
                tokenAddress: '0x5979d7b546e38e414f7e9822514be443a4800529',
                sourceUrl: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
                path: 'data.smaApr',
                isIbYield: true,
            },
            rETH: {
                tokenAddress: '0xec70dcb4a1efa46b8f2d97c310c9c4790ba5ffa8',
                sourceUrl: 'https://rocketpool.net/api/mainnet/payload',
                path: 'rethAPR',
                isIbYield: true,
            },
            cbETH: {
                tokenAddress: '0x1debd73e752beaf79865fd6446b0c970eae7732f',
                sourceUrl: 'https://api.exchange.coinbase.com/wrapped-assets/CBETH/',
                path: 'apy',
                scale: 1,
            },
            sfrxETH: {
                tokenAddress: '0x95ab45875cffdba1e5f451b950bc2e42c0053f39',
                sourceUrl: 'https://api.frax.finance/v2/frxeth/summary/latest',
                path: 'sfrxethApr',
                isIbYield: true,
            },
        },
    },
    beefy: {
        linearPools: [''],
    },
    lido: {
        wstEthAprEndpoint: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
        wstEthContract: '0x5979d7b546e38e414f7e9822514be443a4800529',
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

export const arbitrumNetworkConfig: NetworkConfig = {
    data: arbitrumNetworkData,
    contentService: new GithubContentService(),
    provider: new ethers.providers.JsonRpcProvider({ url: arbitrumNetworkData.rpcUrl, timeout: 60000 }),
    poolAprServices: [
        new IbTokensAprService(
            arbitrumNetworkData.ibAprConfig,
            arbitrumNetworkData.chain.prismaId,
            arbitrumNetworkData.balancer.yieldProtocolFeePercentage,
            arbitrumNetworkData.balancer.swapProtocolFeePercentage
        ),
        new PhantomStableAprService(arbitrumNetworkData.chain.prismaId, arbitrumNetworkData.balancer.yieldProtocolFeePercentage),
        new BoostedPoolAprService(),
        new SwapFeeAprService(arbitrumNetworkData.balancer.swapProtocolFeePercentage),
        new GaugeAprService(tokenService, [arbitrumNetworkData.bal!.address]),
    ],
    poolStakingServices: [new GaugeStakingService(gaugeSubgraphService, arbitrumNetworkData.bal!.address)],
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
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'minutes') : every(10, 'minutes'),
        },
        {
            name: 'user-sync-staked-balances',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'minutes') : every(10, 'minutes'),
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
