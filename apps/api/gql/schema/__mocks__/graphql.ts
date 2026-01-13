import {
    CreateLbpInput,
    Erc4626ReviewData,
    ExitFeeHookParams,
    FeeTakingHookParams,
    GqlAggregatorPoolFilter,
    GqlBalancePoolAprItem,
    GqlBalancePoolAprSubItem,
    GqlFeaturePoolGroupItemExternalLink,
    GqlHistoricalTokenPrice,
    GqlHistoricalTokenPriceEntry,
    GqlHook,
    GqlHookData,
    GqlHookReviewData,
    GqlLbpTopTrade,
    GqlLoopsData,
    GqlNestedPool,
    GqlPoolAddRemoveEventV3,
    GqlPoolAggregator,
    GqlPoolApr,
    GqlPoolAprItem,
    GqlPoolAprRange,
    GqlPoolAprTotal,
    GqlPoolBase,
    GqlPoolComposableStable,
    GqlPoolComposableStableNested,
    GqlPoolDynamicData,
    GqlPoolElement,
    GqlPoolEvent,
    GqlPoolEventAmount,
    GqlPoolEventsFilter,
    GqlPoolFeaturedPool,
    GqlPoolFeaturedPoolGroup,
    GqlPoolFilter,
    GqlPoolFx,
    GqlPoolGyro,
    GqlPoolInvestConfig,
    GqlPoolInvestOption,
    GqlPoolJoinExit,
    GqlPoolJoinExitAmount,
    GqlPoolLiquidityBootstrapping,
    GqlPoolLiquidityBootstrappingV3,
    GqlPoolMetaStable,
    GqlPoolMinimal,
    GqlPoolMutationResult,
    GqlPoolQuantAmmWeighted,
    GqlPoolReClamm,
    GqlPoolSnapshot,
    GqlPoolStable,
    GqlPoolStaking,
    GqlPoolStakingAura,
    GqlPoolStakingFarmRewarder,
    GqlPoolStakingGauge,
    GqlPoolStakingGaugeReward,
    GqlPoolStakingMasterChefFarm,
    GqlPoolStakingOtherGauge,
    GqlPoolStakingReliquaryFarm,
    GqlPoolStakingReliquaryFarmLevel,
    GqlPoolStakingVebal,
    GqlPoolSwap,
    GqlPoolSwapEventCowAmm,
    GqlPoolSwapEventV3,
    GqlPoolTimePeriod,
    GqlPoolToken,
    GqlPoolTokenBase,
    GqlPoolTokenComposableStable,
    GqlPoolTokenDetail,
    GqlPoolTokenDisplay,
    GqlPoolTokenExpanded,
    GqlPoolUserBalance,
    GqlPoolUserSwapVolume,
    GqlPoolWeighted,
    GqlPoolWithdrawConfig,
    GqlPoolWithdrawOption,
    GqlPriceImpact,
    GqlPriceRateProviderData,
    GqlPriceRateProviderUpgradeableComponent,
    GqlProtocolMetricsAggregated,
    GqlProtocolMetricsChain,
    GqlRelicSnapshot,
    GqlReliquaryFarmLevelSnapshot,
    GqlReliquaryFarmSnapshot,
    GqlSftmxStakingData,
    GqlSftmxStakingSnapshot,
    GqlSftmxStakingVault,
    GqlSftmxWithdrawalRequests,
    GqlSorCallData,
    GqlSorGetSwapPaths,
    GqlSorPath,
    GqlSorSwap,
    GqlSorSwapRoute,
    GqlSorSwapRouteHop,
    GqlStakedSonicData,
    GqlStakedSonicDelegatedValidator,
    GqlStakedSonicSnapshot,
    GqlSwapCallDataInput,
    GqlToken,
    GqlTokenAmountHumanReadable,
    GqlTokenCandlestickChartDataItem,
    GqlTokenData,
    GqlTokenDynamicData,
    GqlTokenFilter,
    GqlTokenMutationResult,
    GqlTokenPrice,
    GqlTokenPriceChartDataItem,
    GqlUserFbeetsBalance,
    GqlUserPoolBalance,
    GqlUserStakedBalance,
    GqlUserSwapVolumeFilter,
    GqlVeBalBalance,
    GqlVeBalLockSnapshot,
    GqlVeBalUserData,
    GqlVotingGauge,
    GqlVotingGaugeToken,
    GqlVotingPool,
    HookConfig,
    LbpMetadataInput,
    LbpPriceChartData,
    LbPoolInput,
    LiquidityBootstrappingPoolV3Params,
    LiquidityManagement,
    MevTaxHookParams,
    Mutation,
    QuantAmmWeightedDetail,
    QuantAmmWeightSnapshot,
    QuantAmmWeightedParams,
    Query,
    StableSurgeHookParams,
    Token,
    GqlChain,
    GqlHookType,
    GqlPoolAprItemType,
    GqlPoolEventType,
    GqlPoolEventsDataRange,
    GqlPoolFilterCategory,
    GqlPoolJoinExitType,
    GqlPoolNestingType,
    GqlPoolOrderBy,
    GqlPoolOrderDirection,
    GqlPoolSnapshotDataRange,
    GqlPoolStakingGaugeStatus,
    GqlPoolStakingType,
    GqlPoolType,
    GqlSftmxStakingSnapshotDataRange,
    GqlSorSwapType,
    GqlStakedSonicSnapshotDataRange,
    GqlTokenChartDataRange,
    GqlTokenType,
} from './types';

export const aCreateLbpInput = (overrides?: Partial<CreateLbpInput>): CreateLbpInput => {
    return {
        metadata: overrides && overrides.hasOwnProperty('metadata') ? overrides.metadata! : aLbpMetadataInput(),
        poolContract: overrides && overrides.hasOwnProperty('poolContract') ? overrides.poolContract! : aLbPoolInput(),
    };
};

export const anErc4626ReviewData = (overrides?: Partial<Erc4626ReviewData>): Erc4626ReviewData => {
    return {
        canUseBufferForSwaps:
            overrides && overrides.hasOwnProperty('canUseBufferForSwaps') ? overrides.canUseBufferForSwaps! : true,
        reviewFile: overrides && overrides.hasOwnProperty('reviewFile') ? overrides.reviewFile! : 'abeo',
        summary: overrides && overrides.hasOwnProperty('summary') ? overrides.summary! : 'solium',
        useUnderlyingForAddRemove:
            overrides && overrides.hasOwnProperty('useUnderlyingForAddRemove')
                ? overrides.useUnderlyingForAddRemove!
                : true,
        useWrappedForAddRemove:
            overrides && overrides.hasOwnProperty('useWrappedForAddRemove') ? overrides.useWrappedForAddRemove! : false,
        warnings: overrides && overrides.hasOwnProperty('warnings') ? overrides.warnings! : ['qui'],
    };
};

export const anExitFeeHookParams = (overrides?: Partial<ExitFeeHookParams>): ExitFeeHookParams => {
    return {
        exitFeePercentage:
            overrides && overrides.hasOwnProperty('exitFeePercentage') ? overrides.exitFeePercentage! : 'aspernatur',
    };
};

export const aFeeTakingHookParams = (overrides?: Partial<FeeTakingHookParams>): FeeTakingHookParams => {
    return {
        addLiquidityFeePercentage:
            overrides && overrides.hasOwnProperty('addLiquidityFeePercentage')
                ? overrides.addLiquidityFeePercentage!
                : 'laboriosam',
        removeLiquidityFeePercentage:
            overrides && overrides.hasOwnProperty('removeLiquidityFeePercentage')
                ? overrides.removeLiquidityFeePercentage!
                : 'confugo',
        swapFeePercentage:
            overrides && overrides.hasOwnProperty('swapFeePercentage') ? overrides.swapFeePercentage! : 'delectatio',
    };
};

export const aGqlAggregatorPoolFilter = (overrides?: Partial<GqlAggregatorPoolFilter>): GqlAggregatorPoolFilter => {
    return {
        chainIn: overrides && overrides.hasOwnProperty('chainIn') ? overrides.chainIn! : [GqlChain.ARBITRUM],
        chainNotIn: overrides && overrides.hasOwnProperty('chainNotIn') ? overrides.chainNotIn! : [GqlChain.ARBITRUM],
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : aGqlPoolTimePeriod(),
        idIn: overrides && overrides.hasOwnProperty('idIn') ? overrides.idIn! : ['cognatus'],
        idNotIn: overrides && overrides.hasOwnProperty('idNotIn') ? overrides.idNotIn! : ['confido'],
        includeHooks:
            overrides && overrides.hasOwnProperty('includeHooks') ? overrides.includeHooks! : [GqlHookType.AKRON],
        minTvl: overrides && overrides.hasOwnProperty('minTvl') ? overrides.minTvl! : 8.5,
        poolTypeIn:
            overrides && overrides.hasOwnProperty('poolTypeIn')
                ? overrides.poolTypeIn!
                : [GqlPoolType.COMPOSABLE_STABLE],
        poolTypeNotIn:
            overrides && overrides.hasOwnProperty('poolTypeNotIn')
                ? overrides.poolTypeNotIn!
                : [GqlPoolType.COMPOSABLE_STABLE],
        protocolVersionIn:
            overrides && overrides.hasOwnProperty('protocolVersionIn') ? overrides.protocolVersionIn! : [9819],
        tokensIn: overrides && overrides.hasOwnProperty('tokensIn') ? overrides.tokensIn! : ['canonicus'],
        tokensNotIn: overrides && overrides.hasOwnProperty('tokensNotIn') ? overrides.tokensNotIn! : ['tergo'],
    };
};

export const aGqlBalancePoolAprItem = (overrides?: Partial<GqlBalancePoolAprItem>): GqlBalancePoolAprItem => {
    return {
        apr: overrides && overrides.hasOwnProperty('apr') ? overrides.apr! : aGqlPoolAprRange(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '01b01916-e96e-4d48-8b85-6b74adb701f4',
        subItems:
            overrides && overrides.hasOwnProperty('subItems') ? overrides.subItems! : [aGqlBalancePoolAprSubItem()],
        title: overrides && overrides.hasOwnProperty('title') ? overrides.title! : 'thema',
    };
};

export const aGqlBalancePoolAprSubItem = (overrides?: Partial<GqlBalancePoolAprSubItem>): GqlBalancePoolAprSubItem => {
    return {
        apr: overrides && overrides.hasOwnProperty('apr') ? overrides.apr! : aGqlPoolAprRange(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '594c10ef-3e65-4afb-a160-f5f442e0ddaf',
        title: overrides && overrides.hasOwnProperty('title') ? overrides.title! : 'subseco',
    };
};

export const aGqlFeaturePoolGroupItemExternalLink = (
    overrides?: Partial<GqlFeaturePoolGroupItemExternalLink>,
): GqlFeaturePoolGroupItemExternalLink => {
    return {
        buttonText: overrides && overrides.hasOwnProperty('buttonText') ? overrides.buttonText! : 'cornu',
        buttonUrl: overrides && overrides.hasOwnProperty('buttonUrl') ? overrides.buttonUrl! : 'concedo',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'b3ea89e7-7c0f-4b7f-99b9-ae0fda62eca5',
        image: overrides && overrides.hasOwnProperty('image') ? overrides.image! : 'sollers',
    };
};

export const aGqlHistoricalTokenPrice = (overrides?: Partial<GqlHistoricalTokenPrice>): GqlHistoricalTokenPrice => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'statua',
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        prices: overrides && overrides.hasOwnProperty('prices') ? overrides.prices! : [aGqlHistoricalTokenPriceEntry()],
    };
};

export const aGqlHistoricalTokenPriceEntry = (
    overrides?: Partial<GqlHistoricalTokenPriceEntry>,
): GqlHistoricalTokenPriceEntry => {
    return {
        price: overrides && overrides.hasOwnProperty('price') ? overrides.price! : 6,
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 'tepidus',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 1511,
        updatedBy: overrides && overrides.hasOwnProperty('updatedBy') ? overrides.updatedBy! : 'angelus',
    };
};

export const aGqlHook = (overrides?: Partial<GqlHook>): GqlHook => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'conor',
        config: overrides && overrides.hasOwnProperty('config') ? overrides.config! : aHookConfig(),
        dynamicData: overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlHookData(),
        enableHookAdjustedAmounts:
            overrides && overrides.hasOwnProperty('enableHookAdjustedAmounts')
                ? overrides.enableHookAdjustedAmounts!
                : true,
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'sonitus',
        params: overrides && overrides.hasOwnProperty('params') ? overrides.params! : anExitFeeHookParams(),
        reviewData: overrides && overrides.hasOwnProperty('reviewData') ? overrides.reviewData! : aGqlHookReviewData(),
        shouldCallAfterAddLiquidity:
            overrides && overrides.hasOwnProperty('shouldCallAfterAddLiquidity')
                ? overrides.shouldCallAfterAddLiquidity!
                : false,
        shouldCallAfterInitialize:
            overrides && overrides.hasOwnProperty('shouldCallAfterInitialize')
                ? overrides.shouldCallAfterInitialize!
                : false,
        shouldCallAfterRemoveLiquidity:
            overrides && overrides.hasOwnProperty('shouldCallAfterRemoveLiquidity')
                ? overrides.shouldCallAfterRemoveLiquidity!
                : true,
        shouldCallAfterSwap:
            overrides && overrides.hasOwnProperty('shouldCallAfterSwap') ? overrides.shouldCallAfterSwap! : false,
        shouldCallBeforeAddLiquidity:
            overrides && overrides.hasOwnProperty('shouldCallBeforeAddLiquidity')
                ? overrides.shouldCallBeforeAddLiquidity!
                : true,
        shouldCallBeforeInitialize:
            overrides && overrides.hasOwnProperty('shouldCallBeforeInitialize')
                ? overrides.shouldCallBeforeInitialize!
                : false,
        shouldCallBeforeRemoveLiquidity:
            overrides && overrides.hasOwnProperty('shouldCallBeforeRemoveLiquidity')
                ? overrides.shouldCallBeforeRemoveLiquidity!
                : false,
        shouldCallBeforeSwap:
            overrides && overrides.hasOwnProperty('shouldCallBeforeSwap') ? overrides.shouldCallBeforeSwap! : false,
        shouldCallComputeDynamicSwapFee:
            overrides && overrides.hasOwnProperty('shouldCallComputeDynamicSwapFee')
                ? overrides.shouldCallComputeDynamicSwapFee!
                : true,
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlHookType.AKRON,
    };
};

export const aGqlHookData = (overrides?: Partial<GqlHookData>): GqlHookData => {
    return {
        addLiquidityFeePercentage:
            overrides && overrides.hasOwnProperty('addLiquidityFeePercentage')
                ? overrides.addLiquidityFeePercentage!
                : 'abeo',
        maxSurgeFeePercentage:
            overrides && overrides.hasOwnProperty('maxSurgeFeePercentage') ? overrides.maxSurgeFeePercentage! : 'surgo',
        removeLiquidityFeePercentage:
            overrides && overrides.hasOwnProperty('removeLiquidityFeePercentage')
                ? overrides.removeLiquidityFeePercentage!
                : 'tergum',
        surgeThresholdPercentage:
            overrides && overrides.hasOwnProperty('surgeThresholdPercentage')
                ? overrides.surgeThresholdPercentage!
                : 'voluntarius',
        swapFeePercentage:
            overrides && overrides.hasOwnProperty('swapFeePercentage') ? overrides.swapFeePercentage! : 'ipsam',
    };
};

export const aGqlHookReviewData = (overrides?: Partial<GqlHookReviewData>): GqlHookReviewData => {
    return {
        reviewFile: overrides && overrides.hasOwnProperty('reviewFile') ? overrides.reviewFile! : 'curvo',
        summary: overrides && overrides.hasOwnProperty('summary') ? overrides.summary! : 'coniecto',
        warnings: overrides && overrides.hasOwnProperty('warnings') ? overrides.warnings! : ['pecto'],
    };
};

export const aGqlLbpTopTrade = (overrides?: Partial<GqlLbpTopTrade>): GqlLbpTopTrade => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'denique',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 'centum',
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'stips',
    };
};

export const aGqlLoopsData = (overrides?: Partial<GqlLoopsData>): GqlLoopsData => {
    return {
        actualSupply: overrides && overrides.hasOwnProperty('actualSupply') ? overrides.actualSupply! : 'varietas',
        apr: overrides && overrides.hasOwnProperty('apr') ? overrides.apr! : 8,
        collateralAmount:
            overrides && overrides.hasOwnProperty('collateralAmount') ? overrides.collateralAmount! : 'acidus',
        collateralAmountInEth:
            overrides && overrides.hasOwnProperty('collateralAmountInEth')
                ? overrides.collateralAmountInEth!
                : 'agnosco',
        debtAmount: overrides && overrides.hasOwnProperty('debtAmount') ? overrides.debtAmount! : 'uxor',
        healthFactor: overrides && overrides.hasOwnProperty('healthFactor') ? overrides.healthFactor! : 'asper',
        leverage: overrides && overrides.hasOwnProperty('leverage') ? overrides.leverage! : 2.8,
        nav: overrides && overrides.hasOwnProperty('nav') ? overrides.nav! : 'praesentium',
        rate: overrides && overrides.hasOwnProperty('rate') ? overrides.rate! : 'acceptus',
        stSAaveMarketSupply:
            overrides && overrides.hasOwnProperty('stSAaveMarketSupply') ? overrides.stSAaveMarketSupply! : 'absorbeo',
        stSAaveMarketSupplyCap:
            overrides && overrides.hasOwnProperty('stSAaveMarketSupplyCap')
                ? overrides.stSAaveMarketSupplyCap!
                : 'volaticus',
        tvl: overrides && overrides.hasOwnProperty('tvl') ? overrides.tvl! : 'apud',
    };
};

