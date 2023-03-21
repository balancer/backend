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
import { GaugeAprService } from '../pool/lib/apr-data-sources/ve-bal-guage-apr.service';
import { GaugeStakingService } from '../pool/lib/staking/gauge-staking.service';
import { BeetsPriceHandlerService } from '../token/lib/token-price-handlers/beets-price-handler.service';
import { CoingeckoPriceHandlerService } from '../token/lib/token-price-handlers/coingecko-price-handler.service';
import { coingeckoService } from '../coingecko/coingecko.service';
import { BptPriceHandlerService } from '../token/lib/token-price-handlers/bpt-price-handler.service';
import { LinearWrappedTokenPriceHandlerService } from '../token/lib/token-price-handlers/linear-wrapped-token-price-handler.service';
import { SwapsPriceHandlerService } from '../token/lib/token-price-handlers/swaps-price-handler.service';
import { UserSyncGaugeBalanceService } from '../user/lib/optimism/user-sync-gauge-balance.service';
import { every } from '../../worker/intervals';
import { SanityContentService } from '../content/sanity-content.service';
import { gaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';

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
    balancer: {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        composableStablePoolFactories: ['0xf145caFB67081895EE80eB7c04A30Cf87f07b745'],
        weightedPoolV2Factories: ['0xad901309d9e9DbC5Df19c84f729f429F0189a633'],
        poolsInRecoveryMode: [
            '0x05e7732bf9ae5592e6aa05afe8cd80f7ab0a7bea',
            '0x359ea8618c405023fc4b98dab1b01f373792a126',
            '0x3fdb6fb126521a28f06893f9629da12f7b7266eb',
            '0x435272180a4125f3b47c92826f482fc6cc165958',
            '0x785f08fb77ec934c01736e30546f87b4daccbe50',
            '0x899f737750db562b88c1e412ee1902980d3a4844',
            '0x981fb05b738e981ac532a99e77170ecb4bc27aef',
            '0xb0de49429fbb80c635432bbad0b3965b28560177',
            '0xc77e5645dbe48d54afc06655e39d3fe17eb76c1c',
            '0xe0b50b0635b90f7021d2618f76ab9a31b92d0094',
            '0xf30db0ca4605e5115df91b56bd299564dca02666',
            '0x1f131ec1175f023ee1534b16fa8ab237c00e2381',
            '0x428e1cc3099cf461b87d124957a0d48273f334b1',
            '0x479a7d1fcdd71ce0c2ed3184bfbe9d23b92e8337',
            '0x593acbfb1eaf3b6ec86fa60325d816996fdcbc0d',
            '0x6222ae1d2a9f6894da50aa25cb7b303497f9bebd',
            '0x62de5ca16a618e22f6dfe5315ebd31acb10c44b6',
            '0x7d6bff131b359da66d92f215fd4e186003bfaa42',
            '0x96a78983932b8739d1117b16d30c15607926b0c5',
            '0x9964b1bd3cc530e5c58ba564e45d45290f677be2',
            '0xb0f2c34b9cd5c377c5efbba3b31e67114810cbc8',
            '0xb1c9ac57594e9b1ec0f3787d9f6744ef4cb0a024',
            '0xde45f101250f2ca1c0f8adfc172576d10c12072d',
            '0xf572649606db4743d217a2fa6e8b8eb79742c24a',
            '0x373b347bc87998b151a5e9b6bb6ca692b766648a',
        ],
        swapProtocolFeePercentage: 0.5,
        yieldProtocolFeePercentage: 0.5,
    },
    multicall: '0x2DC0E2aa608532Da689e89e237dF582B783E552C',
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
        linearPoolFactories: [
            '0x19968d4b7126904fd665ed25417599df9604df83',
            '0xe4b88e745dce9084b9fc2439f85a9a4c5cd6f361',
        ],
        averageAPRAcrossLastNHarvests: 2,
    },
    lido: {
        wstEthAprEndpoint: 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma',
        wstEthContract: '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb',
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
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
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
        new RocketPoolStakedEthAprService(tokenService, optimismNetworkData.balancer.yieldProtocolFeePercentage),
        new WstethAprService(
            tokenService,
            optimismNetworkData.lido!.wstEthAprEndpoint,
            optimismNetworkData.lido!.wstEthContract,
            optimismNetworkData.balancer.yieldProtocolFeePercentage,
        ),
        new OvernightAprService(optimismNetworkData.overnight!.aprEndpoint, tokenService),
        new ReaperCryptAprService(
            optimismNetworkData.reaper.linearPoolFactories,
            optimismNetworkData.reaper.averageAPRAcrossLastNHarvests,
            tokenService,
        ),
        new PhantomStableAprService(optimismNetworkData.balancer.yieldProtocolFeePercentage),
        new BoostedPoolAprService(optimismNetworkData.balancer.yieldProtocolFeePercentage),
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
    workerJobs: [
        {
            name: 'update-token-prices',
            interval: every(2, 'minutes'),
        },
        {
            name: 'update-liquidity-for-inactive-pools',
            interval: every(1, 'days'),
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
        },
        {
            name: 'user-sync-wallet-balances-for-all-pools',
            interval: every(10, 'seconds'),
        },
        {
            name: 'user-sync-staked-balances',
            interval: every(10, 'seconds'),
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
        },
    ],
};
