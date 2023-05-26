import { BigNumber, ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { tokenService } from '../token/token.service';
import { WstethAprService } from '../pool/lib/apr-data-sources/optimism/wsteth-apr.service';
import { ReaperCryptAprService } from '../pool/lib/apr-data-sources/reaper-crypt-apr.service';
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

const arbitrumNetworkData: NetworkData = {
    chain: {
        slug: 'arbitrum',
        id: 42161,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
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
    },
    tokenPrices: {
        maxHourlyPriceHistoryNumDays: 100,
    },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    rpcMaxBlockRange: 2000,
    beetsPriceProviderRpcUrl: 'https://rpc.ftm.tools',
    sanity: {
        projectId: '',
        dataset: '',
    },
    protocolToken: 'bal',
    beets: {
        address: '0x0000000000000000000000000000000000000000',
    },
    bal: {
        address: '0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        delegationProxy: '0x81cfae226343b24ba12ec6521db2c79e7aeeb310',
    },
    balancer: {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        composableStablePoolFactories: [
            '0xaEb406b0E430BF5Ea2Dc0B9Fe62E4E53f74B3a33',
            '0x85a80afee867aDf27B50BdB7b76DA70f1E853062',
            '0x1c99324EDC771c82A0DCCB780CC7DDA0045E50e7',
            '0x2498A2B0d6462d2260EAC50aE1C3e03F4829BA95',
        ],
        weightedPoolV2Factories: [
            '0x8df6EfEc5547e31B0eb7d1291B511FF8a2bf987c',
            '0xf1665E19bc105BE4EDD3739F88315cC699cc5b65',
            '0xc7E5ED1054A24Ef31D827E6F86caA58B3Bc168d7',
        ],
        poolsInRecoveryMode: [
            '0x13f2f70a951fb99d48ede6e25b0bdf06914db33f00020000000000000000016b',
            '0x178e029173417b1f9c8bc16dcec6f697bc323746000200000000000000000158',
            '0x2d011adf89f0576c9b722c28269fcb5d50c2d179000200000000000000000157',
            '0x373b347bc87998b151a5e9b6bb6ca692b766648a000000000000000000000239',
            '0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000130',
            '0xcc98357eaf3e227bdef6b97780aae84bea9b02b00000000000000000000000fe',
            '0xf93579002dbe8046c43fefe86ec78b1112247bb800020000000000000000021d',
            '0xfb5e6d0c1dfed2ba000fbc040ab8df3615ac329c000000000000000000000159',
        ],
        swapProtocolFeePercentage: 0.5,
        yieldProtocolFeePercentage: 0.5,
        poolDataQueryContract: '0xC1Ff645400DD37989e77802326665cCf4fFDB352',
    },
    multicall: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    masterchef: {
        address: '0x0000000000000000000000000000000000000000',
        excludedFarmIds: [],
    },
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
    yearn: {
        vaultsEndpoint: 'https://#/',
    },
    reaper: {
        linearPoolFactories: ['0xC101dcA301a4011C1F925e9622e749e550a1B667'],
        averageAPRAcrossLastNHarvests: 2,
        multiStratLinearPoolIds: [],
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
    provider: new ethers.providers.JsonRpcProvider(arbitrumNetworkData.rpcUrl),
    poolAprServices: [
        new WstethAprService(tokenService, arbitrumNetworkData.lido!.wstEthContract),
        new ReaperCryptAprService(
            arbitrumNetworkData.reaper.linearPoolFactories,
            arbitrumNetworkData.reaper.averageAPRAcrossLastNHarvests,
            tokenService,
            arbitrumNetworkData.stader ? arbitrumNetworkData.stader.sFtmxContract : undefined,
            arbitrumNetworkData.lido ? arbitrumNetworkData.lido.wstEthContract : undefined,
        ),
        new PhantomStableAprService(arbitrumNetworkData.balancer.yieldProtocolFeePercentage),
        new BoostedPoolAprService(arbitrumNetworkData.balancer.yieldProtocolFeePercentage),
        new SwapFeeAprService(arbitrumNetworkData.balancer.swapProtocolFeePercentage),
        new GaugeAprService(gaugeSubgraphService, tokenService, [
            arbitrumNetworkData.beets.address,
            arbitrumNetworkData.bal.address,
        ]),
    ],
    poolStakingServices: [new GaugeStakingService(gaugeSubgraphService)],
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
            interval: every(2, 'minutes'),
        },
        {
            name: 'update-liquidity-for-inactive-pools',
            interval: every(1, 'days'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'update-liquidity-for-active-pools',
            interval: every(1, 'minutes'),
        },
        {
            name: 'update-pool-apr',
            interval: every(1, 'minutes'),
        },
        {
            name: 'load-on-chain-data-for-pools-with-active-updates',
            interval: every(1, 'minutes'),
        },
        {
            name: 'sync-new-pools-from-subgraph',
            interval: every(1, 'minutes'),
        },
        {
            name: 'sync-tokens-from-pool-tokens',
            interval: every(5, 'minutes'),
        },
        {
            name: 'update-liquidity-24h-ago-for-all-pools',
            interval: every(5, 'minutes'),
        },
        {
            name: 'cache-average-block-time',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-staking-for-pools',
            interval: every(5, 'minutes'),
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
            interval: every(15, 'seconds'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'user-sync-wallet-balances-for-all-pools',
            interval: every(10, 'seconds'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'user-sync-staked-balances',
            interval: every(10, 'seconds'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'sync-user-snapshots',
            interval: every(1, 'hours'),
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
            name: 'update-yield-capture',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-vebal-balances',
            interval: every(1, 'minutes'),
        },
        {
            name: 'sync-vebal-totalSupply',
            interval: every(5, 'minutes'),
        },
    ],
};