export const aGqlNestedPool = (overrides?: Partial<GqlNestedPool>): GqlNestedPool => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'recusandae',
        bptPriceRate: overrides && overrides.hasOwnProperty('bptPriceRate') ? overrides.bptPriceRate! : 'amitto',
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 4709,
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'nostrum',
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '8260572d-23c5-4296-b784-6475b2d4e6e9',
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'sub',
        nestedLiquidity:
            overrides && overrides.hasOwnProperty('nestedLiquidity') ? overrides.nestedLiquidity! : 'ultra',
        nestedPercentage:
            overrides && overrides.hasOwnProperty('nestedPercentage') ? overrides.nestedPercentage! : 'utilis',
        nestedShares: overrides && overrides.hasOwnProperty('nestedShares') ? overrides.nestedShares! : 'cupio',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'cumque',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'autem',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'eius',
        swapFee: overrides && overrides.hasOwnProperty('swapFee') ? overrides.swapFee! : 'consequatur',
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'cavus',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'vociferor',
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolTokenDetail()],
        totalLiquidity: overrides && overrides.hasOwnProperty('totalLiquidity') ? overrides.totalLiquidity! : 'vir',
        totalShares: overrides && overrides.hasOwnProperty('totalShares') ? overrides.totalShares! : 'deporto',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 5014,
    };
};

export const aGqlPoolAddRemoveEventV3 = (overrides?: Partial<GqlPoolAddRemoveEventV3>): GqlPoolAddRemoveEventV3 => {
    return {
        blockNumber: overrides && overrides.hasOwnProperty('blockNumber') ? overrides.blockNumber! : 7419,
        blockTimestamp: overrides && overrides.hasOwnProperty('blockTimestamp') ? overrides.blockTimestamp! : 3691,
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '1c522128-0a83-4c14-bc33-fb2cde2ada36',
        logIndex: overrides && overrides.hasOwnProperty('logIndex') ? overrides.logIndex! : 2895,
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'venia',
        sender: overrides && overrides.hasOwnProperty('sender') ? overrides.sender! : 'amita',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 26,
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolEventAmount()],
        tx: overrides && overrides.hasOwnProperty('tx') ? overrides.tx! : 'delego',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolEventType.ADD,
        userAddress: overrides && overrides.hasOwnProperty('userAddress') ? overrides.userAddress! : 'cui',
        valueUSD: overrides && overrides.hasOwnProperty('valueUSD') ? overrides.valueUSD! : 1,
    };
};

export const aGqlPoolAggregator = (overrides?: Partial<GqlPoolAggregator>): GqlPoolAggregator => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'venio',
        alpha: overrides && overrides.hasOwnProperty('alpha') ? overrides.alpha! : 'qui',
        amp: overrides && overrides.hasOwnProperty('amp') ? overrides.amp! : 'vilicus',
        beta: overrides && overrides.hasOwnProperty('beta') ? overrides.beta! : 'tredecim',
        c: overrides && overrides.hasOwnProperty('c') ? overrides.c! : 'cena',
        centerednessMargin:
            overrides && overrides.hasOwnProperty('centerednessMargin') ? overrides.centerednessMargin! : 'carmen',
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 1115,
        currentFourthRootPriceRatio:
            overrides && overrides.hasOwnProperty('currentFourthRootPriceRatio')
                ? overrides.currentFourthRootPriceRatio!
                : 'turpis',
        dSq: overrides && overrides.hasOwnProperty('dSq') ? overrides.dSq! : 'comedo',
        dailyPriceShiftBase:
            overrides && overrides.hasOwnProperty('dailyPriceShiftBase') ? overrides.dailyPriceShiftBase! : 'iure',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 1272,
        delta: overrides && overrides.hasOwnProperty('delta') ? overrides.delta! : 'calcar',
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        endFourthRootPriceRatio:
            overrides && overrides.hasOwnProperty('endFourthRootPriceRatio')
                ? overrides.endFourthRootPriceRatio!
                : 'vinitor',
        epsilon: overrides && overrides.hasOwnProperty('epsilon') ? overrides.epsilon! : 'traho',
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'territo',
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'a295074e-2d9d-4f2a-ae6f-884b6022963d',
        lambda: overrides && overrides.hasOwnProperty('lambda') ? overrides.lambda! : 'fugiat',
        lastTimestamp: overrides && overrides.hasOwnProperty('lastTimestamp') ? overrides.lastTimestamp! : 3879,
        lastVirtualBalances:
            overrides && overrides.hasOwnProperty('lastVirtualBalances') ? overrides.lastVirtualBalances! : ['defaeco'],
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'claudeo',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'voco',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'solutio',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'curis',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        priceRatioUpdateEndTime:
            overrides && overrides.hasOwnProperty('priceRatioUpdateEndTime')
                ? overrides.priceRatioUpdateEndTime!
                : 9161,
        priceRatioUpdateStartTime:
            overrides && overrides.hasOwnProperty('priceRatioUpdateStartTime')
                ? overrides.priceRatioUpdateStartTime!
                : 5224,
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 2767,
        quantAmmWeightedParams:
            overrides && overrides.hasOwnProperty('quantAmmWeightedParams')
                ? overrides.quantAmmWeightedParams!
                : aQuantAmmWeightedParams(),
        root3Alpha: overrides && overrides.hasOwnProperty('root3Alpha') ? overrides.root3Alpha! : 'vae',
        s: overrides && overrides.hasOwnProperty('s') ? overrides.s! : 'vix',
        sqrtAlpha: overrides && overrides.hasOwnProperty('sqrtAlpha') ? overrides.sqrtAlpha! : 'decet',
        sqrtBeta: overrides && overrides.hasOwnProperty('sqrtBeta') ? overrides.sqrtBeta! : 'aiunt',
        startFourthRootPriceRatio:
            overrides && overrides.hasOwnProperty('startFourthRootPriceRatio')
                ? overrides.startFourthRootPriceRatio!
                : 'somniculosus',
        swapFeeManager:
            overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'victoria',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'verumtamen',
        tauAlphaX: overrides && overrides.hasOwnProperty('tauAlphaX') ? overrides.tauAlphaX! : 'conscendo',
        tauAlphaY: overrides && overrides.hasOwnProperty('tauAlphaY') ? overrides.tauAlphaY! : 'amplexus',
        tauBetaX: overrides && overrides.hasOwnProperty('tauBetaX') ? overrides.tauBetaX! : 'cubitum',
        tauBetaY: overrides && overrides.hasOwnProperty('tauBetaY') ? overrides.tauBetaY! : 'appono',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        u: overrides && overrides.hasOwnProperty('u') ? overrides.u! : 'conforto',
        v: overrides && overrides.hasOwnProperty('v') ? overrides.v! : 'argumentum',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 1793,
        w: overrides && overrides.hasOwnProperty('w') ? overrides.w! : 'clamo',
        z: overrides && overrides.hasOwnProperty('z') ? overrides.z! : 'subnecto',
    };
};

export const aGqlPoolApr = (overrides?: Partial<GqlPoolApr>): GqlPoolApr => {
    return {
        apr: overrides && overrides.hasOwnProperty('apr') ? overrides.apr! : aGqlPoolAprRange(),
        hasRewardApr: overrides && overrides.hasOwnProperty('hasRewardApr') ? overrides.hasRewardApr! : false,
        items: overrides && overrides.hasOwnProperty('items') ? overrides.items! : [aGqlBalancePoolAprItem()],
        nativeRewardApr:
            overrides && overrides.hasOwnProperty('nativeRewardApr') ? overrides.nativeRewardApr! : aGqlPoolAprRange(),
        swapApr: overrides && overrides.hasOwnProperty('swapApr') ? overrides.swapApr! : 'aliquam',
        thirdPartyApr:
            overrides && overrides.hasOwnProperty('thirdPartyApr') ? overrides.thirdPartyApr! : aGqlPoolAprRange(),
    };
};

export const aGqlPoolAprItem = (overrides?: Partial<GqlPoolAprItem>): GqlPoolAprItem => {
    return {
        apr: overrides && overrides.hasOwnProperty('apr') ? overrides.apr! : 3.3,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '4a8386be-3f18-419e-8052-a59ea5b5e6d9',
        rewardTokenAddress:
            overrides && overrides.hasOwnProperty('rewardTokenAddress') ? overrides.rewardTokenAddress! : 'video',
        rewardTokenSymbol:
            overrides && overrides.hasOwnProperty('rewardTokenSymbol') ? overrides.rewardTokenSymbol! : 'adduco',
        title: overrides && overrides.hasOwnProperty('title') ? overrides.title! : 'pel',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolAprItemType.AURA,
    };
};

export const aGqlPoolAprRange = (overrides?: Partial<GqlPoolAprRange>): GqlPoolAprRange => {
    return {
        max: overrides && overrides.hasOwnProperty('max') ? overrides.max! : 'aestus',
        min: overrides && overrides.hasOwnProperty('min') ? overrides.min! : 'vulnero',
    };
};

export const aGqlPoolAprTotal = (overrides?: Partial<GqlPoolAprTotal>): GqlPoolAprTotal => {
    return {
        total: overrides && overrides.hasOwnProperty('total') ? overrides.total! : 'adulescens',
    };
};

export const aGqlPoolBase = (overrides?: Partial<GqlPoolBase>): GqlPoolBase => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'terminatio',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 480,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 7138,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'vehemens',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : false,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : true,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : false,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'da48fb0a-0c12-43a4-a034-d4dce7b6001c',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'umbra',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'cimentarius',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'suasoria',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'ubi',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 6915,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager:
            overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'acceptus',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'desino',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['spectaculum'],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 3019,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 6596,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolComposableStable = (overrides?: Partial<GqlPoolComposableStable>): GqlPoolComposableStable => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'demonstro',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        amp: overrides && overrides.hasOwnProperty('amp') ? overrides.amp! : 'vacuus',
        bptPriceRate: overrides && overrides.hasOwnProperty('bptPriceRate') ? overrides.bptPriceRate! : 'utrimque',
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 2374,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 4357,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'timidus',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : false,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : false,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : true,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'c132904a-450c-44f0-a791-f295cba2cff6',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'thesaurus',
        nestingType:
            overrides && overrides.hasOwnProperty('nestingType')
                ? overrides.nestingType!
                : GqlPoolNestingType.HAS_ONLY_PHANTOM_BPT,
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'vigor',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'aiunt',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'enim',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 5105,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'solutio',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'deduco',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['averto'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 2165,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 4219,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolComposableStableNested = (
    overrides?: Partial<GqlPoolComposableStableNested>,
): GqlPoolComposableStableNested => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'confugo',
        amp: overrides && overrides.hasOwnProperty('amp') ? overrides.amp! : 'crudelis',
        bptPriceRate: overrides && overrides.hasOwnProperty('bptPriceRate') ? overrides.bptPriceRate! : 'conqueror',
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 9574,
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'thermae',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '5ed56da0-237c-4907-a52d-d7f0344a5720',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'valde',
        nestingType:
            overrides && overrides.hasOwnProperty('nestingType')
                ? overrides.nestingType!
                : GqlPoolNestingType.HAS_ONLY_PHANTOM_BPT,
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'aegrotatio',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'trucido',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'numquam',
        swapFee: overrides && overrides.hasOwnProperty('swapFee') ? overrides.swapFee! : 'tumultus',
        swapFeeManager:
            overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'delectus',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'teres',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['utor'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        totalLiquidity:
            overrides && overrides.hasOwnProperty('totalLiquidity') ? overrides.totalLiquidity! : 'velociter',
        totalShares: overrides && overrides.hasOwnProperty('totalShares') ? overrides.totalShares! : 'sto',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 8747,
    };
};

export const aGqlPoolDynamicData = (overrides?: Partial<GqlPoolDynamicData>): GqlPoolDynamicData => {
    return {
        aggregateSwapFee:
            overrides && overrides.hasOwnProperty('aggregateSwapFee') ? overrides.aggregateSwapFee! : 'turpis',
        aggregateYieldFee:
            overrides && overrides.hasOwnProperty('aggregateYieldFee') ? overrides.aggregateYieldFee! : 'tertius',
        apr: overrides && overrides.hasOwnProperty('apr') ? overrides.apr! : aGqlPoolApr(),
        aprItems: overrides && overrides.hasOwnProperty('aprItems') ? overrides.aprItems! : [aGqlPoolAprItem()],
        fees24h: overrides && overrides.hasOwnProperty('fees24h') ? overrides.fees24h! : 'iusto',
        fees24hAth: overrides && overrides.hasOwnProperty('fees24hAth') ? overrides.fees24hAth! : 'ara',
        fees24hAthTimestamp:
            overrides && overrides.hasOwnProperty('fees24hAthTimestamp') ? overrides.fees24hAthTimestamp! : 44,
        fees24hAtl: overrides && overrides.hasOwnProperty('fees24hAtl') ? overrides.fees24hAtl! : 'cubo',
        fees24hAtlTimestamp:
            overrides && overrides.hasOwnProperty('fees24hAtlTimestamp') ? overrides.fees24hAtlTimestamp! : 4398,
        fees48h: overrides && overrides.hasOwnProperty('fees48h') ? overrides.fees48h! : 'tristis',
        holdersCount: overrides && overrides.hasOwnProperty('holdersCount') ? overrides.holdersCount! : 'eveniet',
        isInRecoveryMode:
            overrides && overrides.hasOwnProperty('isInRecoveryMode') ? overrides.isInRecoveryMode! : true,
        isPaused: overrides && overrides.hasOwnProperty('isPaused') ? overrides.isPaused! : false,
        lifetimeSwapFees:
            overrides && overrides.hasOwnProperty('lifetimeSwapFees') ? overrides.lifetimeSwapFees! : 'coadunatio',
        lifetimeVolume: overrides && overrides.hasOwnProperty('lifetimeVolume') ? overrides.lifetimeVolume! : 'statim',
        poolId:
            overrides && overrides.hasOwnProperty('poolId')
                ? overrides.poolId!
                : '9accbc9f-7c4d-43bd-babe-358b6a23e287',
        protocolFees24h:
            overrides && overrides.hasOwnProperty('protocolFees24h') ? overrides.protocolFees24h! : 'assumenda',
        protocolFees48h:
            overrides && overrides.hasOwnProperty('protocolFees48h') ? overrides.protocolFees48h! : 'suadeo',
        protocolYieldCapture24h:
            overrides && overrides.hasOwnProperty('protocolYieldCapture24h')
                ? overrides.protocolYieldCapture24h!
                : 'balbus',
        protocolYieldCapture48h:
            overrides && overrides.hasOwnProperty('protocolYieldCapture48h')
                ? overrides.protocolYieldCapture48h!
                : 'aegre',
        sharePriceAth: overrides && overrides.hasOwnProperty('sharePriceAth') ? overrides.sharePriceAth! : 'substantia',
        sharePriceAthTimestamp:
            overrides && overrides.hasOwnProperty('sharePriceAthTimestamp') ? overrides.sharePriceAthTimestamp! : 9956,
        sharePriceAtl: overrides && overrides.hasOwnProperty('sharePriceAtl') ? overrides.sharePriceAtl! : 'ipsa',
        sharePriceAtlTimestamp:
            overrides && overrides.hasOwnProperty('sharePriceAtlTimestamp') ? overrides.sharePriceAtlTimestamp! : 520,
        surplus24h: overrides && overrides.hasOwnProperty('surplus24h') ? overrides.surplus24h! : 'venia',
        surplus48h: overrides && overrides.hasOwnProperty('surplus48h') ? overrides.surplus48h! : 'usque',
        swapEnabled: overrides && overrides.hasOwnProperty('swapEnabled') ? overrides.swapEnabled! : true,
        swapFee: overrides && overrides.hasOwnProperty('swapFee') ? overrides.swapFee! : 'sponte',
        swapsCount: overrides && overrides.hasOwnProperty('swapsCount') ? overrides.swapsCount! : 'decens',
        totalLiquidity:
            overrides && overrides.hasOwnProperty('totalLiquidity') ? overrides.totalLiquidity! : 'adimpleo',
        totalLiquidity24hAgo:
            overrides && overrides.hasOwnProperty('totalLiquidity24hAgo') ? overrides.totalLiquidity24hAgo! : 'denique',
        totalLiquidityAth:
            overrides && overrides.hasOwnProperty('totalLiquidityAth') ? overrides.totalLiquidityAth! : 'vaco',
        totalLiquidityAthTimestamp:
            overrides && overrides.hasOwnProperty('totalLiquidityAthTimestamp')
                ? overrides.totalLiquidityAthTimestamp!
                : 7314,
        totalLiquidityAtl:
            overrides && overrides.hasOwnProperty('totalLiquidityAtl') ? overrides.totalLiquidityAtl! : 'compello',
        totalLiquidityAtlTimestamp:
            overrides && overrides.hasOwnProperty('totalLiquidityAtlTimestamp')
                ? overrides.totalLiquidityAtlTimestamp!
                : 83,
        totalShares: overrides && overrides.hasOwnProperty('totalShares') ? overrides.totalShares! : 'abbas',
        totalShares24hAgo:
            overrides && overrides.hasOwnProperty('totalShares24hAgo') ? overrides.totalShares24hAgo! : 'adimpleo',
        totalSupply: overrides && overrides.hasOwnProperty('totalSupply') ? overrides.totalSupply! : 'tubineus',
        volume24h: overrides && overrides.hasOwnProperty('volume24h') ? overrides.volume24h! : 'thymbra',
        volume24hAth: overrides && overrides.hasOwnProperty('volume24hAth') ? overrides.volume24hAth! : 'vaco',
        volume24hAthTimestamp:
            overrides && overrides.hasOwnProperty('volume24hAthTimestamp') ? overrides.volume24hAthTimestamp! : 2658,
        volume24hAtl: overrides && overrides.hasOwnProperty('volume24hAtl') ? overrides.volume24hAtl! : 'debeo',
        volume24hAtlTimestamp:
            overrides && overrides.hasOwnProperty('volume24hAtlTimestamp') ? overrides.volume24hAtlTimestamp! : 4905,
        volume48h: overrides && overrides.hasOwnProperty('volume48h') ? overrides.volume48h! : 'perferendis',
        yieldCapture24h:
            overrides && overrides.hasOwnProperty('yieldCapture24h') ? overrides.yieldCapture24h! : 'similique',
        yieldCapture48h:
            overrides && overrides.hasOwnProperty('yieldCapture48h') ? overrides.yieldCapture48h! : 'cinis',
    };
};

