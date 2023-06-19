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
        swapProtocolFeePercentage: 0.5,
        yieldProtocolFeePercentage: 0.5,
        poolDataQueryContract: '0x9Fa8A5977EF1d852602AE1960971D7ac0f0aaa1a',
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
        new PhantomStableAprService(),
        new BoostedPoolAprService(),
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
    poolsWithGauges: [
        '0x06df3b2bbb68adc8b0e302443692037ed9f91b42000000000000000000000063',
        '0x072f14b85add63488ddad88f855fda4a99d6ac9b000200000000000000000027',
        '0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a',
        '0x186084ff790c65088ba694df11758fae4943ee9e000200000000000000000013',
        '0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112',
        '0x27c9f71cc31464b906e0006d4fcbc8900f48f15f00020000000000000000010f',
        '0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080',
        '0x350196326aeaa9b98f1903fb5e8fc2686f85318c000200000000000000000084',
        '0x3e5fa9518ea95c3e533eb377c001702a9aacaa32000200000000000000000052',
        '0x51735bdfbfe3fc13dea8dc6502e2e958989429610002000000000000000000a0',
        '0x5d66fff62c17d841935b60df5f07f6cf79bd0f4700020000000000000000014c',
        '0x5f7fa48d765053f8dd85e052843e12d23e3d7bc50002000000000000000000c0',
        '0x702605f43471183158938c1a3e5f5a359d7b31ba00020000000000000000009f',
        '0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb20000000000000000000000fe',
        '0x7edde0cb05ed19e03a9a47cd5e53fc57fde1c80c0002000000000000000000c8',
        '0x8f4205e1604133d1875a3e771ae7e4f2b086563900020000000000000000010e',
        '0x90291319f1d4ea3ad4db0dd8fe9e12baf749e84500020000000000000000013c',
        '0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019',
        '0x96ba9025311e2f47b840a1f68ed57a3df1ea8747000200000000000000000160',
        '0xa02e4b3d18d4e6b8d18ac421fbc3dfff8933c40a00020000000000000000004b',
        '0xa6f548df93de924d73be7d25dc02554c6bd66db500020000000000000000000e',
        '0xbaeec99c90e3420ec6c1e7a769d2a856d2898e4d00020000000000000000008a',
        '0xbf96189eee9357a95c7719f4f5047f76bde804e5000200000000000000000087',
        '0xe2469f47ab58cf9cf59f9822e3c5de4950a41c49000200000000000000000089',
        '0xe99481dc77691d8e2456e5f3f61c1810adfc1503000200000000000000000018',
        '0xec60a5fef79a92c741cb74fdd6bfc340c0279b01000200000000000000000015',
        '0xedf085f65b4f6c155e13155502ef925c9a756003000200000000000000000123',
        '0xefaa1604e82e1b3af8430b90192c1b9e8197e377000200000000000000000021',
        '0xf4c0dd9b82da36c07605df83c8a416f11724d88b000200000000000000000026',
        '0xf5aaf7ee8c39b651cebf5f1f50c10631e78e0ef9000200000000000000000069',
        '0xfeadd389a5c427952d8fdb8057d6c8ba1156cc56000000000000000000000066',
        '0x17ddd9646a69c9445cd8a9f921d4cd93bf50d108000200000000000000000159',
        '0x92762b42a06dcdddc5b7362cfb01e631c4d44b40000200000000000000000182',
        '0xde8c195aa41c11a0c4787372defbbddaa31306d2000200000000000000000181',
        '0xc45d42f801105e861e86658648e3678ad7aa70f900010000000000000000011e',
        '0x2d344a84bac123660b021eebe4eb6f12ba25fe8600020000000000000000018a',
        '0xb460daa847c45f1c4a41cb05bfb3b51c92e41b36000200000000000000000194',
        '0x5122e01d819e58bb2e22528c0d68d310f0aa6fd7000200000000000000000163',
        '0x851523a36690bf267bbfec389c823072d82921a90002000000000000000001ed',
        '0xe8cc7e765647625b95f59c15848379d10b9ab4af0002000000000000000001de',
        '0x85370d9e3bb111391cc89f6de344e801760461830002000000000000000001ef',
        '0xa7ff759dbef9f3efdd1d59beee44b966acafe214000200000000000000000180',
        '0x3f7c10701b14197e2695dec6428a2ca4cf7fc3b800020000000000000000023c',
        '0x2d011adf89f0576c9b722c28269fcb5d50c2d17900020000000000000000024d',
        '0x178e029173417b1f9c8bc16dcec6f697bc32374600000000000000000000025d',
        '0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274',
        '0x3dd0843a028c86e0b760b1a76929d1c5ef93a2dd000200000000000000000249',
        '0x0578292cb20a443ba1cde459c985ce14ca2bdee5000100000000000000000269',
        '0x8eb6c82c3081bbbd45dcac5afa631aac53478b7c000100000000000000000270',
        '0x1b65fe4881800b91d4277ba738b567cbb200a60d0002000000000000000002cc',
        '0x99a14324cfd525a34bbc93ac7e348929909d57fd00020000000000000000030e',
        '0x9b532ab955417afd0d012eb9f7389457cd0ea712000000000000000000000338',
        '0x48607651416a943bf5ac71c41be1420538e78f87000200000000000000000327',
        '0x6a5ead5433a50472642cd268e584dafa5a394490000200000000000000000366',
        '0x0fd5663d4893ae0d579d580584806aadd2dd0b8b000200000000000000000367',
        '0x441b8a1980f2f2e43a9397099d15cc2fe6d3625000020000000000000000035f',
        '0xf3aeb3abba741f0eece8a1b1d2f11b85899951cb000200000000000000000351',
        '0xa13a9247ea42d743238089903570127dda72fe4400000000000000000000035d',
        '0x496ff26b76b8d23bbc6cf1df1eee4a48795490f7000200000000000000000377',
        '0x5b3240b6be3e7487d61cd1afdfc7fe4fa1d81e6400000000000000000000037b',
        '0x334c96d792e4b26b841d28f53235281cec1be1f200020000000000000000038a',
        '0x25accb7943fd73dda5e23ba6329085a3c24bfb6a000200000000000000000387',
        '0xe340ebfcaa544da8bb1ee9005f1a346d50ec422e000200000000000000000396',
        '0xae7bfd6fa54259fc477879712eebe34164d3a84f000200000000000000000376',
        '0x4ce0bd7debf13434d3ae127430e9bd4291bfb61f00020000000000000000038b',
        '0x8e85e97ed19c0fa13b2549309965291fbbc0048b0000000000000000000003ba',
        '0x173063a30e095313eee39411f07e95a8a806014e0002000000000000000003ab',
        '0x8167a1117691f39e05e9131cfa88f0e3a620e96700020000000000000000038c',
        '0x798b112420ad6391a4129ac25ef59663a44c88bb0002000000000000000003f4',
        '0x798b112420ad6391a4129ac25ef59663a44c88bb0002000000000000000003f4',
        '0x5512a4bbe7b3051f92324bacf25c02b9000c4a500001000000000000000003d7',
        '0x4edcb2b46377530bc18bb4d2c7fe46a992c73e100000000000000000000003ec',
        '0xd1ec5e215e8148d76f4460e4097fd3d5ae0a35580002000000000000000003d3',
        '0x76fcf0e8c7ff37a47a799fa2cd4c13cde0d981c90002000000000000000003d2',
        '0xc9c5ff67bb2fae526ae2467c359609d6bcb4c5320000000000000000000003cc',
        '0x9c6d47ff73e0f5e51be5fd53236e3f595c5793f200020000000000000000042c',
        '0xff4ce5aaab5a627bf82f4a571ab1ce94aa365ea6000200000000000000000426',
        '0xd590931466cdd6d488a25da1e89dd0539723800c00020000000000000000042b',
        '0x8a34b5ad76f528bfec06c80d85ef3b53da7fc30000020000000000000000043e',
        '0xdb0cbcf1b8282dedc90e8c2cefe11041d6d1e9f0000200000000000000000431',
        '0xe4010ef5e37dc23154680f23c4a0d48bfca91687000200000000000000000432',
        '0xb08885e6026bab4333a80024ec25a1a3e1ff2b8a000200000000000000000445',
        '0x384f67aa430376efc4f8987eabf7f3f84eb9ea5d00020000000000000000043d',
        '0xad0e5e0778cac28f1ff459602b31351871b5754a0002000000000000000003ce',
        '0x00c2a4be503869fa751c2dbcb7156cc970b5a8da000000000000000000000477',
        '0x959216bb492b2efa72b15b7aacea5b5c984c3cca000200000000000000000472',
        '0x50cf90b954958480b8df7958a9e965752f62712400000000000000000000046f',
        '0xa3c500969accb3d8df08cba313c120818fe0ed9d000200000000000000000471',
        '0x831261f44931b7da8ba0dcc547223c60bb75b47f000200000000000000000460',
        '0xfd1cf6fd41f229ca86ada0584c63c49c3d66bbc9000200000000000000000438',
        '0x5aee1e99fe86960377de9f88689616916d5dcabe000000000000000000000467',
        '0x9f9d900462492d4c21e9523ca95a7cd86142f298000200000000000000000462',
        '0x1ee442b5326009bb18f2f472d3e0061513d1a0ff000200000000000000000464',
        '0x5f1f4e50ba51d723f12385a8a9606afc3a0555f5000200000000000000000465',
        '0x4fd4687ec38220f805b6363c3c1e52d0df3b5023000200000000000000000473',
        '0xa718042e5622099e5f0ace4e7122058ab39e1bbe000200000000000000000475',
        '0xb5e3de837f869b0248825e0175da73d4e8c3db6b000200000000000000000474',
        '0x133d241f225750d2c92948e464a5a80111920331000000000000000000000476',
        '0x36be1e97ea98ab43b4debf92742517266f5731a3000200000000000000000466',
        '0x99c88ad7dc566616548adde8ed3effa730eb6c3400000000000000000000049a',
        '0x20b156776114e8a801e9767d90c6ccccc8adf398000000000000000000000499',
        '0x15c1cdacd3da1e1c1304200b1beb080d50bbbc0f00020000000000000000045f',
        '0x483006684f422a9448023b2382615c57c5ecf18f000000000000000000000488',
        '0x60683b05e9a39e3509d8fdb9c959f23170f8a0fa000000000000000000000489',
        '0xd4f79ca0ac83192693bce4699d0c10c66aa6cf0f00020000000000000000047e',
        '0xf16aee6a71af1a9bc8f56975a4c2705ca7a782bc0002000000000000000004bb',
        '0xcaa052584b462198a5a9356c28bce0634d65f65c0000000000000000000004db',
        '0x779d01f939d78a918a3de18cc236ee89221dfd4e0000000000000000000004c7',
        '0x9cc64ee4cb672bc04c54b00a37e1ed75b2cc19dd0002000000000000000004c1',
        '0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7',
        '0xfebb0bbf162e64fb9d0dfe186e517d84c395f016000000000000000000000502',
        '0xe0fcbf4d98f0ad982db260f86cf28b49845403c5000000000000000000000504',
        '0xd278166dabaf26707362f7cfdd204b277fd2a4600002000000000000000004f6',
        '0x08775ccb6674d6bdceb0797c364c2653ed84f3840002000000000000000004f0',
        '0x639883476960a23b38579acfd7d71561a0f408cf000200000000000000000505',
        '0x8bd4a1e74a27182d23b98c10fd21d4fbb0ed4ba00002000000000000000004ed',
        '0x9001cbbd96f54a658ff4e6e65ab564ded76a543100000000000000000000050a',
        '0x87a867f5d240a782d43d90b6b06dea470f3f8f22000200000000000000000516',
        '0x04248aabca09e9a1a3d5129a7ba05b7f17de768400000000000000000000050e',
        '0x68e3266c9c8bbd44ad9dca5afbfe629022aee9fe000200000000000000000512',
        '0x0018c32d85d8aebea2efbe0b0f4a4eb9e4f1c8c900020000000000000000050c',
        '0x02d928e68d8f10c0358566152677db51e1e2dc8c00000000000000000000051e',
        '0xd689abc77b82803f22c49de5c8a0049cc74d11fd000200000000000000000524',
        '0x42fbd9f666aacc0026ca1b88c94259519e03dd67000200000000000000000507',
        '0x3e953c6bf97284f736c5f95b3c3be8f4e48075f4000200000000000000000522',
        '0x793f2d5cd52dfafe7a1a1b0b3988940ba2d6a63d0000000000000000000004f8',
        '0x7e9afd25f5ec0eb24d7d4b089ae7ecb9651c8b1f000000000000000000000511',
        '0x2e848426aec6dbf2260535a5bea048ed94d9ff3d000000000000000000000536',
        '0xec3626fee40ef95e7c0cbb1d495c8b67b34d398300000000000000000000053d',
        '0xeb567dde03f3da7fe185bdacd5ab495ab220769d000000000000000000000548',
        '0xdf2c03c12442c7a0895455a48569b889079ca52a000200000000000000000538',
        '0x380aabe019ed2a9c2d632b51eddd30fd804d0fad000200000000000000000554',
        '0x20a61b948e33879ce7f23e535cc7baa3bc66c5a9000000000000000000000555',
        '0xfcf77141908aa22bfeac216123c5feb2531f373e00000000000000000000054a',
    ],
};
