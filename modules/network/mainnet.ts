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
import { coingeckoService } from '../coingecko/coingecko.service';
import { CoingeckoPriceHandlerService } from '../token/lib/token-price-handlers/coingecko-price-handler.service';

const mainnetNetworkData: NetworkData = {
    chain: {
        slug: 'ethereum',
        id: 1,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        prismaId: 'MAINNET',
        gqlId: 'MAINNET',
    },
    subgraphs: {
        startDate: '2019-04-20',
        balancer: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2',
        beetsBar: 'https://',
        blocks: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
        gauge: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
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
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        addressFormatted: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    coingecko: {
        nativeAssetId: 'ethereum',
        platformId: 'ethereum',
    },
    tokenPrices: {
        maxHourlyPriceHistoryNumDays: 100,
    },
    rpcUrl: 'https://cloudflare-eth.com',
    rpcMaxBlockRange: 700,
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
        address: '0xba100000625a3754423978a60c9317c58a424e3D',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        delegationProxy: '0x0000000000000000000000000000000000000000',
    },
    balancer: {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        composableStablePoolFactories: [
            '0xf9ac7B9dF2b3454E841110CcE5550bD5AC6f875F',
            '0x85a80afee867aDf27B50BdB7b76DA70f1E853062',
            '0xdba127fBc23fb20F5929C546af220A991b5C6e01',
            '0xfADa0f4547AB2de89D1304A668C39B3E09Aa7c76',
        ],
        weightedPoolV2Factories: [
            '0xcC508a455F5b0073973107Db6a878DdBDab957bC',
            '0x5Dd94Da3644DDD055fcf6B3E1aa310Bb7801EB8b',
            '0x897888115Ada5773E02aA29F775430BFB5F34c51',
        ],
        poolsInRecoveryMode: [
            '0x0ce45ba1c33e0741957881e05daff3b1e2954a9b000200000000000000000365',
            '0x0fd5663d4893ae0d579d580584806aadd2dd0b8b000200000000000000000367',
            '0x173063a30e095313eee39411f07e95a8a806014e0002000000000000000003ab',
            '0x25accb7943fd73dda5e23ba6329085a3c24bfb6a000200000000000000000387',
            '0x2ba7aa2213fa2c909cd9e46fed5a0059542b36b00000000000000000000003a3',
            '0x334c96d792e4b26b841d28f53235281cec1be1f200020000000000000000038a',
            '0x373b347bc87998b151a5e9b6bb6ca692b766648a0000000000000000000003f8',
            '0x43bdd55d9c98ae9184dc3a869ab89a83762156d50002000000000000000003f3',
            '0x496ff26b76b8d23bbc6cf1df1eee4a48795490f7000200000000000000000377',
            '0x4c8d2e60863e8d7e1033eda2b3d84e92a641802000000000000000000000040f',
            '0x4ce0bd7debf13434d3ae127430e9bd4291bfb61f00020000000000000000038b',
            '0x4edcb2b46377530bc18bb4d2c7fe46a992c73e100000000000000000000003ec',
            '0x5210287a2a440c06d7f3fcc4cc7b119ba8de433900020000000000000000037f',
            '0x53bc3cba3832ebecbfa002c12023f8ab1aa3a3a0000000000000000000000411',
            '0x5b3240b6be3e7487d61cd1afdfc7fe4fa1d81e6400000000000000000000037b',
            '0x6a5ead5433a50472642cd268e584dafa5a394490000200000000000000000366',
            '0x6a9603e481fb8f2c09804ea9adab49a338855b900000000000000000000003a8',
            '0x7152a37bbf363262bad269ec4de2269dd0e84ca30002000000000000000003bd',
            '0x798b112420ad6391a4129ac25ef59663a44c88bb0002000000000000000003f4',
            '0x81b7f92c7b7d9349b989b4982588761bfa1aa6270000000000000000000003e9',
            '0x8e85e97ed19c0fa13b2549309965291fbbc0048b0000000000000000000003ba',
            '0x9fb771d530b0ceba5160f7bfe2dd1e8b8aa1340300000000000000000000040e',
            '0xa13a9247ea42d743238089903570127dda72fe4400000000000000000000035d',
            '0xac976bb42cb0c85635644e8c7c74d0e0286aa61c0000000000000000000003cb',
            '0xb9bd68a77ccf8314c0dfe51bc291c77590c4e9e6000200000000000000000385',
            '0xbd482ffb3e6e50dc1c437557c3bea2b68f3683ee0000000000000000000003c6',
            '0xc9c5ff67bb2fae526ae2467c359609d6bcb4c5320000000000000000000003cc',
            '0xe340ebfcaa544da8bb1ee9005f1a346d50ec422e000200000000000000000396',
        ],
        swapProtocolFeePercentage: 0.5,
        yieldProtocolFeePercentage: 0.5,
        poolDataQueryContract: '0x548e2f8114DDf1c796C37e83D26db9b1cf215a62',
        excludedPoolDataQueryPoolIds: ['0xf71d0774b214c4cf51e33eb3d30ef98132e4dbaa00000000000000000000046e'],
    },
    multicall: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    masterchef: {
        address: '0x0000000000000000000000000000000000000000',
        excludedFarmIds: [],
    },
    avgBlockSpeed: 10,
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
        linearPoolFactories: ['0x1b986138a4F2aA538E79fdEC222dad93F8d66703'],
        averageAPRAcrossLastNHarvests: 2,
        multiStratLinearPoolIds: [],
    },
    beefy: {
        linearPools: [''],
    },
    lido: {
        wstEthAprEndpoint: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
        wstEthContract: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
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

export const mainnetNetworkConfig: NetworkConfig = {
    data: mainnetNetworkData,
    contentService: new GithubContentService(),
    provider: new ethers.providers.JsonRpcProvider(mainnetNetworkData.rpcUrl),
    poolAprServices: [
        new WstethAprService(tokenService, mainnetNetworkData.lido!.wstEthContract),
        new ReaperCryptAprService(
            mainnetNetworkData.reaper.linearPoolFactories,
            mainnetNetworkData.reaper.averageAPRAcrossLastNHarvests,
            tokenService,
            mainnetNetworkData.stader ? mainnetNetworkData.stader.sFtmxContract : undefined,
            mainnetNetworkData.lido ? mainnetNetworkData.lido.wstEthContract : undefined,
        ),
        new PhantomStableAprService(mainnetNetworkData.balancer.yieldProtocolFeePercentage),
        new BoostedPoolAprService(mainnetNetworkData.balancer.yieldProtocolFeePercentage),
        new SwapFeeAprService(mainnetNetworkData.balancer.swapProtocolFeePercentage),
        new GaugeAprService(gaugeSubgraphService, tokenService, [
            mainnetNetworkData.beets.address,
            mainnetNetworkData.bal.address,
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
        // The following are multichain jobs and should only run once for all chains.
        {
            name: 'sync-global-coingecko-prices',
            interval: every(2, 'minutes'),
        },
    ],
};