export const aGqlPoolElement = (overrides?: Partial<GqlPoolElement>): GqlPoolElement => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'tempora',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        baseToken: overrides && overrides.hasOwnProperty('baseToken') ? overrides.baseToken! : 'ciminatio',
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 6548,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 2732,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'officia',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : true,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : false,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : false,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '25bf8967-dcb6-409e-8526-3372ec1b588b',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'caute',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'suscipio',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'viriliter',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'accusamus',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        principalToken:
            overrides && overrides.hasOwnProperty('principalToken') ? overrides.principalToken! : 'debilito',
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 6936,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager:
            overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'provident',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'inventore',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['denuo'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        unitSeconds: overrides && overrides.hasOwnProperty('unitSeconds') ? overrides.unitSeconds! : 'saepe',
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 295,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 5160,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolEvent = (overrides?: Partial<GqlPoolEvent>): GqlPoolEvent => {
    return {
        blockNumber: overrides && overrides.hasOwnProperty('blockNumber') ? overrides.blockNumber! : 173,
        blockTimestamp: overrides && overrides.hasOwnProperty('blockTimestamp') ? overrides.blockTimestamp! : 2199,
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '0fbcd1b6-21f3-421e-954e-10737e9500df',
        logIndex: overrides && overrides.hasOwnProperty('logIndex') ? overrides.logIndex! : 6040,
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'debilito',
        sender: overrides && overrides.hasOwnProperty('sender') ? overrides.sender! : 'ademptio',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 4617,
        tx: overrides && overrides.hasOwnProperty('tx') ? overrides.tx! : 'crepusculum',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolEventType.ADD,
        userAddress: overrides && overrides.hasOwnProperty('userAddress') ? overrides.userAddress! : 'clibanus',
        valueUSD: overrides && overrides.hasOwnProperty('valueUSD') ? overrides.valueUSD! : 5.6,
    };
};

export const aGqlPoolEventAmount = (overrides?: Partial<GqlPoolEventAmount>): GqlPoolEventAmount => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'approbo',
        amount: overrides && overrides.hasOwnProperty('amount') ? overrides.amount! : 'considero',
        valueUSD: overrides && overrides.hasOwnProperty('valueUSD') ? overrides.valueUSD! : 4.8,
    };
};

export const aGqlPoolEventsFilter = (overrides?: Partial<GqlPoolEventsFilter>): GqlPoolEventsFilter => {
    return {
        chainIn: overrides && overrides.hasOwnProperty('chainIn') ? overrides.chainIn! : [GqlChain.ARBITRUM],
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'censura',
        poolIdIn: overrides && overrides.hasOwnProperty('poolIdIn') ? overrides.poolIdIn! : ['caute'],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolEventType.ADD,
        typeIn: overrides && overrides.hasOwnProperty('typeIn') ? overrides.typeIn! : [GqlPoolEventType.ADD],
        userAddress: overrides && overrides.hasOwnProperty('userAddress') ? overrides.userAddress! : 'cruciamentum',
    };
};

export const aGqlPoolFeaturedPool = (overrides?: Partial<GqlPoolFeaturedPool>): GqlPoolFeaturedPool => {
    return {
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'cervus',
        pool: overrides && overrides.hasOwnProperty('pool') ? overrides.pool! : aGqlPoolBase(),
        poolId:
            overrides && overrides.hasOwnProperty('poolId')
                ? overrides.poolId!
                : '63d328f4-4aa0-4235-b1b5-32ab0282fe49',
        primary: overrides && overrides.hasOwnProperty('primary') ? overrides.primary! : false,
    };
};

export const aGqlPoolFeaturedPoolGroup = (overrides?: Partial<GqlPoolFeaturedPoolGroup>): GqlPoolFeaturedPoolGroup => {
    return {
        icon: overrides && overrides.hasOwnProperty('icon') ? overrides.icon! : 'defluo',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'a22db443-9cce-4d1c-b5c8-974a6de80113',
        items:
            overrides && overrides.hasOwnProperty('items')
                ? overrides.items!
                : [aGqlFeaturePoolGroupItemExternalLink()],
        title: overrides && overrides.hasOwnProperty('title') ? overrides.title! : 'videlicet',
    };
};

export const aGqlPoolFilter = (overrides?: Partial<GqlPoolFilter>): GqlPoolFilter => {
    return {
        categoryIn:
            overrides && overrides.hasOwnProperty('categoryIn')
                ? overrides.categoryIn!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        categoryNotIn:
            overrides && overrides.hasOwnProperty('categoryNotIn')
                ? overrides.categoryNotIn!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chainIn: overrides && overrides.hasOwnProperty('chainIn') ? overrides.chainIn! : [GqlChain.ARBITRUM],
        chainNotIn: overrides && overrides.hasOwnProperty('chainNotIn') ? overrides.chainNotIn! : [GqlChain.ARBITRUM],
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : aGqlPoolTimePeriod(),
        filterIn: overrides && overrides.hasOwnProperty('filterIn') ? overrides.filterIn! : ['velit'],
        filterNotIn: overrides && overrides.hasOwnProperty('filterNotIn') ? overrides.filterNotIn! : ['solum'],
        hasHook: overrides && overrides.hasOwnProperty('hasHook') ? overrides.hasHook! : true,
        idIn: overrides && overrides.hasOwnProperty('idIn') ? overrides.idIn! : ['cogito'],
        idNotIn: overrides && overrides.hasOwnProperty('idNotIn') ? overrides.idNotIn! : ['theatrum'],
        minTvl: overrides && overrides.hasOwnProperty('minTvl') ? overrides.minTvl! : 6.8,
        poolTypeIn:
            overrides && overrides.hasOwnProperty('poolTypeIn')
                ? overrides.poolTypeIn!
                : [GqlPoolType.COMPOSABLE_STABLE],
        poolTypeNotIn:
            overrides && overrides.hasOwnProperty('poolTypeNotIn')
                ? overrides.poolTypeNotIn!
                : [GqlPoolType.COMPOSABLE_STABLE],
        protocolVersionIn:
            overrides && overrides.hasOwnProperty('protocolVersionIn') ? overrides.protocolVersionIn! : [508],
        tagIn: overrides && overrides.hasOwnProperty('tagIn') ? overrides.tagIn! : ['totam'],
        tagNotIn: overrides && overrides.hasOwnProperty('tagNotIn') ? overrides.tagNotIn! : ['cuppedia'],
        tokensIn: overrides && overrides.hasOwnProperty('tokensIn') ? overrides.tokensIn! : ['tabella'],
        tokensNotIn: overrides && overrides.hasOwnProperty('tokensNotIn') ? overrides.tokensNotIn! : ['subnecto'],
        userAddress: overrides && overrides.hasOwnProperty('userAddress') ? overrides.userAddress! : 'utrimque',
    };
};

export const aGqlPoolFx = (overrides?: Partial<GqlPoolFx>): GqlPoolFx => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'tepidus',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        alpha: overrides && overrides.hasOwnProperty('alpha') ? overrides.alpha! : 'triduana',
        beta: overrides && overrides.hasOwnProperty('beta') ? overrides.beta! : 'constans',
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 3699,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 7274,
        delta: overrides && overrides.hasOwnProperty('delta') ? overrides.delta! : 'aestas',
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        epsilon: overrides && overrides.hasOwnProperty('epsilon') ? overrides.epsilon! : 'demonstro',
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'tot',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : false,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : true,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : false,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'dba0f4cd-ab4f-4413-9a73-ae82b967ea24',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        lambda: overrides && overrides.hasOwnProperty('lambda') ? overrides.lambda! : 'provident',
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'truculenter',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'umbra',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'adhuc',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'vacuus',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 6747,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager:
            overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'attonbitus',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'cubicularis',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['vilicus'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 1518,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 9766,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolGyro = (overrides?: Partial<GqlPoolGyro>): GqlPoolGyro => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'coniuratio',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        alpha: overrides && overrides.hasOwnProperty('alpha') ? overrides.alpha! : 'sum',
        beta: overrides && overrides.hasOwnProperty('beta') ? overrides.beta! : 'templum',
        c: overrides && overrides.hasOwnProperty('c') ? overrides.c! : 'veritatis',
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 2116,
        dSq: overrides && overrides.hasOwnProperty('dSq') ? overrides.dSq! : 'tolero',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 4118,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'aggero',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : false,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : true,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : true,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '0e1fe74f-62f9-4538-82f6-d5229c23fd5d',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        lambda: overrides && overrides.hasOwnProperty('lambda') ? overrides.lambda! : 'clamo',
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'clibanus',
        nestingType:
            overrides && overrides.hasOwnProperty('nestingType')
                ? overrides.nestingType!
                : GqlPoolNestingType.HAS_ONLY_PHANTOM_BPT,
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'itaque',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'corpus',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'antepono',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 2705,
        root3Alpha: overrides && overrides.hasOwnProperty('root3Alpha') ? overrides.root3Alpha! : 'cruciamentum',
        s: overrides && overrides.hasOwnProperty('s') ? overrides.s! : 'aiunt',
        sqrtAlpha: overrides && overrides.hasOwnProperty('sqrtAlpha') ? overrides.sqrtAlpha! : 'cauda',
        sqrtBeta: overrides && overrides.hasOwnProperty('sqrtBeta') ? overrides.sqrtBeta! : 'amplexus',
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'tepesco',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'caterva',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['stips'],
        tauAlphaX: overrides && overrides.hasOwnProperty('tauAlphaX') ? overrides.tauAlphaX! : 'torrens',
        tauAlphaY: overrides && overrides.hasOwnProperty('tauAlphaY') ? overrides.tauAlphaY! : 'comes',
        tauBetaX: overrides && overrides.hasOwnProperty('tauBetaX') ? overrides.tauBetaX! : 'acer',
        tauBetaY: overrides && overrides.hasOwnProperty('tauBetaY') ? overrides.tauBetaY! : 'conatus',
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        u: overrides && overrides.hasOwnProperty('u') ? overrides.u! : 'admitto',
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        v: overrides && overrides.hasOwnProperty('v') ? overrides.v! : 'aperio',
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 8610,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 9363,
        w: overrides && overrides.hasOwnProperty('w') ? overrides.w! : 'praesentium',
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
        z: overrides && overrides.hasOwnProperty('z') ? overrides.z! : 'enim',
    };
};

export const aGqlPoolInvestConfig = (overrides?: Partial<GqlPoolInvestConfig>): GqlPoolInvestConfig => {
    return {
        options: overrides && overrides.hasOwnProperty('options') ? overrides.options! : [aGqlPoolInvestOption()],
        proportionalEnabled:
            overrides && overrides.hasOwnProperty('proportionalEnabled') ? overrides.proportionalEnabled! : false,
        singleAssetEnabled:
            overrides && overrides.hasOwnProperty('singleAssetEnabled') ? overrides.singleAssetEnabled! : true,
    };
};

export const aGqlPoolInvestOption = (overrides?: Partial<GqlPoolInvestOption>): GqlPoolInvestOption => {
    return {
        poolTokenAddress:
            overrides && overrides.hasOwnProperty('poolTokenAddress') ? overrides.poolTokenAddress! : 'adsidue',
        poolTokenIndex: overrides && overrides.hasOwnProperty('poolTokenIndex') ? overrides.poolTokenIndex! : 8146,
        tokenOptions:
            overrides && overrides.hasOwnProperty('tokenOptions') ? overrides.tokenOptions! : [aGqlPoolToken()],
    };
};

export const aGqlPoolJoinExit = (overrides?: Partial<GqlPoolJoinExit>): GqlPoolJoinExit => {
    return {
        amounts: overrides && overrides.hasOwnProperty('amounts') ? overrides.amounts! : [aGqlPoolJoinExitAmount()],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'd8d9403f-7ce4-4192-9993-9e1b58657edc',
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'tabesco',
        sender: overrides && overrides.hasOwnProperty('sender') ? overrides.sender! : 'venia',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 1413,
        tx: overrides && overrides.hasOwnProperty('tx') ? overrides.tx! : 'maxime',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolJoinExitType.Exit,
        valueUSD: overrides && overrides.hasOwnProperty('valueUSD') ? overrides.valueUSD! : 'vociferor',
    };
};

export const aGqlPoolJoinExitAmount = (overrides?: Partial<GqlPoolJoinExitAmount>): GqlPoolJoinExitAmount => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'succedo',
        amount: overrides && overrides.hasOwnProperty('amount') ? overrides.amount! : 'tabella',
    };
};

export const aGqlPoolLiquidityBootstrapping = (
    overrides?: Partial<GqlPoolLiquidityBootstrapping>,
): GqlPoolLiquidityBootstrapping => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'vitium',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 2673,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 4836,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'sub',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : true,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : true,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : true,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'b7b2bee3-3d0c-4708-9a92-8f8c97c36549',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'quas',
        nestingType:
            overrides && overrides.hasOwnProperty('nestingType')
                ? overrides.nestingType!
                : GqlPoolNestingType.HAS_ONLY_PHANTOM_BPT,
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'ago',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'cubicularis',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'celo',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 7081,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'trucido',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'colo',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['adsuesco'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 8478,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 782,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolLiquidityBootstrappingV3 = (
    overrides?: Partial<GqlPoolLiquidityBootstrappingV3>,
): GqlPoolLiquidityBootstrappingV3 => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'ago',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 4357,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 9639,
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'aliquam',
        discord: overrides && overrides.hasOwnProperty('discord') ? overrides.discord! : 'stabilis',
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        endTime: overrides && overrides.hasOwnProperty('endTime') ? overrides.endTime! : 1917,
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'vomica',
        farcaster: overrides && overrides.hasOwnProperty('farcaster') ? overrides.farcaster! : 'alter',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : true,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : true,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : false,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '97ba1b39-8f9e-4946-98c6-7e1cc860e5b9',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        isProjectTokenSwapInBlocked:
            overrides && overrides.hasOwnProperty('isProjectTokenSwapInBlocked')
                ? overrides.isProjectTokenSwapInBlocked!
                : false,
        lbpName: overrides && overrides.hasOwnProperty('lbpName') ? overrides.lbpName! : 'conscendo',
        lbpOwner: overrides && overrides.hasOwnProperty('lbpOwner') ? overrides.lbpOwner! : 'coma',
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'corroboro',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'tergeo',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'sordeo',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'velociter',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        projectToken: overrides && overrides.hasOwnProperty('projectToken') ? overrides.projectToken! : 'iure',
        projectTokenEndWeight:
            overrides && overrides.hasOwnProperty('projectTokenEndWeight') ? overrides.projectTokenEndWeight! : 1.9,
        projectTokenIndex:
            overrides && overrides.hasOwnProperty('projectTokenIndex') ? overrides.projectTokenIndex! : 251,
        projectTokenStartWeight:
            overrides && overrides.hasOwnProperty('projectTokenStartWeight') ? overrides.projectTokenStartWeight! : 7.2,
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 2653,
        reserveToken: overrides && overrides.hasOwnProperty('reserveToken') ? overrides.reserveToken! : 'caritas',
        reserveTokenEndWeight:
            overrides && overrides.hasOwnProperty('reserveTokenEndWeight') ? overrides.reserveTokenEndWeight! : 6.8,
        reserveTokenIndex:
            overrides && overrides.hasOwnProperty('reserveTokenIndex') ? overrides.reserveTokenIndex! : 8092,
        reserveTokenStartWeight:
            overrides && overrides.hasOwnProperty('reserveTokenStartWeight') ? overrides.reserveTokenStartWeight! : 5.5,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        startTime: overrides && overrides.hasOwnProperty('startTime') ? overrides.startTime! : 3725,
        swapFeeManager:
            overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'bellicus',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'clamo',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['attollo'],
        telegram: overrides && overrides.hasOwnProperty('telegram') ? overrides.telegram! : 'cohibeo',
        topTrades: overrides && overrides.hasOwnProperty('topTrades') ? overrides.topTrades! : [aGqlLbpTopTrade()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 4833,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 9337,
        website: overrides && overrides.hasOwnProperty('website') ? overrides.website! : 'terror',
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
        x: overrides && overrides.hasOwnProperty('x') ? overrides.x! : 'sint',
    };
};

export const aGqlPoolMetaStable = (overrides?: Partial<GqlPoolMetaStable>): GqlPoolMetaStable => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'acies',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        amp: overrides && overrides.hasOwnProperty('amp') ? overrides.amp! : 'casso',
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 23,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 4942,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'adinventitias',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : true,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : false,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : false,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'be61061e-4c34-471f-b955-44e28a92d072',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'commodo',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'certe',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'concido',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'statua',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 9959,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'arto',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'cupio',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['pauci'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 8703,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 3692,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolMinimal = (overrides?: Partial<GqlPoolMinimal>): GqlPoolMinimal => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'exercitationem',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 8328,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 7389,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'ducimus',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : false,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : true,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : false,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '55063821-2313-4ba6-92ce-8d0f9817605c',
        incentivized: overrides && overrides.hasOwnProperty('incentivized') ? overrides.incentivized! : false,
        lbpParams:
            overrides && overrides.hasOwnProperty('lbpParams')
                ? overrides.lbpParams!
                : aLiquidityBootstrappingPoolV3Params(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'accendo',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'amicitia',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'suffoco',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'summisse',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 4791,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'sponte',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'decumbo',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['delicate'],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 7257,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 6568,
    };
};

export const aGqlPoolMutationResult = (overrides?: Partial<GqlPoolMutationResult>): GqlPoolMutationResult => {
    return {
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        error: overrides && overrides.hasOwnProperty('error') ? overrides.error! : 'alveus',
        success: overrides && overrides.hasOwnProperty('success') ? overrides.success! : true,
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : 'animadverto',
    };
};

