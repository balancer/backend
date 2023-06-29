import { BigNumber, ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { RocketPoolStakedEthAprService } from '../pool/lib/apr-data-sources/optimism/rocket-pool-staked-eth-apr.service';
import { tokenService } from '../token/token.service';
import { WstethAprService } from '../pool/lib/apr-data-sources/optimism/wsteth-apr.service';
import { OvernightAprService } from '../pool/lib/apr-data-sources/optimism/overnight-apr.service';
import { ReaperCryptAprService } from '../pool/lib/apr-data-sources/reaper-crypt-apr.service';
import { PhantomStableAprService } from '../pool/lib/apr-data-sources/phantom-stable-apr.service';
import { BoostedPoolAprService } from '../pool/lib/apr-data-sources/boosted-pool-apr.service';
import { SwapFeeAprService } from '../pool/lib/apr-data-sources/swap-fee-apr.service';
import { GaugeAprService } from '../pool/lib/apr-data-sources/ve-bal-gauge-apr.service';
import { GaugeStakingService } from '../pool/lib/staking/gauge-staking.service';
import { BeetsPriceHandlerService } from '../token/lib/token-price-handlers/beets-price-handler.service';
import { BptPriceHandlerService } from '../token/lib/token-price-handlers/bpt-price-handler.service';
import { LinearWrappedTokenPriceHandlerService } from '../token/lib/token-price-handlers/linear-wrapped-token-price-handler.service';
import { SwapsPriceHandlerService } from '../token/lib/token-price-handlers/swaps-price-handler.service';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { every } from '../../worker/intervals';
import { SanityContentService } from '../content/sanity-content.service';
import { gaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { coingeckoService } from '../coingecko/coingecko.service';
import { CoingeckoPriceHandlerService } from '../token/lib/token-price-handlers/coingecko-price-handler.service';
import { BeefyVaultAprService } from '../pool/lib/apr-data-sources/beefy-vault-apr.service copy';

const optimismNetworkData: NetworkData = {
    chain: {
        slug: 'optimism',
        id: 10,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x4200000000000000000000000000000000000006',
        prismaId: 'OPTIMISM',
        gqlId: 'OPTIMISM',
    },
    subgraphs: {
        startDate: '2022-01-01',
        balancer: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/beethovenx-v2-optimism',
        beetsBar: 'https://',
        blocks: 'https://api.thegraph.com/subgraphs/name/danielmkm/optimism-blocks',
        gauge: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges-optimism',
        userBalances: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/user-bpt-balances-optimism',
        veBalLocks: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
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
        platformId: 'optimistic-ethereum',
    },
    tokenPrices: {
        maxHourlyPriceHistoryNumDays: 100,
    },
    rpcUrl: 'https://rpc.ankr.com/optimism',
    rpcMaxBlockRange: 2000,
    beetsPriceProviderRpcUrl: 'https://rpc.ftm.tools',
    sanity: {
        projectId: '1g2ag2hb',
        dataset: 'production',
    },
    protocolToken: 'beets',
    beets: {
        address: '0x97513e975a7fa9072c72c92d8000b0db90b163c5',
    },
    bal: {
        address: '0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        delegationProxy: '0x9da18982a33fd0c7051b19f0d7c76f2d5e7e017c',
    },
    balancer: {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        composableStablePoolFactories: [
            '0xf145caFB67081895EE80eB7c04A30Cf87f07b745',
            '0xe2E901AB09f37884BA31622dF3Ca7FC19AA443Be',
            '0x1802953277FD955f9a254B80Aa0582f193cF1d77',
        ],
        weightedPoolV2Factories: [
            '0xad901309d9e9DbC5Df19c84f729f429F0189a633',
            '0xA0DAbEBAAd1b243BBb243f933013d560819eB66f',
            '0x230a59F4d9ADc147480f03B0D3fFfeCd56c3289a',
        ],
        swapProtocolFeePercentage: 0.5,
        yieldProtocolFeePercentage: 0.5,
        poolDataQueryContract: '0x6B5dA774890Db7B7b96C6f44e6a4b0F657399E2e',
    },
    multicall: '0x2DC0E2aa608532Da689e89e237dF582B783E552C',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    masterchef: {
        address: '0x0000000000000000000000000000000000000000',
        excludedFarmIds: [],
    },
    avgBlockSpeed: 1,
    sor: {
        main: {
            url: 'https://nplks2oknz5lhxn6kpgxbfrxgm0hzicm.lambda-url.ca-central-1.on.aws/',
            maxPools: 8,
            forceRefresh: false,
            gasPrice: BigNumber.from(10),
            swapGas: BigNumber.from('1000000'),
        },
        canary: {
            url: 'https://svlitjilcr5qtp7iolimlrlg7e0ipupj.lambda-url.eu-central-1.on.aws/',
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
        linearPoolFactories: [
            '0x19968d4b7126904fd665ed25417599df9604df83',
            '0xe4b88e745dce9084b9fc2439f85a9a4c5cd6f361',
        ],
        averageAPRAcrossLastNHarvests: 2,
    },
    beefy: {
        linearPools: [
            '0x5bdd8c19b44c3e4a15305601a2c9841bde9366f00000000000000000000000ca',
            '0x72d6df381cac8c2283c0b13fe5262a1f5e8e8d1b0000000000000000000000cb',
        ],
    },
    lido: {
        wstEthAprEndpoint: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
        wstEthContract: '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb',
    },
    rocket: {
        rEthContract: '0x9bcef72be871e61ed4fbbc7630889bee758eb81d',
    },
    overnight: {
        aprEndpoint: 'https://api.overnight.fi/optimism',
    },
    datastudio: {
        main: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '1Ifbfh8njyssWKuLlUvlfXt-r3rnd4gAIP5sSM-lEuBU',
            databaseTabName: 'Database v2',
            compositionTabName: 'Pool Composition v2',
            emissionDataTabName: 'EmissionData',
        },
        canary: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '17bYDbQAdMwGevfJ7thiwI8mjYeZppVRi8gD8ER6CtSs',
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

export const optimismNetworkConfig: NetworkConfig = {
    data: optimismNetworkData,
    contentService: new SanityContentService(),
    provider: new ethers.providers.JsonRpcProvider(optimismNetworkData.rpcUrl),
    poolAprServices: [
        new RocketPoolStakedEthAprService(tokenService, optimismNetworkData.rocket!.rEthContract),
        new WstethAprService(tokenService, optimismNetworkData.lido!.wstEthContract),
        new OvernightAprService(optimismNetworkData.overnight!.aprEndpoint, tokenService),
        new ReaperCryptAprService(
            optimismNetworkData.reaper.linearPoolFactories,
            optimismNetworkData.reaper.averageAPRAcrossLastNHarvests,
            optimismNetworkData.stader ? optimismNetworkData.stader.sFtmxContract : undefined,
            optimismNetworkData.lido ? optimismNetworkData.lido.wstEthContract : undefined,
        ),
        new BeefyVaultAprService(optimismNetworkData.beefy.linearPools, tokenService),
        new PhantomStableAprService(),
        new BoostedPoolAprService(),
        new SwapFeeAprService(optimismNetworkData.balancer.swapProtocolFeePercentage),
        new GaugeAprService(gaugeSubgraphService, tokenService, [
            optimismNetworkData.beets.address,
            optimismNetworkData.bal.address,
        ]),
    ],
    poolStakingServices: [new GaugeStakingService(gaugeSubgraphService)],
    tokenPriceHandlers: [
        new BeetsPriceHandlerService(),
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
            name: 'sync-sanity-pool-data',
            interval: every(3, 'minutes'),
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
            name: 'update-fee-volume-yield-all-pools',
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
        {
            name: 'feed-data-to-datastudio',
            interval: every(1, 'minutes'),
        },
    ],
};