export const aGqlPoolQuantAmmWeighted = (overrides?: Partial<GqlPoolQuantAmmWeighted>): GqlPoolQuantAmmWeighted => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'pauci',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 1409,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 5290,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'accommodo',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : true,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : true,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : true,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'aac81436-8dd8-4197-bf33-cc82f7ea4570',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'verbera',
        nestingType:
            overrides && overrides.hasOwnProperty('nestingType')
                ? overrides.nestingType!
                : GqlPoolNestingType.HAS_ONLY_PHANTOM_BPT,
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'certe',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'viduo',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'vinum',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 860,
        quantAmmWeightedParams:
            overrides && overrides.hasOwnProperty('quantAmmWeightedParams')
                ? overrides.quantAmmWeightedParams!
                : aQuantAmmWeightedParams(),
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'modi',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'alioqui',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['alius'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 8712,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 2389,
        weightSnapshots:
            overrides && overrides.hasOwnProperty('weightSnapshots')
                ? overrides.weightSnapshots!
                : [aQuantAmmWeightSnapshot()],
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolReClamm = (overrides?: Partial<GqlPoolReClamm>): GqlPoolReClamm => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'tego',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        centerednessMargin:
            overrides && overrides.hasOwnProperty('centerednessMargin') ? overrides.centerednessMargin! : 'brevis',
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 3260,
        currentFourthRootPriceRatio:
            overrides && overrides.hasOwnProperty('currentFourthRootPriceRatio')
                ? overrides.currentFourthRootPriceRatio!
                : 'cubicularis',
        dailyPriceShiftBase:
            overrides && overrides.hasOwnProperty('dailyPriceShiftBase') ? overrides.dailyPriceShiftBase! : 'aspicio',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 5667,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        endFourthRootPriceRatio:
            overrides && overrides.hasOwnProperty('endFourthRootPriceRatio')
                ? overrides.endFourthRootPriceRatio!
                : 'atqui',
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'argentum',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : false,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : false,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : false,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'ad8dc60f-51dc-44d3-a1a8-785b5a3ac1b4',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        lastTimestamp: overrides && overrides.hasOwnProperty('lastTimestamp') ? overrides.lastTimestamp! : 7233,
        lastVirtualBalances:
            overrides && overrides.hasOwnProperty('lastVirtualBalances') ? overrides.lastVirtualBalances! : ['tabula'],
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'veritas',
        nestingType:
            overrides && overrides.hasOwnProperty('nestingType')
                ? overrides.nestingType!
                : GqlPoolNestingType.HAS_ONLY_PHANTOM_BPT,
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'ipsa',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'trado',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'cunabula',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        priceRatioUpdateEndTime:
            overrides && overrides.hasOwnProperty('priceRatioUpdateEndTime')
                ? overrides.priceRatioUpdateEndTime!
                : 9355,
        priceRatioUpdateStartTime:
            overrides && overrides.hasOwnProperty('priceRatioUpdateStartTime')
                ? overrides.priceRatioUpdateStartTime!
                : 225,
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 9552,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        startFourthRootPriceRatio:
            overrides && overrides.hasOwnProperty('startFourthRootPriceRatio')
                ? overrides.startFourthRootPriceRatio!
                : 'coadunatio',
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'amita',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'acidus',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['audeo'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 2663,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 1366,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolSnapshot = (overrides?: Partial<GqlPoolSnapshot>): GqlPoolSnapshot => {
    return {
        amounts: overrides && overrides.hasOwnProperty('amounts') ? overrides.amounts! : ['cunae'],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        fees24h: overrides && overrides.hasOwnProperty('fees24h') ? overrides.fees24h! : 'speculum',
        holdersCount: overrides && overrides.hasOwnProperty('holdersCount') ? overrides.holdersCount! : 'compello',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '8cc4c0f8-67ae-4d67-b35f-6b673f0af3a1',
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'adiuvo',
        sharePrice: overrides && overrides.hasOwnProperty('sharePrice') ? overrides.sharePrice! : 'totus',
        surplus24h: overrides && overrides.hasOwnProperty('surplus24h') ? overrides.surplus24h! : 'tabula',
        swapsCount: overrides && overrides.hasOwnProperty('swapsCount') ? overrides.swapsCount! : 'acidus',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 702,
        totalLiquidity:
            overrides && overrides.hasOwnProperty('totalLiquidity') ? overrides.totalLiquidity! : 'synagoga',
        totalShares: overrides && overrides.hasOwnProperty('totalShares') ? overrides.totalShares! : 'angelus',
        totalSurplus: overrides && overrides.hasOwnProperty('totalSurplus') ? overrides.totalSurplus! : 'nisi',
        totalSwapFee: overrides && overrides.hasOwnProperty('totalSwapFee') ? overrides.totalSwapFee! : 'theca',
        totalSwapVolume:
            overrides && overrides.hasOwnProperty('totalSwapVolume') ? overrides.totalSwapVolume! : 'usque',
        volume24h: overrides && overrides.hasOwnProperty('volume24h') ? overrides.volume24h! : 'defaeco',
    };
};

export const aGqlPoolStable = (overrides?: Partial<GqlPoolStable>): GqlPoolStable => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'valde',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        amp: overrides && overrides.hasOwnProperty('amp') ? overrides.amp! : 'ascisco',
        bptPriceRate: overrides && overrides.hasOwnProperty('bptPriceRate') ? overrides.bptPriceRate! : 'tabgo',
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 9737,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 6134,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'cogito',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : true,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : false,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : true,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '0c3723eb-d9a9-4c8b-a09c-3a81cb8da8b4',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'consectetur',
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'amissio',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'tyrannus',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'summisse',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 6728,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'depereo',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'claudeo',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['deputo'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 5902,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 3295,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolStaking = (overrides?: Partial<GqlPoolStaking>): GqlPoolStaking => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'tricesimus',
        aura: overrides && overrides.hasOwnProperty('aura') ? overrides.aura! : aGqlPoolStakingAura(),
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        farm: overrides && overrides.hasOwnProperty('farm') ? overrides.farm! : aGqlPoolStakingMasterChefFarm(),
        gauge: overrides && overrides.hasOwnProperty('gauge') ? overrides.gauge! : aGqlPoolStakingGauge(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '78deac1b-3fa9-4e03-abb0-e09ed3e79cbf',
        reliquary:
            overrides && overrides.hasOwnProperty('reliquary') ? overrides.reliquary! : aGqlPoolStakingReliquaryFarm(),
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolStakingType.AURA,
        vebal: overrides && overrides.hasOwnProperty('vebal') ? overrides.vebal! : aGqlPoolStakingVebal(),
    };
};

export const aGqlPoolStakingAura = (overrides?: Partial<GqlPoolStakingAura>): GqlPoolStakingAura => {
    return {
        apr: overrides && overrides.hasOwnProperty('apr') ? overrides.apr! : 6.1,
        auraPoolAddress: overrides && overrides.hasOwnProperty('auraPoolAddress') ? overrides.auraPoolAddress! : 'cubo',
        auraPoolId: overrides && overrides.hasOwnProperty('auraPoolId') ? overrides.auraPoolId! : 'fugiat',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '715d693f-5d92-4dca-855d-7ecb3472f605',
        isShutdown: overrides && overrides.hasOwnProperty('isShutdown') ? overrides.isShutdown! : false,
    };
};

export const aGqlPoolStakingFarmRewarder = (
    overrides?: Partial<GqlPoolStakingFarmRewarder>,
): GqlPoolStakingFarmRewarder => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'callide',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '4454b8c0-f7fd-4994-bb3f-50e7bd53ea77',
        rewardPerSecond:
            overrides && overrides.hasOwnProperty('rewardPerSecond') ? overrides.rewardPerSecond! : 'condico',
        tokenAddress: overrides && overrides.hasOwnProperty('tokenAddress') ? overrides.tokenAddress! : 'reprehenderit',
    };
};

export const aGqlPoolStakingGauge = (overrides?: Partial<GqlPoolStakingGauge>): GqlPoolStakingGauge => {
    return {
        gaugeAddress: overrides && overrides.hasOwnProperty('gaugeAddress') ? overrides.gaugeAddress! : 'color',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'a6dea17a-5c42-430d-96f7-5f55701008cb',
        otherGauges:
            overrides && overrides.hasOwnProperty('otherGauges')
                ? overrides.otherGauges!
                : [aGqlPoolStakingOtherGauge()],
        rewards: overrides && overrides.hasOwnProperty('rewards') ? overrides.rewards! : [aGqlPoolStakingGaugeReward()],
        status: overrides && overrides.hasOwnProperty('status') ? overrides.status! : GqlPoolStakingGaugeStatus.ACTIVE,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 9663,
        workingSupply: overrides && overrides.hasOwnProperty('workingSupply') ? overrides.workingSupply! : 'cruentus',
    };
};

export const aGqlPoolStakingGaugeReward = (
    overrides?: Partial<GqlPoolStakingGaugeReward>,
): GqlPoolStakingGaugeReward => {
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '623a9753-4f35-4c7b-a84b-59d9196e026c',
        rewardPerSecond: overrides && overrides.hasOwnProperty('rewardPerSecond') ? overrides.rewardPerSecond! : 'acer',
        tokenAddress: overrides && overrides.hasOwnProperty('tokenAddress') ? overrides.tokenAddress! : 'cribro',
    };
};

export const aGqlPoolStakingMasterChefFarm = (
    overrides?: Partial<GqlPoolStakingMasterChefFarm>,
): GqlPoolStakingMasterChefFarm => {
    return {
        beetsPerBlock: overrides && overrides.hasOwnProperty('beetsPerBlock') ? overrides.beetsPerBlock! : 'decerno',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '40cf33a0-8ddb-431b-adcc-5ae3f770873c',
        rewarders:
            overrides && overrides.hasOwnProperty('rewarders') ? overrides.rewarders! : [aGqlPoolStakingFarmRewarder()],
    };
};

export const aGqlPoolStakingOtherGauge = (overrides?: Partial<GqlPoolStakingOtherGauge>): GqlPoolStakingOtherGauge => {
    return {
        gaugeAddress: overrides && overrides.hasOwnProperty('gaugeAddress') ? overrides.gaugeAddress! : 'delicate',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '37f91a30-78c2-46f2-8980-92a87434ade9',
        rewards: overrides && overrides.hasOwnProperty('rewards') ? overrides.rewards! : [aGqlPoolStakingGaugeReward()],
        status: overrides && overrides.hasOwnProperty('status') ? overrides.status! : GqlPoolStakingGaugeStatus.ACTIVE,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 9412,
    };
};

export const aGqlPoolStakingReliquaryFarm = (
    overrides?: Partial<GqlPoolStakingReliquaryFarm>,
): GqlPoolStakingReliquaryFarm => {
    return {
        beetsPerSecond: overrides && overrides.hasOwnProperty('beetsPerSecond') ? overrides.beetsPerSecond! : 'aegre',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '3c3f2723-d62c-4a04-8204-40926a8be3f4',
        levels:
            overrides && overrides.hasOwnProperty('levels') ? overrides.levels! : [aGqlPoolStakingReliquaryFarmLevel()],
        totalBalance: overrides && overrides.hasOwnProperty('totalBalance') ? overrides.totalBalance! : 'cognatus',
        totalWeightedBalance:
            overrides && overrides.hasOwnProperty('totalWeightedBalance') ? overrides.totalWeightedBalance! : 'corona',
    };
};

export const aGqlPoolStakingReliquaryFarmLevel = (
    overrides?: Partial<GqlPoolStakingReliquaryFarmLevel>,
): GqlPoolStakingReliquaryFarmLevel => {
    return {
        allocationPoints:
            overrides && overrides.hasOwnProperty('allocationPoints') ? overrides.allocationPoints! : 5987,
        apr: overrides && overrides.hasOwnProperty('apr') ? overrides.apr! : 'combibo',
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'patruus',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '6407853d-0dea-4b1d-a872-16a1e8fc0f2d',
        level: overrides && overrides.hasOwnProperty('level') ? overrides.level! : 5143,
        requiredMaturity:
            overrides && overrides.hasOwnProperty('requiredMaturity') ? overrides.requiredMaturity! : 2222,
    };
};

export const aGqlPoolStakingVebal = (overrides?: Partial<GqlPoolStakingVebal>): GqlPoolStakingVebal => {
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '78272fbc-f405-40e1-a234-cfe27994df0f',
        vebalAddress: overrides && overrides.hasOwnProperty('vebalAddress') ? overrides.vebalAddress! : 'aperiam',
    };
};

export const aGqlPoolSwap = (overrides?: Partial<GqlPoolSwap>): GqlPoolSwap => {
    return {
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '237ef8cf-4ec7-4adb-8f6b-abc2cc37fa6b',
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'cognatus',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 2029,
        tokenAmountIn: overrides && overrides.hasOwnProperty('tokenAmountIn') ? overrides.tokenAmountIn! : 'censura',
        tokenAmountOut:
            overrides && overrides.hasOwnProperty('tokenAmountOut') ? overrides.tokenAmountOut! : 'thalassinus',
        tokenIn: overrides && overrides.hasOwnProperty('tokenIn') ? overrides.tokenIn! : 'angulus',
        tokenOut: overrides && overrides.hasOwnProperty('tokenOut') ? overrides.tokenOut! : 'absorbeo',
        tx: overrides && overrides.hasOwnProperty('tx') ? overrides.tx! : 'ducimus',
        userAddress: overrides && overrides.hasOwnProperty('userAddress') ? overrides.userAddress! : 'usus',
        valueUSD: overrides && overrides.hasOwnProperty('valueUSD') ? overrides.valueUSD! : 9.1,
    };
};

export const aGqlPoolSwapEventCowAmm = (overrides?: Partial<GqlPoolSwapEventCowAmm>): GqlPoolSwapEventCowAmm => {
    return {
        blockNumber: overrides && overrides.hasOwnProperty('blockNumber') ? overrides.blockNumber! : 2032,
        blockTimestamp: overrides && overrides.hasOwnProperty('blockTimestamp') ? overrides.blockTimestamp! : 9782,
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        fee: overrides && overrides.hasOwnProperty('fee') ? overrides.fee! : aGqlPoolEventAmount(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '19819e50-4e81-4033-9554-107d50e103ac',
        logIndex: overrides && overrides.hasOwnProperty('logIndex') ? overrides.logIndex! : 6105,
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'cras',
        sender: overrides && overrides.hasOwnProperty('sender') ? overrides.sender! : 'canonicus',
        surplus: overrides && overrides.hasOwnProperty('surplus') ? overrides.surplus! : aGqlPoolEventAmount(),
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 7300,
        tokenIn: overrides && overrides.hasOwnProperty('tokenIn') ? overrides.tokenIn! : aGqlPoolEventAmount(),
        tokenOut: overrides && overrides.hasOwnProperty('tokenOut') ? overrides.tokenOut! : aGqlPoolEventAmount(),
        tx: overrides && overrides.hasOwnProperty('tx') ? overrides.tx! : 'tripudio',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolEventType.ADD,
        userAddress: overrides && overrides.hasOwnProperty('userAddress') ? overrides.userAddress! : 'cerno',
        valueUSD: overrides && overrides.hasOwnProperty('valueUSD') ? overrides.valueUSD! : 7.4,
    };
};

export const aGqlPoolSwapEventV3 = (overrides?: Partial<GqlPoolSwapEventV3>): GqlPoolSwapEventV3 => {
    return {
        blockNumber: overrides && overrides.hasOwnProperty('blockNumber') ? overrides.blockNumber! : 9222,
        blockTimestamp: overrides && overrides.hasOwnProperty('blockTimestamp') ? overrides.blockTimestamp! : 5370,
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        fee: overrides && overrides.hasOwnProperty('fee') ? overrides.fee! : aGqlPoolEventAmount(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '22c54e65-0361-439f-b6fe-451c3ee62aca',
        logIndex: overrides && overrides.hasOwnProperty('logIndex') ? overrides.logIndex! : 2586,
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'claro',
        sender: overrides && overrides.hasOwnProperty('sender') ? overrides.sender! : 'sit',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 8582,
        tokenIn: overrides && overrides.hasOwnProperty('tokenIn') ? overrides.tokenIn! : aGqlPoolEventAmount(),
        tokenOut: overrides && overrides.hasOwnProperty('tokenOut') ? overrides.tokenOut! : aGqlPoolEventAmount(),
        tx: overrides && overrides.hasOwnProperty('tx') ? overrides.tx! : 'curvo',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolEventType.ADD,
        userAddress: overrides && overrides.hasOwnProperty('userAddress') ? overrides.userAddress! : 'conor',
        valueUSD: overrides && overrides.hasOwnProperty('valueUSD') ? overrides.valueUSD! : 6.1,
    };
};

export const aGqlPoolTimePeriod = (overrides?: Partial<GqlPoolTimePeriod>): GqlPoolTimePeriod => {
    return {
        gt: overrides && overrides.hasOwnProperty('gt') ? overrides.gt! : 1642,
        lt: overrides && overrides.hasOwnProperty('lt') ? overrides.lt! : 7069,
    };
};

export const aGqlPoolToken = (overrides?: Partial<GqlPoolToken>): GqlPoolToken => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'deporto',
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'caute',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 8058,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '2da11dad-1bf2-40cd-bd5b-18c8b35e160a',
        index: overrides && overrides.hasOwnProperty('index') ? overrides.index! : 4657,
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'attollo',
        priceRate: overrides && overrides.hasOwnProperty('priceRate') ? overrides.priceRate! : 'venia',
        priceRateProvider:
            overrides && overrides.hasOwnProperty('priceRateProvider') ? overrides.priceRateProvider! : 'ubi',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'stabilis',
        totalBalance: overrides && overrides.hasOwnProperty('totalBalance') ? overrides.totalBalance! : 'trucido',
        weight: overrides && overrides.hasOwnProperty('weight') ? overrides.weight! : 'animus',
    };
};

export const aGqlPoolTokenBase = (overrides?: Partial<GqlPoolTokenBase>): GqlPoolTokenBase => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'cupiditate',
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'quibusdam',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 6906,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '8713a084-e257-482b-9317-662f9389507d',
        index: overrides && overrides.hasOwnProperty('index') ? overrides.index! : 6942,
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'validus',
        priceRate: overrides && overrides.hasOwnProperty('priceRate') ? overrides.priceRate! : 'aut',
        priceRateProvider:
            overrides && overrides.hasOwnProperty('priceRateProvider') ? overrides.priceRateProvider! : 'cimentarius',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'stultus',
        totalBalance: overrides && overrides.hasOwnProperty('totalBalance') ? overrides.totalBalance! : 'adeptio',
        weight: overrides && overrides.hasOwnProperty('weight') ? overrides.weight! : 'tabella',
    };
};

export const aGqlPoolTokenComposableStable = (
    overrides?: Partial<GqlPoolTokenComposableStable>,
): GqlPoolTokenComposableStable => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'cruentus',
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'venustas',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 8801,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'eb9248a9-572b-49cf-b947-28b4f99be339',
        index: overrides && overrides.hasOwnProperty('index') ? overrides.index! : 124,
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'decimus',
        pool: overrides && overrides.hasOwnProperty('pool') ? overrides.pool! : aGqlPoolComposableStableNested(),
        priceRate: overrides && overrides.hasOwnProperty('priceRate') ? overrides.priceRate! : 'tardus',
        priceRateProvider:
            overrides && overrides.hasOwnProperty('priceRateProvider') ? overrides.priceRateProvider! : 'decumbo',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'alienus',
        totalBalance: overrides && overrides.hasOwnProperty('totalBalance') ? overrides.totalBalance! : 'totam',
        weight: overrides && overrides.hasOwnProperty('weight') ? overrides.weight! : 'tracto',
    };
};

export const aGqlPoolTokenDetail = (overrides?: Partial<GqlPoolTokenDetail>): GqlPoolTokenDetail => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'vestrum',
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'vere',
        balanceUSD: overrides && overrides.hasOwnProperty('balanceUSD') ? overrides.balanceUSD! : 'vilicus',
        canUseBufferForSwaps:
            overrides && overrides.hasOwnProperty('canUseBufferForSwaps') ? overrides.canUseBufferForSwaps! : true,
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        chainId: overrides && overrides.hasOwnProperty('chainId') ? overrides.chainId! : 9332,
        coingeckoId: overrides && overrides.hasOwnProperty('coingeckoId') ? overrides.coingeckoId! : 'audeo',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 4979,
        erc4626ReviewData:
            overrides && overrides.hasOwnProperty('erc4626ReviewData')
                ? overrides.erc4626ReviewData!
                : anErc4626ReviewData(),
        hasNestedPool: overrides && overrides.hasOwnProperty('hasNestedPool') ? overrides.hasNestedPool! : true,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'e40423b1-03be-4c55-bc71-724120b91514',
        index: overrides && overrides.hasOwnProperty('index') ? overrides.index! : 7065,
        isAllowed: overrides && overrides.hasOwnProperty('isAllowed') ? overrides.isAllowed! : true,
        isBufferAllowed: overrides && overrides.hasOwnProperty('isBufferAllowed') ? overrides.isBufferAllowed! : false,
        isErc4626: overrides && overrides.hasOwnProperty('isErc4626') ? overrides.isErc4626! : false,
        isExemptFromProtocolYieldFee:
            overrides && overrides.hasOwnProperty('isExemptFromProtocolYieldFee')
                ? overrides.isExemptFromProtocolYieldFee!
                : true,
        logoURI: overrides && overrides.hasOwnProperty('logoURI') ? overrides.logoURI! : 'circumvenio',
        maxDeposit: overrides && overrides.hasOwnProperty('maxDeposit') ? overrides.maxDeposit! : 'arto',
        maxWithdraw: overrides && overrides.hasOwnProperty('maxWithdraw') ? overrides.maxWithdraw! : 'acidus',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'tergum',
        nestedPool: overrides && overrides.hasOwnProperty('nestedPool') ? overrides.nestedPool! : aGqlNestedPool(),
        priceRate: overrides && overrides.hasOwnProperty('priceRate') ? overrides.priceRate! : 'super',
        priceRateProvider:
            overrides && overrides.hasOwnProperty('priceRateProvider') ? overrides.priceRateProvider! : 'strues',
        priceRateProviderData:
            overrides && overrides.hasOwnProperty('priceRateProviderData')
                ? overrides.priceRateProviderData!
                : aGqlPriceRateProviderData(),
        priority: overrides && overrides.hasOwnProperty('priority') ? overrides.priority! : 3622,
        scalingFactor: overrides && overrides.hasOwnProperty('scalingFactor') ? overrides.scalingFactor! : 'apto',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'adsuesco',
        tradable: overrides && overrides.hasOwnProperty('tradable') ? overrides.tradable! : false,
        underlyingToken:
            overrides && overrides.hasOwnProperty('underlyingToken') ? overrides.underlyingToken! : aGqlToken(),
        useUnderlyingForAddRemove:
            overrides && overrides.hasOwnProperty('useUnderlyingForAddRemove')
                ? overrides.useUnderlyingForAddRemove!
                : false,
        useWrappedForAddRemove:
            overrides && overrides.hasOwnProperty('useWrappedForAddRemove') ? overrides.useWrappedForAddRemove! : true,
        weight: overrides && overrides.hasOwnProperty('weight') ? overrides.weight! : 'blandior',
    };
};

export const aGqlPoolTokenDisplay = (overrides?: Partial<GqlPoolTokenDisplay>): GqlPoolTokenDisplay => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'totam',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '4ad394d0-d78e-44ea-b727-08a0a6a67416',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'curto',
        nestedTokens:
            overrides && overrides.hasOwnProperty('nestedTokens') ? overrides.nestedTokens! : [aGqlPoolTokenDisplay()],
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'corrigo',
        weight: overrides && overrides.hasOwnProperty('weight') ? overrides.weight! : 'surculus',
    };
};

export const aGqlPoolTokenExpanded = (overrides?: Partial<GqlPoolTokenExpanded>): GqlPoolTokenExpanded => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'talus',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 2558,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '92c1f1b1-e51b-4666-a74e-3d1f301e4e3b',
        isErc4626: overrides && overrides.hasOwnProperty('isErc4626') ? overrides.isErc4626! : false,
        isMainToken: overrides && overrides.hasOwnProperty('isMainToken') ? overrides.isMainToken! : true,
        isNested: overrides && overrides.hasOwnProperty('isNested') ? overrides.isNested! : true,
        isPhantomBpt: overrides && overrides.hasOwnProperty('isPhantomBpt') ? overrides.isPhantomBpt! : true,
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'atqui',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'averto',
        weight: overrides && overrides.hasOwnProperty('weight') ? overrides.weight! : 'ultio',
    };
};

export const aGqlPoolUserBalance = (overrides?: Partial<GqlPoolUserBalance>): GqlPoolUserBalance => {
    return {
        stakedBalances:
            overrides && overrides.hasOwnProperty('stakedBalances')
                ? overrides.stakedBalances!
                : [aGqlUserStakedBalance()],
        totalBalance: overrides && overrides.hasOwnProperty('totalBalance') ? overrides.totalBalance! : 'abundans',
        totalBalanceUsd: overrides && overrides.hasOwnProperty('totalBalanceUsd') ? overrides.totalBalanceUsd! : 8.9,
        walletBalance: overrides && overrides.hasOwnProperty('walletBalance') ? overrides.walletBalance! : 'verus',
        walletBalanceUsd: overrides && overrides.hasOwnProperty('walletBalanceUsd') ? overrides.walletBalanceUsd! : 3.4,
    };
};

export const aGqlPoolUserSwapVolume = (overrides?: Partial<GqlPoolUserSwapVolume>): GqlPoolUserSwapVolume => {
    return {
        swapVolumeUSD: overrides && overrides.hasOwnProperty('swapVolumeUSD') ? overrides.swapVolumeUSD! : 'taedium',
        userAddress: overrides && overrides.hasOwnProperty('userAddress') ? overrides.userAddress! : 'torqueo',
    };
};

export const aGqlPoolWeighted = (overrides?: Partial<GqlPoolWeighted>): GqlPoolWeighted => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'vox',
        allTokens:
            overrides && overrides.hasOwnProperty('allTokens') ? overrides.allTokens! : [aGqlPoolTokenExpanded()],
        categories:
            overrides && overrides.hasOwnProperty('categories')
                ? overrides.categories!
                : [GqlPoolFilterCategory.BLACK_LISTED],
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        createTime: overrides && overrides.hasOwnProperty('createTime') ? overrides.createTime! : 9021,
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 1563,
        displayTokens:
            overrides && overrides.hasOwnProperty('displayTokens')
                ? overrides.displayTokens!
                : [aGqlPoolTokenDisplay()],
        dynamicData:
            overrides && overrides.hasOwnProperty('dynamicData') ? overrides.dynamicData! : aGqlPoolDynamicData(),
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'subseco',
        hasAnyAllowedBuffer:
            overrides && overrides.hasOwnProperty('hasAnyAllowedBuffer') ? overrides.hasAnyAllowedBuffer! : true,
        hasErc4626: overrides && overrides.hasOwnProperty('hasErc4626') ? overrides.hasErc4626! : true,
        hasNestedErc4626:
            overrides && overrides.hasOwnProperty('hasNestedErc4626') ? overrides.hasNestedErc4626! : true,
        hook: overrides && overrides.hasOwnProperty('hook') ? overrides.hook! : aGqlHook(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '97be5e24-4087-449c-8acb-81315052c9a8',
        investConfig:
            overrides && overrides.hasOwnProperty('investConfig') ? overrides.investConfig! : aGqlPoolInvestConfig(),
        liquidityManagement:
            overrides && overrides.hasOwnProperty('liquidityManagement')
                ? overrides.liquidityManagement!
                : aLiquidityManagement(),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'ab',
        nestingType:
            overrides && overrides.hasOwnProperty('nestingType')
                ? overrides.nestingType!
                : GqlPoolNestingType.HAS_ONLY_PHANTOM_BPT,
        owner: overrides && overrides.hasOwnProperty('owner') ? overrides.owner! : 'tego',
        pauseManager: overrides && overrides.hasOwnProperty('pauseManager') ? overrides.pauseManager! : 'surgo',
        poolCreator: overrides && overrides.hasOwnProperty('poolCreator') ? overrides.poolCreator! : 'avaritia',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 4192,
        staking: overrides && overrides.hasOwnProperty('staking') ? overrides.staking! : aGqlPoolStaking(),
        swapFeeManager: overrides && overrides.hasOwnProperty('swapFeeManager') ? overrides.swapFeeManager! : 'alius',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'adsuesco',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['tamquam'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlPoolToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
        userBalance:
            overrides && overrides.hasOwnProperty('userBalance') ? overrides.userBalance! : aGqlPoolUserBalance(),
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 5629,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 3149,
        withdrawConfig:
            overrides && overrides.hasOwnProperty('withdrawConfig')
                ? overrides.withdrawConfig!
                : aGqlPoolWithdrawConfig(),
    };
};

export const aGqlPoolWithdrawConfig = (overrides?: Partial<GqlPoolWithdrawConfig>): GqlPoolWithdrawConfig => {
    return {
        options: overrides && overrides.hasOwnProperty('options') ? overrides.options! : [aGqlPoolWithdrawOption()],
        proportionalEnabled:
            overrides && overrides.hasOwnProperty('proportionalEnabled') ? overrides.proportionalEnabled! : true,
        singleAssetEnabled:
            overrides && overrides.hasOwnProperty('singleAssetEnabled') ? overrides.singleAssetEnabled! : false,
    };
};

export const aGqlPoolWithdrawOption = (overrides?: Partial<GqlPoolWithdrawOption>): GqlPoolWithdrawOption => {
    return {
        poolTokenAddress:
            overrides && overrides.hasOwnProperty('poolTokenAddress') ? overrides.poolTokenAddress! : 'tondeo',
        poolTokenIndex: overrides && overrides.hasOwnProperty('poolTokenIndex') ? overrides.poolTokenIndex! : 8331,
        tokenOptions:
            overrides && overrides.hasOwnProperty('tokenOptions') ? overrides.tokenOptions! : [aGqlPoolToken()],
    };
};

export const aGqlPriceImpact = (overrides?: Partial<GqlPriceImpact>): GqlPriceImpact => {
    return {
        error: overrides && overrides.hasOwnProperty('error') ? overrides.error! : 'carmen',
        priceImpact: overrides && overrides.hasOwnProperty('priceImpact') ? overrides.priceImpact! : 'tantum',
    };
};

export const aGqlPriceRateProviderData = (overrides?: Partial<GqlPriceRateProviderData>): GqlPriceRateProviderData => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'absque',
        factory: overrides && overrides.hasOwnProperty('factory') ? overrides.factory! : 'bibo',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'eaque',
        reviewFile: overrides && overrides.hasOwnProperty('reviewFile') ? overrides.reviewFile! : 'venio',
        reviewed: overrides && overrides.hasOwnProperty('reviewed') ? overrides.reviewed! : true,
        summary: overrides && overrides.hasOwnProperty('summary') ? overrides.summary! : 'tergo',
        upgradeableComponents:
            overrides && overrides.hasOwnProperty('upgradeableComponents')
                ? overrides.upgradeableComponents!
                : [aGqlPriceRateProviderUpgradeableComponent()],
        warnings: overrides && overrides.hasOwnProperty('warnings') ? overrides.warnings! : ['statim'],
    };
};

export const aGqlPriceRateProviderUpgradeableComponent = (
    overrides?: Partial<GqlPriceRateProviderUpgradeableComponent>,
): GqlPriceRateProviderUpgradeableComponent => {
    return {
        entryPoint: overrides && overrides.hasOwnProperty('entryPoint') ? overrides.entryPoint! : 'delicate',
        implementationReviewed:
            overrides && overrides.hasOwnProperty('implementationReviewed')
                ? overrides.implementationReviewed!
                : 'sufficio',
    };
};

export const aGqlProtocolMetricsAggregated = (
    overrides?: Partial<GqlProtocolMetricsAggregated>,
): GqlProtocolMetricsAggregated => {
    return {
        chains: overrides && overrides.hasOwnProperty('chains') ? overrides.chains! : [aGqlProtocolMetricsChain()],
        numLiquidityProviders:
            overrides && overrides.hasOwnProperty('numLiquidityProviders')
                ? overrides.numLiquidityProviders!
                : 'tabesco',
        poolCount: overrides && overrides.hasOwnProperty('poolCount') ? overrides.poolCount! : 'conturbo',
        surplus24h: overrides && overrides.hasOwnProperty('surplus24h') ? overrides.surplus24h! : 'crudelis',
        swapFee24h: overrides && overrides.hasOwnProperty('swapFee24h') ? overrides.swapFee24h! : 'pecto',
        swapVolume24h: overrides && overrides.hasOwnProperty('swapVolume24h') ? overrides.swapVolume24h! : 'impedit',
        totalLiquidity: overrides && overrides.hasOwnProperty('totalLiquidity') ? overrides.totalLiquidity! : 'audio',
        totalSwapFee: overrides && overrides.hasOwnProperty('totalSwapFee') ? overrides.totalSwapFee! : 'demens',
        totalSwapVolume:
            overrides && overrides.hasOwnProperty('totalSwapVolume') ? overrides.totalSwapVolume! : 'totidem',
        yieldCapture24h: overrides && overrides.hasOwnProperty('yieldCapture24h') ? overrides.yieldCapture24h! : 'iste',
    };
};

export const aGqlProtocolMetricsChain = (overrides?: Partial<GqlProtocolMetricsChain>): GqlProtocolMetricsChain => {
    return {
        chainId: overrides && overrides.hasOwnProperty('chainId') ? overrides.chainId! : 'calcar',
        numLiquidityProviders:
            overrides && overrides.hasOwnProperty('numLiquidityProviders') ? overrides.numLiquidityProviders! : 'arto',
        poolCount: overrides && overrides.hasOwnProperty('poolCount') ? overrides.poolCount! : 'cicuta',
        surplus24h: overrides && overrides.hasOwnProperty('surplus24h') ? overrides.surplus24h! : 'comminor',
        swapFee24h: overrides && overrides.hasOwnProperty('swapFee24h') ? overrides.swapFee24h! : 'artificiose',
        swapVolume24h: overrides && overrides.hasOwnProperty('swapVolume24h') ? overrides.swapVolume24h! : 'cicuta',
        totalLiquidity:
            overrides && overrides.hasOwnProperty('totalLiquidity') ? overrides.totalLiquidity! : 'temeritas',
        totalSwapFee: overrides && overrides.hasOwnProperty('totalSwapFee') ? overrides.totalSwapFee! : 'adamo',
        totalSwapVolume:
            overrides && overrides.hasOwnProperty('totalSwapVolume') ? overrides.totalSwapVolume! : 'cilicium',
        yieldCapture24h:
            overrides && overrides.hasOwnProperty('yieldCapture24h') ? overrides.yieldCapture24h! : 'trepide',
    };
};

export const aGqlRelicSnapshot = (overrides?: Partial<GqlRelicSnapshot>): GqlRelicSnapshot => {
    return {
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'degenero',
        entryTimestamp: overrides && overrides.hasOwnProperty('entryTimestamp') ? overrides.entryTimestamp! : 6035,
        farmId: overrides && overrides.hasOwnProperty('farmId') ? overrides.farmId! : 'argumentum',
        level: overrides && overrides.hasOwnProperty('level') ? overrides.level! : 9161,
        relicId: overrides && overrides.hasOwnProperty('relicId') ? overrides.relicId! : 6287,
    };
};

export const aGqlReliquaryFarmLevelSnapshot = (
    overrides?: Partial<GqlReliquaryFarmLevelSnapshot>,
): GqlReliquaryFarmLevelSnapshot => {
    return {
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'laborum',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '81ac945c-8237-4277-9860-c4eba842026b',
        level: overrides && overrides.hasOwnProperty('level') ? overrides.level! : 'confugo',
    };
};

export const aGqlReliquaryFarmSnapshot = (overrides?: Partial<GqlReliquaryFarmSnapshot>): GqlReliquaryFarmSnapshot => {
    return {
        dailyDeposited: overrides && overrides.hasOwnProperty('dailyDeposited') ? overrides.dailyDeposited! : 'depulso',
        dailyWithdrawn: overrides && overrides.hasOwnProperty('dailyWithdrawn') ? overrides.dailyWithdrawn! : 'quam',
        farmId: overrides && overrides.hasOwnProperty('farmId') ? overrides.farmId! : 'arca',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '2bbe0f78-8fc7-4c93-a195-b52a873f3c17',
        levelBalances:
            overrides && overrides.hasOwnProperty('levelBalances')
                ? overrides.levelBalances!
                : [aGqlReliquaryFarmLevelSnapshot()],
        relicCount: overrides && overrides.hasOwnProperty('relicCount') ? overrides.relicCount! : 'aetas',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 6195,
        totalBalance: overrides && overrides.hasOwnProperty('totalBalance') ? overrides.totalBalance! : 'carpo',
        totalLiquidity:
            overrides && overrides.hasOwnProperty('totalLiquidity') ? overrides.totalLiquidity! : 'adipisci',
        userCount: overrides && overrides.hasOwnProperty('userCount') ? overrides.userCount! : 'velum',
    };
};

export const aGqlSftmxStakingData = (overrides?: Partial<GqlSftmxStakingData>): GqlSftmxStakingData => {
    return {
        exchangeRate: overrides && overrides.hasOwnProperty('exchangeRate') ? overrides.exchangeRate! : 'thymum',
        maintenancePaused:
            overrides && overrides.hasOwnProperty('maintenancePaused') ? overrides.maintenancePaused! : false,
        maxDepositLimit:
            overrides && overrides.hasOwnProperty('maxDepositLimit') ? overrides.maxDepositLimit! : 'coaegresco',
        minDepositLimit:
            overrides && overrides.hasOwnProperty('minDepositLimit') ? overrides.minDepositLimit! : 'repellendus',
        numberOfVaults: overrides && overrides.hasOwnProperty('numberOfVaults') ? overrides.numberOfVaults! : 6808,
        stakingApr: overrides && overrides.hasOwnProperty('stakingApr') ? overrides.stakingApr! : 'validus',
        totalFtmAmount:
            overrides && overrides.hasOwnProperty('totalFtmAmount') ? overrides.totalFtmAmount! : 'possimus',
        totalFtmAmountInPool:
            overrides && overrides.hasOwnProperty('totalFtmAmountInPool') ? overrides.totalFtmAmountInPool! : 'arbor',
        totalFtmAmountStaked:
            overrides && overrides.hasOwnProperty('totalFtmAmountStaked') ? overrides.totalFtmAmountStaked! : 'ager',
        undelegatePaused:
            overrides && overrides.hasOwnProperty('undelegatePaused') ? overrides.undelegatePaused! : false,
        vaults: overrides && overrides.hasOwnProperty('vaults') ? overrides.vaults! : [aGqlSftmxStakingVault()],
        withdrawPaused: overrides && overrides.hasOwnProperty('withdrawPaused') ? overrides.withdrawPaused! : true,
        withdrawalDelay: overrides && overrides.hasOwnProperty('withdrawalDelay') ? overrides.withdrawalDelay! : 9220,
    };
};

export const aGqlSftmxStakingSnapshot = (overrides?: Partial<GqlSftmxStakingSnapshot>): GqlSftmxStakingSnapshot => {
    return {
        exchangeRate: overrides && overrides.hasOwnProperty('exchangeRate') ? overrides.exchangeRate! : 'correptius',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'eb564479-a90e-4e35-8fd0-c1f87e7b7f74',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 546,
        totalFtmAmount: overrides && overrides.hasOwnProperty('totalFtmAmount') ? overrides.totalFtmAmount! : 'cibus',
        totalFtmAmountInPool:
            overrides && overrides.hasOwnProperty('totalFtmAmountInPool')
                ? overrides.totalFtmAmountInPool!
                : 'sustineo',
        totalFtmAmountStaked:
            overrides && overrides.hasOwnProperty('totalFtmAmountStaked')
                ? overrides.totalFtmAmountStaked!
                : 'decretum',
    };
};

export const aGqlSftmxStakingVault = (overrides?: Partial<GqlSftmxStakingVault>): GqlSftmxStakingVault => {
    return {
        ftmAmountStaked:
            overrides && overrides.hasOwnProperty('ftmAmountStaked') ? overrides.ftmAmountStaked! : 'aperio',
        isMatured: overrides && overrides.hasOwnProperty('isMatured') ? overrides.isMatured! : false,
        unlockTimestamp: overrides && overrides.hasOwnProperty('unlockTimestamp') ? overrides.unlockTimestamp! : 6127,
        validatorAddress:
            overrides && overrides.hasOwnProperty('validatorAddress') ? overrides.validatorAddress! : 'derelinquo',
        validatorId: overrides && overrides.hasOwnProperty('validatorId') ? overrides.validatorId! : 'comburo',
        vaultAddress: overrides && overrides.hasOwnProperty('vaultAddress') ? overrides.vaultAddress! : 'chirographum',
        vaultIndex: overrides && overrides.hasOwnProperty('vaultIndex') ? overrides.vaultIndex! : 1031,
    };
};

export const aGqlSftmxWithdrawalRequests = (
    overrides?: Partial<GqlSftmxWithdrawalRequests>,
): GqlSftmxWithdrawalRequests => {
    return {
        amountSftmx: overrides && overrides.hasOwnProperty('amountSftmx') ? overrides.amountSftmx! : 'tempore',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'tui',
        isWithdrawn: overrides && overrides.hasOwnProperty('isWithdrawn') ? overrides.isWithdrawn! : true,
        requestTimestamp:
            overrides && overrides.hasOwnProperty('requestTimestamp') ? overrides.requestTimestamp! : 5173,
        user: overrides && overrides.hasOwnProperty('user') ? overrides.user! : 'ventito',
    };
};

export const aGqlSorCallData = (overrides?: Partial<GqlSorCallData>): GqlSorCallData => {
    return {
        callData: overrides && overrides.hasOwnProperty('callData') ? overrides.callData! : 'iusto',
        maxAmountInRaw: overrides && overrides.hasOwnProperty('maxAmountInRaw') ? overrides.maxAmountInRaw! : 'tamdiu',
        minAmountOutRaw:
            overrides && overrides.hasOwnProperty('minAmountOutRaw') ? overrides.minAmountOutRaw! : 'traho',
        to: overrides && overrides.hasOwnProperty('to') ? overrides.to! : 'pax',
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'subnecto',
    };
};

export const aGqlSorGetSwapPaths = (overrides?: Partial<GqlSorGetSwapPaths>): GqlSorGetSwapPaths => {
    return {
        callData: overrides && overrides.hasOwnProperty('callData') ? overrides.callData! : aGqlSorCallData(),
        effectivePrice:
            overrides && overrides.hasOwnProperty('effectivePrice') ? overrides.effectivePrice! : 'volutabrum',
        effectivePriceReversed:
            overrides && overrides.hasOwnProperty('effectivePriceReversed')
                ? overrides.effectivePriceReversed!
                : 'contego',
        paths: overrides && overrides.hasOwnProperty('paths') ? overrides.paths! : [aGqlSorPath()],
        priceImpact: overrides && overrides.hasOwnProperty('priceImpact') ? overrides.priceImpact! : aGqlPriceImpact(),
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 5291,
        returnAmount: overrides && overrides.hasOwnProperty('returnAmount') ? overrides.returnAmount! : 'audio',
        returnAmountRaw:
            overrides && overrides.hasOwnProperty('returnAmountRaw') ? overrides.returnAmountRaw! : 'vulgus',
        routes: overrides && overrides.hasOwnProperty('routes') ? overrides.routes! : [aGqlSorSwapRoute()],
        swapAmount: overrides && overrides.hasOwnProperty('swapAmount') ? overrides.swapAmount! : 'vigilo',
        swapAmountRaw: overrides && overrides.hasOwnProperty('swapAmountRaw') ? overrides.swapAmountRaw! : 'conatus',
        swapType: overrides && overrides.hasOwnProperty('swapType') ? overrides.swapType! : GqlSorSwapType.EXACT_IN,
        swaps: overrides && overrides.hasOwnProperty('swaps') ? overrides.swaps! : [aGqlSorSwap()],
        tokenAddresses: overrides && overrides.hasOwnProperty('tokenAddresses') ? overrides.tokenAddresses! : ['arma'],
        tokenIn: overrides && overrides.hasOwnProperty('tokenIn') ? overrides.tokenIn! : 'umbra',
        tokenInAmount: overrides && overrides.hasOwnProperty('tokenInAmount') ? overrides.tokenInAmount! : 'odit',
        tokenOut: overrides && overrides.hasOwnProperty('tokenOut') ? overrides.tokenOut! : 'argentum',
        tokenOutAmount: overrides && overrides.hasOwnProperty('tokenOutAmount') ? overrides.tokenOutAmount! : 'appono',
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 4027,
    };
};

export const aGqlSorPath = (overrides?: Partial<GqlSorPath>): GqlSorPath => {
    return {
        inputAmountRaw: overrides && overrides.hasOwnProperty('inputAmountRaw') ? overrides.inputAmountRaw! : 'aggero',
        isBuffer: overrides && overrides.hasOwnProperty('isBuffer') ? overrides.isBuffer! : [true],
        outputAmountRaw:
            overrides && overrides.hasOwnProperty('outputAmountRaw') ? overrides.outputAmountRaw! : 'calcar',
        pools: overrides && overrides.hasOwnProperty('pools') ? overrides.pools! : ['civis'],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 6867,
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aToken()],
        vaultVersion: overrides && overrides.hasOwnProperty('vaultVersion') ? overrides.vaultVersion! : 211,
    };
};

export const aGqlSorSwap = (overrides?: Partial<GqlSorSwap>): GqlSorSwap => {
    return {
        amount: overrides && overrides.hasOwnProperty('amount') ? overrides.amount! : 'fugiat',
        assetInIndex: overrides && overrides.hasOwnProperty('assetInIndex') ? overrides.assetInIndex! : 4773,
        assetOutIndex: overrides && overrides.hasOwnProperty('assetOutIndex') ? overrides.assetOutIndex! : 8666,
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'barba',
        userData: overrides && overrides.hasOwnProperty('userData') ? overrides.userData! : 'reiciendis',
    };
};

export const aGqlSorSwapRoute = (overrides?: Partial<GqlSorSwapRoute>): GqlSorSwapRoute => {
    return {
        hops: overrides && overrides.hasOwnProperty('hops') ? overrides.hops! : [aGqlSorSwapRouteHop()],
        share: overrides && overrides.hasOwnProperty('share') ? overrides.share! : 3.1,
        tokenIn: overrides && overrides.hasOwnProperty('tokenIn') ? overrides.tokenIn! : 'congregatio',
        tokenInAmount: overrides && overrides.hasOwnProperty('tokenInAmount') ? overrides.tokenInAmount! : 'aspicio',
        tokenOut: overrides && overrides.hasOwnProperty('tokenOut') ? overrides.tokenOut! : 'tutamen',
        tokenOutAmount:
            overrides && overrides.hasOwnProperty('tokenOutAmount') ? overrides.tokenOutAmount! : 'deprecator',
    };
};

export const aGqlSorSwapRouteHop = (overrides?: Partial<GqlSorSwapRouteHop>): GqlSorSwapRouteHop => {
    return {
        pool: overrides && overrides.hasOwnProperty('pool') ? overrides.pool! : aGqlPoolMinimal(),
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'depulso',
        tokenIn: overrides && overrides.hasOwnProperty('tokenIn') ? overrides.tokenIn! : 'valens',
        tokenInAmount: overrides && overrides.hasOwnProperty('tokenInAmount') ? overrides.tokenInAmount! : 'ait',
        tokenOut: overrides && overrides.hasOwnProperty('tokenOut') ? overrides.tokenOut! : 'arto',
        tokenOutAmount: overrides && overrides.hasOwnProperty('tokenOutAmount') ? overrides.tokenOutAmount! : 'dolor',
    };
};

export const aGqlStakedSonicData = (overrides?: Partial<GqlStakedSonicData>): GqlStakedSonicData => {
    return {
        delegatedValidators:
            overrides && overrides.hasOwnProperty('delegatedValidators')
                ? overrides.delegatedValidators!
                : [aGqlStakedSonicDelegatedValidator()],
        exchangeRate: overrides && overrides.hasOwnProperty('exchangeRate') ? overrides.exchangeRate! : 'delego',
        protocolFee24h:
            overrides && overrides.hasOwnProperty('protocolFee24h') ? overrides.protocolFee24h! : 'laboriosam',
        rewardsClaimed24h:
            overrides && overrides.hasOwnProperty('rewardsClaimed24h') ? overrides.rewardsClaimed24h! : 'dignissimos',
        stakingApr: overrides && overrides.hasOwnProperty('stakingApr') ? overrides.stakingApr! : 'ut',
        totalAssets: overrides && overrides.hasOwnProperty('totalAssets') ? overrides.totalAssets! : 'contabesco',
        totalAssetsDelegated:
            overrides && overrides.hasOwnProperty('totalAssetsDelegated') ? overrides.totalAssetsDelegated! : 'crebro',
        totalAssetsPool: overrides && overrides.hasOwnProperty('totalAssetsPool') ? overrides.totalAssetsPool! : 'ait',
    };
};

export const aGqlStakedSonicDelegatedValidator = (
    overrides?: Partial<GqlStakedSonicDelegatedValidator>,
): GqlStakedSonicDelegatedValidator => {
    return {
        assetsDelegated:
            overrides && overrides.hasOwnProperty('assetsDelegated') ? overrides.assetsDelegated! : 'derelinquo',
        validatorId: overrides && overrides.hasOwnProperty('validatorId') ? overrides.validatorId! : 'assentator',
    };
};

export const aGqlStakedSonicSnapshot = (overrides?: Partial<GqlStakedSonicSnapshot>): GqlStakedSonicSnapshot => {
    return {
        exchangeRate: overrides && overrides.hasOwnProperty('exchangeRate') ? overrides.exchangeRate! : 'uter',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '1fe70cba-de86-490a-b4a3-3b9a185faeab',
        protocolFee24h: overrides && overrides.hasOwnProperty('protocolFee24h') ? overrides.protocolFee24h! : 'quis',
        rewardsClaimed24h:
            overrides && overrides.hasOwnProperty('rewardsClaimed24h') ? overrides.rewardsClaimed24h! : 'eligendi',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 2290,
        totalAssets: overrides && overrides.hasOwnProperty('totalAssets') ? overrides.totalAssets! : 'aperte',
        totalAssetsDelegated:
            overrides && overrides.hasOwnProperty('totalAssetsDelegated')
                ? overrides.totalAssetsDelegated!
                : 'tripudio',
        totalAssetsPool:
            overrides && overrides.hasOwnProperty('totalAssetsPool') ? overrides.totalAssetsPool! : 'stella',
    };
};

export const aGqlSwapCallDataInput = (overrides?: Partial<GqlSwapCallDataInput>): GqlSwapCallDataInput => {
    return {
        deadline: overrides && overrides.hasOwnProperty('deadline') ? overrides.deadline! : 5988,
        receiver: overrides && overrides.hasOwnProperty('receiver') ? overrides.receiver! : 'careo',
        sender: overrides && overrides.hasOwnProperty('sender') ? overrides.sender! : 'vulgo',
        slippagePercentage:
            overrides && overrides.hasOwnProperty('slippagePercentage') ? overrides.slippagePercentage! : 'addo',
    };
};

export const aGqlToken = (overrides?: Partial<GqlToken>): GqlToken => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'vinculum',
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        chainId: overrides && overrides.hasOwnProperty('chainId') ? overrides.chainId! : 8759,
        coingeckoId: overrides && overrides.hasOwnProperty('coingeckoId') ? overrides.coingeckoId! : 'clibanus',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 5655,
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'arma',
        discordUrl: overrides && overrides.hasOwnProperty('discordUrl') ? overrides.discordUrl! : 'volutabrum',
        erc4626ReviewData:
            overrides && overrides.hasOwnProperty('erc4626ReviewData')
                ? overrides.erc4626ReviewData!
                : anErc4626ReviewData(),
        isBufferAllowed: overrides && overrides.hasOwnProperty('isBufferAllowed') ? overrides.isBufferAllowed! : true,
        isErc4626: overrides && overrides.hasOwnProperty('isErc4626') ? overrides.isErc4626! : true,
        logoURI: overrides && overrides.hasOwnProperty('logoURI') ? overrides.logoURI! : 'calco',
        maxDeposit: overrides && overrides.hasOwnProperty('maxDeposit') ? overrides.maxDeposit! : 'ultra',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'bos',
        priceRateProviderData:
            overrides && overrides.hasOwnProperty('priceRateProviderData')
                ? overrides.priceRateProviderData!
                : aGqlPriceRateProviderData(),
        priority: overrides && overrides.hasOwnProperty('priority') ? overrides.priority! : 6873,
        rateProviderData:
            overrides && overrides.hasOwnProperty('rateProviderData')
                ? overrides.rateProviderData!
                : aGqlPriceRateProviderData(),
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'torqueo',
        telegramUrl: overrides && overrides.hasOwnProperty('telegramUrl') ? overrides.telegramUrl! : 'accusamus',
        tradable: overrides && overrides.hasOwnProperty('tradable') ? overrides.tradable! : false,
        twitterUsername:
            overrides && overrides.hasOwnProperty('twitterUsername') ? overrides.twitterUsername! : 'antepono',
        types: overrides && overrides.hasOwnProperty('types') ? overrides.types! : [GqlTokenType.BLOCKED_V2],
        underlyingTokenAddress:
            overrides && overrides.hasOwnProperty('underlyingTokenAddress')
                ? overrides.underlyingTokenAddress!
                : 'victus',
        websiteUrl: overrides && overrides.hasOwnProperty('websiteUrl') ? overrides.websiteUrl! : 'asporto',
    };
};

export const aGqlTokenAmountHumanReadable = (
    overrides?: Partial<GqlTokenAmountHumanReadable>,
): GqlTokenAmountHumanReadable => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'ducimus',
        amount: overrides && overrides.hasOwnProperty('amount') ? overrides.amount! : 'thesis',
    };
};

export const aGqlTokenCandlestickChartDataItem = (
    overrides?: Partial<GqlTokenCandlestickChartDataItem>,
): GqlTokenCandlestickChartDataItem => {
    return {
        close: overrides && overrides.hasOwnProperty('close') ? overrides.close! : 'sollicito',
        high: overrides && overrides.hasOwnProperty('high') ? overrides.high! : 'verbera',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'b65d9154-bb0e-40ee-b9bc-a322542779db',
        low: overrides && overrides.hasOwnProperty('low') ? overrides.low! : 'in',
        open: overrides && overrides.hasOwnProperty('open') ? overrides.open! : 'nihil',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 3515,
    };
};

export const aGqlTokenData = (overrides?: Partial<GqlTokenData>): GqlTokenData => {
    return {
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'vehemens',
        discordUrl: overrides && overrides.hasOwnProperty('discordUrl') ? overrides.discordUrl! : 'deleniti',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '1542776a-94b1-45ec-90c9-51960a8b6e1d',
        telegramUrl: overrides && overrides.hasOwnProperty('telegramUrl') ? overrides.telegramUrl! : 'vehemens',
        tokenAddress: overrides && overrides.hasOwnProperty('tokenAddress') ? overrides.tokenAddress! : 'sumo',
        twitterUsername:
            overrides && overrides.hasOwnProperty('twitterUsername') ? overrides.twitterUsername! : 'quibusdam',
        websiteUrl: overrides && overrides.hasOwnProperty('websiteUrl') ? overrides.websiteUrl! : 'tres',
    };
};

export const aGqlTokenDynamicData = (overrides?: Partial<GqlTokenDynamicData>): GqlTokenDynamicData => {
    return {
        ath: overrides && overrides.hasOwnProperty('ath') ? overrides.ath! : 3.5,
        atl: overrides && overrides.hasOwnProperty('atl') ? overrides.atl! : 0.7,
        fdv: overrides && overrides.hasOwnProperty('fdv') ? overrides.fdv! : 'voluptate',
        high24h: overrides && overrides.hasOwnProperty('high24h') ? overrides.high24h! : 7.8,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'paens',
        low24h: overrides && overrides.hasOwnProperty('low24h') ? overrides.low24h! : 0,
        marketCap: overrides && overrides.hasOwnProperty('marketCap') ? overrides.marketCap! : 'allatus',
        price: overrides && overrides.hasOwnProperty('price') ? overrides.price! : 5.8,
        priceChange24h: overrides && overrides.hasOwnProperty('priceChange24h') ? overrides.priceChange24h! : 5,
        priceChangePercent7d:
            overrides && overrides.hasOwnProperty('priceChangePercent7d') ? overrides.priceChangePercent7d! : 7.5,
        priceChangePercent14d:
            overrides && overrides.hasOwnProperty('priceChangePercent14d') ? overrides.priceChangePercent14d! : 0.7,
        priceChangePercent24h:
            overrides && overrides.hasOwnProperty('priceChangePercent24h') ? overrides.priceChangePercent24h! : 1.2,
        priceChangePercent30d:
            overrides && overrides.hasOwnProperty('priceChangePercent30d') ? overrides.priceChangePercent30d! : 7.5,
        tokenAddress: overrides && overrides.hasOwnProperty('tokenAddress') ? overrides.tokenAddress! : 'volo',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'sum',
    };
};

export const aGqlTokenFilter = (overrides?: Partial<GqlTokenFilter>): GqlTokenFilter => {
    return {
        tokensIn: overrides && overrides.hasOwnProperty('tokensIn') ? overrides.tokensIn! : ['talus'],
        typeIn: overrides && overrides.hasOwnProperty('typeIn') ? overrides.typeIn! : [GqlTokenType.BLOCKED_V2],
    };
};

export const aGqlTokenMutationResult = (overrides?: Partial<GqlTokenMutationResult>): GqlTokenMutationResult => {
    return {
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        error: overrides && overrides.hasOwnProperty('error') ? overrides.error! : 'eos',
        success: overrides && overrides.hasOwnProperty('success') ? overrides.success! : false,
    };
};

export const aGqlTokenPrice = (overrides?: Partial<GqlTokenPrice>): GqlTokenPrice => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'surculus',
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        price: overrides && overrides.hasOwnProperty('price') ? overrides.price! : 9.5,
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 1169,
        updatedBy: overrides && overrides.hasOwnProperty('updatedBy') ? overrides.updatedBy! : 'dignissimos',
    };
};

export const aGqlTokenPriceChartDataItem = (
    overrides?: Partial<GqlTokenPriceChartDataItem>,
): GqlTokenPriceChartDataItem => {
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '6df20e2a-c331-4aa2-bb26-72d9c22c5c50',
        price: overrides && overrides.hasOwnProperty('price') ? overrides.price! : 'absens',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 6258,
    };
};

export const aGqlUserFbeetsBalance = (overrides?: Partial<GqlUserFbeetsBalance>): GqlUserFbeetsBalance => {
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'comparo',
        stakedBalance: overrides && overrides.hasOwnProperty('stakedBalance') ? overrides.stakedBalance! : 'comptus',
        totalBalance: overrides && overrides.hasOwnProperty('totalBalance') ? overrides.totalBalance! : 'brevis',
        walletBalance: overrides && overrides.hasOwnProperty('walletBalance') ? overrides.walletBalance! : 'verto',
    };
};

export const aGqlUserPoolBalance = (overrides?: Partial<GqlUserPoolBalance>): GqlUserPoolBalance => {
    return {
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        poolId: overrides && overrides.hasOwnProperty('poolId') ? overrides.poolId! : 'vado',
        stakedBalance: overrides && overrides.hasOwnProperty('stakedBalance') ? overrides.stakedBalance! : 'cui',
        tokenAddress: overrides && overrides.hasOwnProperty('tokenAddress') ? overrides.tokenAddress! : 'decretum',
        tokenPrice: overrides && overrides.hasOwnProperty('tokenPrice') ? overrides.tokenPrice! : 9.8,
        totalBalance: overrides && overrides.hasOwnProperty('totalBalance') ? overrides.totalBalance! : 'tempora',
        walletBalance: overrides && overrides.hasOwnProperty('walletBalance') ? overrides.walletBalance! : 'aperio',
    };
};

export const aGqlUserStakedBalance = (overrides?: Partial<GqlUserStakedBalance>): GqlUserStakedBalance => {
    return {
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'iusto',
        balanceUsd: overrides && overrides.hasOwnProperty('balanceUsd') ? overrides.balanceUsd! : 2.3,
        stakingId: overrides && overrides.hasOwnProperty('stakingId') ? overrides.stakingId! : 'nostrum',
        stakingType:
            overrides && overrides.hasOwnProperty('stakingType') ? overrides.stakingType! : GqlPoolStakingType.AURA,
    };
};

export const aGqlUserSwapVolumeFilter = (overrides?: Partial<GqlUserSwapVolumeFilter>): GqlUserSwapVolumeFilter => {
    return {
        poolIdIn: overrides && overrides.hasOwnProperty('poolIdIn') ? overrides.poolIdIn! : ['capio'],
        tokenInIn: overrides && overrides.hasOwnProperty('tokenInIn') ? overrides.tokenInIn! : ['theologus'],
        tokenOutIn: overrides && overrides.hasOwnProperty('tokenOutIn') ? overrides.tokenOutIn! : ['suus'],
    };
};

export const aGqlVeBalBalance = (overrides?: Partial<GqlVeBalBalance>): GqlVeBalBalance => {
    return {
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'voco',
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        locked: overrides && overrides.hasOwnProperty('locked') ? overrides.locked! : 'coruscus',
        lockedUsd: overrides && overrides.hasOwnProperty('lockedUsd') ? overrides.lockedUsd! : 'calamitas',
    };
};

export const aGqlVeBalLockSnapshot = (overrides?: Partial<GqlVeBalLockSnapshot>): GqlVeBalLockSnapshot => {
    return {
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'spiculum',
        bias: overrides && overrides.hasOwnProperty('bias') ? overrides.bias! : 'cohaero',
        slope: overrides && overrides.hasOwnProperty('slope') ? overrides.slope! : 'talus',
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 3964,
    };
};

export const aGqlVeBalUserData = (overrides?: Partial<GqlVeBalUserData>): GqlVeBalUserData => {
    return {
        balance: overrides && overrides.hasOwnProperty('balance') ? overrides.balance! : 'coadunatio',
        lockSnapshots:
            overrides && overrides.hasOwnProperty('lockSnapshots')
                ? overrides.lockSnapshots!
                : [aGqlVeBalLockSnapshot()],
        locked: overrides && overrides.hasOwnProperty('locked') ? overrides.locked! : 'crebro',
        lockedUsd: overrides && overrides.hasOwnProperty('lockedUsd') ? overrides.lockedUsd! : 'decimus',
        rank: overrides && overrides.hasOwnProperty('rank') ? overrides.rank! : 7664,
    };
};

export const aGqlVotingGauge = (overrides?: Partial<GqlVotingGauge>): GqlVotingGauge => {
    return {
        addedTimestamp: overrides && overrides.hasOwnProperty('addedTimestamp') ? overrides.addedTimestamp! : 2496,
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'causa',
        childGaugeAddress:
            overrides && overrides.hasOwnProperty('childGaugeAddress') ? overrides.childGaugeAddress! : 'canto',
        isKilled: overrides && overrides.hasOwnProperty('isKilled') ? overrides.isKilled! : true,
        relativeWeight:
            overrides && overrides.hasOwnProperty('relativeWeight') ? overrides.relativeWeight! : 'venustas',
        relativeWeightCap:
            overrides && overrides.hasOwnProperty('relativeWeightCap') ? overrides.relativeWeightCap! : 'atque',
    };
};

export const aGqlVotingGaugeToken = (overrides?: Partial<GqlVotingGaugeToken>): GqlVotingGaugeToken => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'ustilo',
        logoURI: overrides && overrides.hasOwnProperty('logoURI') ? overrides.logoURI! : 'benevolentia',
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'quis',
        underlyingTokenAddress:
            overrides && overrides.hasOwnProperty('underlyingTokenAddress')
                ? overrides.underlyingTokenAddress!
                : 'turba',
        weight: overrides && overrides.hasOwnProperty('weight') ? overrides.weight! : 'synagoga',
    };
};

export const aGqlVotingPool = (overrides?: Partial<GqlVotingPool>): GqlVotingPool => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'aliqua',
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
        gauge: overrides && overrides.hasOwnProperty('gauge') ? overrides.gauge! : aGqlVotingGauge(),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '5596acef-a1b2-436b-adfe-456f1d9e084c',
        poolTokens:
            overrides && overrides.hasOwnProperty('poolTokens') ? overrides.poolTokens! : [aGqlPoolTokenDetail()],
        protocolVersion: overrides && overrides.hasOwnProperty('protocolVersion') ? overrides.protocolVersion! : 253,
        symbol: overrides && overrides.hasOwnProperty('symbol') ? overrides.symbol! : 'victoria',
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : ['veritatis'],
        tokens: overrides && overrides.hasOwnProperty('tokens') ? overrides.tokens! : [aGqlVotingGaugeToken()],
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : GqlPoolType.COMPOSABLE_STABLE,
    };
};

export const aHookConfig = (overrides?: Partial<HookConfig>): HookConfig => {
    return {
        enableHookAdjustedAmounts:
            overrides && overrides.hasOwnProperty('enableHookAdjustedAmounts')
                ? overrides.enableHookAdjustedAmounts!
                : true,
        shouldCallAfterAddLiquidity:
            overrides && overrides.hasOwnProperty('shouldCallAfterAddLiquidity')
                ? overrides.shouldCallAfterAddLiquidity!
                : false,
        shouldCallAfterInitialize:
            overrides && overrides.hasOwnProperty('shouldCallAfterInitialize')
                ? overrides.shouldCallAfterInitialize!
                : true,
        shouldCallAfterRemoveLiquidity:
            overrides && overrides.hasOwnProperty('shouldCallAfterRemoveLiquidity')
                ? overrides.shouldCallAfterRemoveLiquidity!
                : true,
        shouldCallAfterSwap:
            overrides && overrides.hasOwnProperty('shouldCallAfterSwap') ? overrides.shouldCallAfterSwap! : false,
        shouldCallBeforeAddLiquidity:
            overrides && overrides.hasOwnProperty('shouldCallBeforeAddLiquidity')
                ? overrides.shouldCallBeforeAddLiquidity!
                : true,
        shouldCallBeforeInitialize:
            overrides && overrides.hasOwnProperty('shouldCallBeforeInitialize')
                ? overrides.shouldCallBeforeInitialize!
                : true,
        shouldCallBeforeRemoveLiquidity:
            overrides && overrides.hasOwnProperty('shouldCallBeforeRemoveLiquidity')
                ? overrides.shouldCallBeforeRemoveLiquidity!
                : false,
        shouldCallBeforeSwap:
            overrides && overrides.hasOwnProperty('shouldCallBeforeSwap') ? overrides.shouldCallBeforeSwap! : true,
        shouldCallComputeDynamicSwapFee:
            overrides && overrides.hasOwnProperty('shouldCallComputeDynamicSwapFee')
                ? overrides.shouldCallComputeDynamicSwapFee!
                : false,
    };
};

export const aLbpMetadataInput = (overrides?: Partial<LbpMetadataInput>): LbpMetadataInput => {
    return {
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'mollitia',
        discord: overrides && overrides.hasOwnProperty('discord') ? overrides.discord! : 'usque',
        farcaster: overrides && overrides.hasOwnProperty('farcaster') ? overrides.farcaster! : 'conqueror',
        lbpName: overrides && overrides.hasOwnProperty('lbpName') ? overrides.lbpName! : 'damno',
        telegram: overrides && overrides.hasOwnProperty('telegram') ? overrides.telegram! : 'utpote',
        tokenLogo: overrides && overrides.hasOwnProperty('tokenLogo') ? overrides.tokenLogo! : 'celo',
        website: overrides && overrides.hasOwnProperty('website') ? overrides.website! : 'voveo',
        x: overrides && overrides.hasOwnProperty('x') ? overrides.x! : 'cui',
    };
};

export const aLbpPriceChartData = (overrides?: Partial<LbpPriceChartData>): LbpPriceChartData => {
    return {
        buyVolume: overrides && overrides.hasOwnProperty('buyVolume') ? overrides.buyVolume! : 2.2,
        cumulativeFees: overrides && overrides.hasOwnProperty('cumulativeFees') ? overrides.cumulativeFees! : 4.7,
        cumulativeVolume: overrides && overrides.hasOwnProperty('cumulativeVolume') ? overrides.cumulativeVolume! : 0.6,
        fees: overrides && overrides.hasOwnProperty('fees') ? overrides.fees! : 9.3,
        intervalTimestamp:
            overrides && overrides.hasOwnProperty('intervalTimestamp') ? overrides.intervalTimestamp! : 7321,
        projectTokenBalance:
            overrides && overrides.hasOwnProperty('projectTokenBalance') ? overrides.projectTokenBalance! : 9.7,
        projectTokenPrice:
            overrides && overrides.hasOwnProperty('projectTokenPrice') ? overrides.projectTokenPrice! : 5.9,
        reservePrice: overrides && overrides.hasOwnProperty('reservePrice') ? overrides.reservePrice! : 6.5,
        reserveTokenBalance:
            overrides && overrides.hasOwnProperty('reserveTokenBalance') ? overrides.reserveTokenBalance! : 6.3,
        sellVolume: overrides && overrides.hasOwnProperty('sellVolume') ? overrides.sellVolume! : 7.4,
        swapCount: overrides && overrides.hasOwnProperty('swapCount') ? overrides.swapCount! : 1390,
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 8936,
        tvl: overrides && overrides.hasOwnProperty('tvl') ? overrides.tvl! : 9.4,
        volume: overrides && overrides.hasOwnProperty('volume') ? overrides.volume! : 3.4,
    };
};

export const aLbPoolInput = (overrides?: Partial<LbPoolInput>): LbPoolInput => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'sursum',
        chain: overrides && overrides.hasOwnProperty('chain') ? overrides.chain! : GqlChain.ARBITRUM,
    };
};

export const aLiquidityBootstrappingPoolV3Params = (
    overrides?: Partial<LiquidityBootstrappingPoolV3Params>,
): LiquidityBootstrappingPoolV3Params => {
    return {
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'creator',
        discord: overrides && overrides.hasOwnProperty('discord') ? overrides.discord! : 'cursus',
        endTime: overrides && overrides.hasOwnProperty('endTime') ? overrides.endTime! : 4758,
        farcaster: overrides && overrides.hasOwnProperty('farcaster') ? overrides.farcaster! : 'quidem',
        isProjectTokenSwapInBlocked:
            overrides && overrides.hasOwnProperty('isProjectTokenSwapInBlocked')
                ? overrides.isProjectTokenSwapInBlocked!
                : false,
        lbpName: overrides && overrides.hasOwnProperty('lbpName') ? overrides.lbpName! : 'consequatur',
        lbpOwner: overrides && overrides.hasOwnProperty('lbpOwner') ? overrides.lbpOwner! : 'culpa',
        projectToken: overrides && overrides.hasOwnProperty('projectToken') ? overrides.projectToken! : 'paulatim',
        projectTokenEndWeight:
            overrides && overrides.hasOwnProperty('projectTokenEndWeight') ? overrides.projectTokenEndWeight! : 0,
        projectTokenIndex:
            overrides && overrides.hasOwnProperty('projectTokenIndex') ? overrides.projectTokenIndex! : 9663,
        projectTokenStartWeight:
            overrides && overrides.hasOwnProperty('projectTokenStartWeight') ? overrides.projectTokenStartWeight! : 0.2,
        reserveToken: overrides && overrides.hasOwnProperty('reserveToken') ? overrides.reserveToken! : 'accommodo',
        reserveTokenEndWeight:
            overrides && overrides.hasOwnProperty('reserveTokenEndWeight') ? overrides.reserveTokenEndWeight! : 1.3,
        reserveTokenIndex:
            overrides && overrides.hasOwnProperty('reserveTokenIndex') ? overrides.reserveTokenIndex! : 432,
        reserveTokenStartWeight:
            overrides && overrides.hasOwnProperty('reserveTokenStartWeight') ? overrides.reserveTokenStartWeight! : 1.2,
        startTime: overrides && overrides.hasOwnProperty('startTime') ? overrides.startTime! : 1614,
        telegram: overrides && overrides.hasOwnProperty('telegram') ? overrides.telegram! : 'tego',
        topTrades: overrides && overrides.hasOwnProperty('topTrades') ? overrides.topTrades! : [aGqlLbpTopTrade()],
        website: overrides && overrides.hasOwnProperty('website') ? overrides.website! : 'ad',
        x: overrides && overrides.hasOwnProperty('x') ? overrides.x! : 'id',
    };
};

export const aLiquidityManagement = (overrides?: Partial<LiquidityManagement>): LiquidityManagement => {
    return {
        disableUnbalancedLiquidity:
            overrides && overrides.hasOwnProperty('disableUnbalancedLiquidity')
                ? overrides.disableUnbalancedLiquidity!
                : true,
        enableAddLiquidityCustom:
            overrides && overrides.hasOwnProperty('enableAddLiquidityCustom')
                ? overrides.enableAddLiquidityCustom!
                : false,
        enableDonation: overrides && overrides.hasOwnProperty('enableDonation') ? overrides.enableDonation! : false,
        enableRemoveLiquidityCustom:
            overrides && overrides.hasOwnProperty('enableRemoveLiquidityCustom')
                ? overrides.enableRemoveLiquidityCustom!
                : false,
    };
};

export const aMevTaxHookParams = (overrides?: Partial<MevTaxHookParams>): MevTaxHookParams => {
    return {
        maxMevSwapFeePercentage:
            overrides && overrides.hasOwnProperty('maxMevSwapFeePercentage')
                ? overrides.maxMevSwapFeePercentage!
                : 'ancilla',
        mevTaxMultiplier:
            overrides && overrides.hasOwnProperty('mevTaxMultiplier') ? overrides.mevTaxMultiplier! : 'adhuc',
        mevTaxThreshold:
            overrides && overrides.hasOwnProperty('mevTaxThreshold') ? overrides.mevTaxThreshold! : 'crapula',
    };
};

export const aMutation = (overrides?: Partial<Mutation>): Mutation => {
    return {
        beetsPoolLoadReliquarySnapshotsForAllFarms:
            overrides && overrides.hasOwnProperty('beetsPoolLoadReliquarySnapshotsForAllFarms')
                ? overrides.beetsPoolLoadReliquarySnapshotsForAllFarms!
                : 'culpo',
        createLBP: overrides && overrides.hasOwnProperty('createLBP') ? overrides.createLBP! : true,
        poolLoadOnChainDataForAllPools:
            overrides && overrides.hasOwnProperty('poolLoadOnChainDataForAllPools')
                ? overrides.poolLoadOnChainDataForAllPools!
                : [aGqlPoolMutationResult()],
        poolLoadSnapshotsForPools:
            overrides && overrides.hasOwnProperty('poolLoadSnapshotsForPools')
                ? overrides.poolLoadSnapshotsForPools!
                : 'quidem',
        poolReloadAllPoolAprs:
            overrides && overrides.hasOwnProperty('poolReloadAllPoolAprs')
                ? overrides.poolReloadAllPoolAprs!
                : 'ducimus',
        poolReloadPools:
            overrides && overrides.hasOwnProperty('poolReloadPools')
                ? overrides.poolReloadPools!
                : [aGqlPoolMutationResult()],
        poolReloadStakingForAllPools:
            overrides && overrides.hasOwnProperty('poolReloadStakingForAllPools')
                ? overrides.poolReloadStakingForAllPools!
                : 'anser',
        poolReloadSwaps:
            overrides && overrides.hasOwnProperty('poolReloadSwaps') ? overrides.poolReloadSwaps! : 'cubitum',
        poolSyncAllPoolsFromSubgraph:
            overrides && overrides.hasOwnProperty('poolSyncAllPoolsFromSubgraph')
                ? overrides.poolSyncAllPoolsFromSubgraph!
                : ['quos'],
        poolSyncFxQuoteTokens:
            overrides && overrides.hasOwnProperty('poolSyncFxQuoteTokens')
                ? overrides.poolSyncFxQuoteTokens!
                : [aGqlPoolMutationResult()],
        poolUpdateLiquidityValuesForAllPools:
            overrides && overrides.hasOwnProperty('poolUpdateLiquidityValuesForAllPools')
                ? overrides.poolUpdateLiquidityValuesForAllPools!
                : 'terreo',
        protocolCacheMetrics:
            overrides && overrides.hasOwnProperty('protocolCacheMetrics') ? overrides.protocolCacheMetrics! : 'creator',
        sftmxSyncStakingData:
            overrides && overrides.hasOwnProperty('sftmxSyncStakingData') ? overrides.sftmxSyncStakingData! : 'vesco',
        sftmxSyncWithdrawalRequests:
            overrides && overrides.hasOwnProperty('sftmxSyncWithdrawalRequests')
                ? overrides.sftmxSyncWithdrawalRequests!
                : 'desidero',
        tokenDeleteTokenType:
            overrides && overrides.hasOwnProperty('tokenDeleteTokenType')
                ? overrides.tokenDeleteTokenType!
                : 'summisse',
        tokenReloadAllTokenTypes:
            overrides && overrides.hasOwnProperty('tokenReloadAllTokenTypes')
                ? overrides.tokenReloadAllTokenTypes!
                : 'placeat',
        tokenReloadErc4626Tokens:
            overrides && overrides.hasOwnProperty('tokenReloadErc4626Tokens')
                ? overrides.tokenReloadErc4626Tokens!
                : [aGqlTokenMutationResult()],
        tokenReloadTokenPrices:
            overrides && overrides.hasOwnProperty('tokenReloadTokenPrices') ? overrides.tokenReloadTokenPrices! : false,
        tokenSyncLatestFxPrices:
            overrides && overrides.hasOwnProperty('tokenSyncLatestFxPrices')
                ? overrides.tokenSyncLatestFxPrices!
                : 'sophismata',
        tokenSyncTokenDefinitions:
            overrides && overrides.hasOwnProperty('tokenSyncTokenDefinitions')
                ? overrides.tokenSyncTokenDefinitions!
                : 'cultellus',
        userInitStakedBalances:
            overrides && overrides.hasOwnProperty('userInitStakedBalances')
                ? overrides.userInitStakedBalances!
                : 'contigo',
        userInitWalletBalancesForAllPools:
            overrides && overrides.hasOwnProperty('userInitWalletBalancesForAllPools')
                ? overrides.userInitWalletBalancesForAllPools!
                : 'absens',
        userSyncChangedStakedBalances:
            overrides && overrides.hasOwnProperty('userSyncChangedStakedBalances')
                ? overrides.userSyncChangedStakedBalances!
                : 'porro',
        userSyncChangedWalletBalancesForAllPools:
            overrides && overrides.hasOwnProperty('userSyncChangedWalletBalancesForAllPools')
                ? overrides.userSyncChangedWalletBalancesForAllPools!
                : 'apud',
        veBalSyncAllUserBalances:
            overrides && overrides.hasOwnProperty('veBalSyncAllUserBalances')
                ? overrides.veBalSyncAllUserBalances!
                : 'vestrum',
        veBalSyncTotalSupply:
            overrides && overrides.hasOwnProperty('veBalSyncTotalSupply')
                ? overrides.veBalSyncTotalSupply!
                : 'vehemens',
    };
};

export const aQuantAmmWeightedDetail = (overrides?: Partial<QuantAmmWeightedDetail>): QuantAmmWeightedDetail => {
    return {
        category: overrides && overrides.hasOwnProperty('category') ? overrides.category! : 'perferendis',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'brevis',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : 'angustus',
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'ventito',
    };
};

export const aQuantAmmWeightSnapshot = (overrides?: Partial<QuantAmmWeightSnapshot>): QuantAmmWeightSnapshot => {
    return {
        timestamp: overrides && overrides.hasOwnProperty('timestamp') ? overrides.timestamp! : 8852,
        weights: overrides && overrides.hasOwnProperty('weights') ? overrides.weights! : [9.6],
    };
};

export const aQuantAmmWeightedParams = (overrides?: Partial<QuantAmmWeightedParams>): QuantAmmWeightedParams => {
    return {
        absoluteWeightGuardRail:
            overrides && overrides.hasOwnProperty('absoluteWeightGuardRail')
                ? overrides.absoluteWeightGuardRail!
                : 'supellex',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : [aQuantAmmWeightedDetail()],
        epsilonMax: overrides && overrides.hasOwnProperty('epsilonMax') ? overrides.epsilonMax! : 'deludo',
        lambda: overrides && overrides.hasOwnProperty('lambda') ? overrides.lambda! : ['comminor'],
        lastInterpolationTimePossible:
            overrides && overrides.hasOwnProperty('lastInterpolationTimePossible')
                ? overrides.lastInterpolationTimePossible!
                : 'appono',
        lastUpdateIntervalTime:
            overrides && overrides.hasOwnProperty('lastUpdateIntervalTime')
                ? overrides.lastUpdateIntervalTime!
                : 'vesica',
        maxTradeSizeRatio:
            overrides && overrides.hasOwnProperty('maxTradeSizeRatio') ? overrides.maxTradeSizeRatio! : 'basium',
        oracleStalenessThreshold:
            overrides && overrides.hasOwnProperty('oracleStalenessThreshold')
                ? overrides.oracleStalenessThreshold!
                : 'odit',
        poolRegistry: overrides && overrides.hasOwnProperty('poolRegistry') ? overrides.poolRegistry! : 'venustas',
        updateInterval: overrides && overrides.hasOwnProperty('updateInterval') ? overrides.updateInterval! : 'bis',
        weightBlockMultipliers:
            overrides && overrides.hasOwnProperty('weightBlockMultipliers')
                ? overrides.weightBlockMultipliers!
                : ['suscipit'],
        weightsAtLastUpdateInterval:
            overrides && overrides.hasOwnProperty('weightsAtLastUpdateInterval')
                ? overrides.weightsAtLastUpdateInterval!
                : ['aegrus'],
    };
};

export const aQuery = (overrides?: Partial<Query>): Query => {
    return {
        aggregatorPools:
            overrides && overrides.hasOwnProperty('aggregatorPools')
                ? overrides.aggregatorPools!
                : [aGqlPoolAggregator()],
        beetsGetFbeetsRatio:
            overrides && overrides.hasOwnProperty('beetsGetFbeetsRatio') ? overrides.beetsGetFbeetsRatio! : 'advoco',
        beetsPoolGetReliquaryFarmSnapshots:
            overrides && overrides.hasOwnProperty('beetsPoolGetReliquaryFarmSnapshots')
                ? overrides.beetsPoolGetReliquaryFarmSnapshots!
                : [aGqlReliquaryFarmSnapshot()],
        blocksGetAverageBlockTime:
            overrides && overrides.hasOwnProperty('blocksGetAverageBlockTime')
                ? overrides.blocksGetAverageBlockTime!
                : 8,
        blocksGetBlocksPerDay:
            overrides && overrides.hasOwnProperty('blocksGetBlocksPerDay') ? overrides.blocksGetBlocksPerDay! : 3.7,
        blocksGetBlocksPerSecond:
            overrides && overrides.hasOwnProperty('blocksGetBlocksPerSecond')
                ? overrides.blocksGetBlocksPerSecond!
                : 5.9,
        blocksGetBlocksPerYear:
            overrides && overrides.hasOwnProperty('blocksGetBlocksPerYear') ? overrides.blocksGetBlocksPerYear! : 7.4,
        lbpPriceChart:
            overrides && overrides.hasOwnProperty('lbpPriceChart') ? overrides.lbpPriceChart! : [aLbpPriceChartData()],
        loopsGetData: overrides && overrides.hasOwnProperty('loopsGetData') ? overrides.loopsGetData! : aGqlLoopsData(),
        poolEvents: overrides && overrides.hasOwnProperty('poolEvents') ? overrides.poolEvents! : [aGqlPoolEvent()],
        poolGetAggregatorPools:
            overrides && overrides.hasOwnProperty('poolGetAggregatorPools')
                ? overrides.poolGetAggregatorPools!
                : [aGqlPoolAggregator()],
        poolGetFeaturedPools:
            overrides && overrides.hasOwnProperty('poolGetFeaturedPools')
                ? overrides.poolGetFeaturedPools!
                : [aGqlPoolFeaturedPool()],
        poolGetPool: overrides && overrides.hasOwnProperty('poolGetPool') ? overrides.poolGetPool! : aGqlPoolBase(),
        poolGetPools:
            overrides && overrides.hasOwnProperty('poolGetPools') ? overrides.poolGetPools! : [aGqlPoolMinimal()],
        poolGetPoolsCount:
            overrides && overrides.hasOwnProperty('poolGetPoolsCount') ? overrides.poolGetPoolsCount! : 5502,
        poolGetSnapshots:
            overrides && overrides.hasOwnProperty('poolGetSnapshots')
                ? overrides.poolGetSnapshots!
                : [aGqlPoolSnapshot()],
        protocolMetricsAggregated:
            overrides && overrides.hasOwnProperty('protocolMetricsAggregated')
                ? overrides.protocolMetricsAggregated!
                : aGqlProtocolMetricsAggregated(),
        protocolMetricsChain:
            overrides && overrides.hasOwnProperty('protocolMetricsChain')
                ? overrides.protocolMetricsChain!
                : aGqlProtocolMetricsChain(),
        sftmxGetStakingData:
            overrides && overrides.hasOwnProperty('sftmxGetStakingData')
                ? overrides.sftmxGetStakingData!
                : aGqlSftmxStakingData(),
        sftmxGetStakingSnapshots:
            overrides && overrides.hasOwnProperty('sftmxGetStakingSnapshots')
                ? overrides.sftmxGetStakingSnapshots!
                : [aGqlSftmxStakingSnapshot()],
        sftmxGetWithdrawalRequests:
            overrides && overrides.hasOwnProperty('sftmxGetWithdrawalRequests')
                ? overrides.sftmxGetWithdrawalRequests!
                : [aGqlSftmxWithdrawalRequests()],
        sorGetSwapPaths:
            overrides && overrides.hasOwnProperty('sorGetSwapPaths')
                ? overrides.sorGetSwapPaths!
                : aGqlSorGetSwapPaths(),
        stsGetGqlStakedSonicData:
            overrides && overrides.hasOwnProperty('stsGetGqlStakedSonicData')
                ? overrides.stsGetGqlStakedSonicData!
                : aGqlStakedSonicData(),
        stsGetStakedSonicSnapshots:
            overrides && overrides.hasOwnProperty('stsGetStakedSonicSnapshots')
                ? overrides.stsGetStakedSonicSnapshots!
                : [aGqlStakedSonicSnapshot()],
        tokenGetCandlestickChartData:
            overrides && overrides.hasOwnProperty('tokenGetCandlestickChartData')
                ? overrides.tokenGetCandlestickChartData!
                : [aGqlTokenCandlestickChartDataItem()],
        tokenGetCurrentPrices:
            overrides && overrides.hasOwnProperty('tokenGetCurrentPrices')
                ? overrides.tokenGetCurrentPrices!
                : [aGqlTokenPrice()],
        tokenGetHistoricalPrices:
            overrides && overrides.hasOwnProperty('tokenGetHistoricalPrices')
                ? overrides.tokenGetHistoricalPrices!
                : [aGqlHistoricalTokenPrice()],
        tokenGetPriceChartData:
            overrides && overrides.hasOwnProperty('tokenGetPriceChartData')
                ? overrides.tokenGetPriceChartData!
                : [aGqlTokenPriceChartDataItem()],
        tokenGetProtocolTokenPrice:
            overrides && overrides.hasOwnProperty('tokenGetProtocolTokenPrice')
                ? overrides.tokenGetProtocolTokenPrice!
                : 'arbustum',
        tokenGetRelativePriceChartData:
            overrides && overrides.hasOwnProperty('tokenGetRelativePriceChartData')
                ? overrides.tokenGetRelativePriceChartData!
                : [aGqlTokenPriceChartDataItem()],
        tokenGetTokenData:
            overrides && overrides.hasOwnProperty('tokenGetTokenData') ? overrides.tokenGetTokenData! : aGqlTokenData(),
        tokenGetTokenDynamicData:
            overrides && overrides.hasOwnProperty('tokenGetTokenDynamicData')
                ? overrides.tokenGetTokenDynamicData!
                : aGqlTokenDynamicData(),
        tokenGetTokens:
            overrides && overrides.hasOwnProperty('tokenGetTokens') ? overrides.tokenGetTokens! : [aGqlToken()],
        tokenGetTokensData:
            overrides && overrides.hasOwnProperty('tokenGetTokensData')
                ? overrides.tokenGetTokensData!
                : [aGqlTokenData()],
        tokenGetTokensDynamicData:
            overrides && overrides.hasOwnProperty('tokenGetTokensDynamicData')
                ? overrides.tokenGetTokensDynamicData!
                : [aGqlTokenDynamicData()],
        userGetFbeetsBalance:
            overrides && overrides.hasOwnProperty('userGetFbeetsBalance')
                ? overrides.userGetFbeetsBalance!
                : aGqlUserFbeetsBalance(),
        userGetPoolBalances:
            overrides && overrides.hasOwnProperty('userGetPoolBalances')
                ? overrides.userGetPoolBalances!
                : [aGqlUserPoolBalance()],
        userGetPoolJoinExits:
            overrides && overrides.hasOwnProperty('userGetPoolJoinExits')
                ? overrides.userGetPoolJoinExits!
                : [aGqlPoolJoinExit()],
        userGetStaking:
            overrides && overrides.hasOwnProperty('userGetStaking') ? overrides.userGetStaking! : [aGqlPoolStaking()],
        userGetSwaps:
            overrides && overrides.hasOwnProperty('userGetSwaps') ? overrides.userGetSwaps! : [aGqlPoolSwap()],
        veBalGetTotalSupply:
            overrides && overrides.hasOwnProperty('veBalGetTotalSupply') ? overrides.veBalGetTotalSupply! : 'quis',
        veBalGetUser:
            overrides && overrides.hasOwnProperty('veBalGetUser') ? overrides.veBalGetUser! : aGqlVeBalUserData(),
        veBalGetUserBalance:
            overrides && overrides.hasOwnProperty('veBalGetUserBalance')
                ? overrides.veBalGetUserBalance!
                : 'administratio',
        veBalGetUserBalances:
            overrides && overrides.hasOwnProperty('veBalGetUserBalances')
                ? overrides.veBalGetUserBalances!
                : [aGqlVeBalBalance()],
        veBalGetVotingList:
            overrides && overrides.hasOwnProperty('veBalGetVotingList')
                ? overrides.veBalGetVotingList!
                : [aGqlVotingPool()],
    };
};

export const aStableSurgeHookParams = (overrides?: Partial<StableSurgeHookParams>): StableSurgeHookParams => {
    return {
        maxSurgeFeePercentage:
            overrides && overrides.hasOwnProperty('maxSurgeFeePercentage')
                ? overrides.maxSurgeFeePercentage!
                : 'demonstro',
        surgeThresholdPercentage:
            overrides && overrides.hasOwnProperty('surgeThresholdPercentage')
                ? overrides.surgeThresholdPercentage!
                : 'pectus',
    };
};

export const aToken = (overrides?: Partial<Token>): Token => {
    return {
        address: overrides && overrides.hasOwnProperty('address') ? overrides.address! : 'super',
        decimals: overrides && overrides.hasOwnProperty('decimals') ? overrides.decimals! : 2903,
    };
};
