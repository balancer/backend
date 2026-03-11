import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    BigDecimal: string;
    BigInt: string;
    Bytes: string;
    Int8: any;
    Timestamp: any;
};

export enum Aggregation_Interval {
    Day = 'day',
    Hour = 'hour',
}

export type AmpUpdate = {
    __typename?: 'AmpUpdate';
    endAmp: Scalars['BigInt'];
    endTimestamp: Scalars['BigInt'];
    id: Scalars['ID'];
    poolId: Pool;
    scheduledTimestamp: Scalars['Int'];
    startAmp: Scalars['BigInt'];
    startTimestamp: Scalars['BigInt'];
};

export type AmpUpdate_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<AmpUpdate_Filter>>>;
    endAmp?: InputMaybe<Scalars['BigInt']>;
    endAmp_gt?: InputMaybe<Scalars['BigInt']>;
    endAmp_gte?: InputMaybe<Scalars['BigInt']>;
    endAmp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    endAmp_lt?: InputMaybe<Scalars['BigInt']>;
    endAmp_lte?: InputMaybe<Scalars['BigInt']>;
    endAmp_not?: InputMaybe<Scalars['BigInt']>;
    endAmp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    endTimestamp?: InputMaybe<Scalars['BigInt']>;
    endTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
    endTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
    endTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    endTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
    endTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
    endTimestamp_not?: InputMaybe<Scalars['BigInt']>;
    endTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<AmpUpdate_Filter>>>;
    poolId?: InputMaybe<Scalars['String']>;
    poolId_?: InputMaybe<Pool_Filter>;
    poolId_contains?: InputMaybe<Scalars['String']>;
    poolId_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_ends_with?: InputMaybe<Scalars['String']>;
    poolId_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_gt?: InputMaybe<Scalars['String']>;
    poolId_gte?: InputMaybe<Scalars['String']>;
    poolId_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_lt?: InputMaybe<Scalars['String']>;
    poolId_lte?: InputMaybe<Scalars['String']>;
    poolId_not?: InputMaybe<Scalars['String']>;
    poolId_not_contains?: InputMaybe<Scalars['String']>;
    poolId_not_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: InputMaybe<Scalars['String']>;
    poolId_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_starts_with?: InputMaybe<Scalars['String']>;
    poolId_starts_with_nocase?: InputMaybe<Scalars['String']>;
    scheduledTimestamp?: InputMaybe<Scalars['Int']>;
    scheduledTimestamp_gt?: InputMaybe<Scalars['Int']>;
    scheduledTimestamp_gte?: InputMaybe<Scalars['Int']>;
    scheduledTimestamp_in?: InputMaybe<Array<Scalars['Int']>>;
    scheduledTimestamp_lt?: InputMaybe<Scalars['Int']>;
    scheduledTimestamp_lte?: InputMaybe<Scalars['Int']>;
    scheduledTimestamp_not?: InputMaybe<Scalars['Int']>;
    scheduledTimestamp_not_in?: InputMaybe<Array<Scalars['Int']>>;
    startAmp?: InputMaybe<Scalars['BigInt']>;
    startAmp_gt?: InputMaybe<Scalars['BigInt']>;
    startAmp_gte?: InputMaybe<Scalars['BigInt']>;
    startAmp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    startAmp_lt?: InputMaybe<Scalars['BigInt']>;
    startAmp_lte?: InputMaybe<Scalars['BigInt']>;
    startAmp_not?: InputMaybe<Scalars['BigInt']>;
    startAmp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    startTimestamp?: InputMaybe<Scalars['BigInt']>;
    startTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
    startTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
    startTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    startTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
    startTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
    startTimestamp_not?: InputMaybe<Scalars['BigInt']>;
    startTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum AmpUpdate_OrderBy {
    EndAmp = 'endAmp',
    EndTimestamp = 'endTimestamp',
    Id = 'id',
    PoolId = 'poolId',
    PoolIdAddress = 'poolId__address',
    PoolIdAlpha = 'poolId__alpha',
    PoolIdAmp = 'poolId__amp',
    PoolIdBaseToken = 'poolId__baseToken',
    PoolIdBeta = 'poolId__beta',
    PoolIdC = 'poolId__c',
    PoolIdCreateTime = 'poolId__createTime',
    PoolIdDSq = 'poolId__dSq',
    PoolIdDelta = 'poolId__delta',
    PoolIdEpsilon = 'poolId__epsilon',
    PoolIdExpiryTime = 'poolId__expiryTime',
    PoolIdFactory = 'poolId__factory',
    PoolIdHoldersCount = 'poolId__holdersCount',
    PoolIdId = 'poolId__id',
    PoolIdIsInRecoveryMode = 'poolId__isInRecoveryMode',
    PoolIdIsPaused = 'poolId__isPaused',
    PoolIdJoinExitEnabled = 'poolId__joinExitEnabled',
    PoolIdLambda = 'poolId__lambda',
    PoolIdLastJoinExitAmp = 'poolId__lastJoinExitAmp',
    PoolIdLastPostJoinExitInvariant = 'poolId__lastPostJoinExitInvariant',
    PoolIdLowerTarget = 'poolId__lowerTarget',
    PoolIdMainIndex = 'poolId__mainIndex',
    PoolIdManagementAumFee = 'poolId__managementAumFee',
    PoolIdManagementFee = 'poolId__managementFee',
    PoolIdMustAllowlistLPs = 'poolId__mustAllowlistLPs',
    PoolIdName = 'poolId__name',
    PoolIdOracleEnabled = 'poolId__oracleEnabled',
    PoolIdOwner = 'poolId__owner',
    PoolIdPoolType = 'poolId__poolType',
    PoolIdPoolTypeVersion = 'poolId__poolTypeVersion',
    PoolIdPrincipalToken = 'poolId__principalToken',
    PoolIdProtocolAumFeeCache = 'poolId__protocolAumFeeCache',
    PoolIdProtocolId = 'poolId__protocolId',
    PoolIdProtocolSwapFeeCache = 'poolId__protocolSwapFeeCache',
    PoolIdProtocolYieldFeeCache = 'poolId__protocolYieldFeeCache',
    PoolIdRoot3Alpha = 'poolId__root3Alpha',
    PoolIdS = 'poolId__s',
    PoolIdSqrtAlpha = 'poolId__sqrtAlpha',
    PoolIdSqrtBeta = 'poolId__sqrtBeta',
    PoolIdStrategyType = 'poolId__strategyType',
    PoolIdSwapEnabled = 'poolId__swapEnabled',
    PoolIdSwapEnabledCurationSignal = 'poolId__swapEnabledCurationSignal',
    PoolIdSwapEnabledInternal = 'poolId__swapEnabledInternal',
    PoolIdSwapFee = 'poolId__swapFee',
    PoolIdSwapsCount = 'poolId__swapsCount',
    PoolIdSymbol = 'poolId__symbol',
    PoolIdTauAlphaX = 'poolId__tauAlphaX',
    PoolIdTauAlphaY = 'poolId__tauAlphaY',
    PoolIdTauBetaX = 'poolId__tauBetaX',
    PoolIdTauBetaY = 'poolId__tauBetaY',
    PoolIdTotalAumFeeCollectedInBpt = 'poolId__totalAumFeeCollectedInBPT',
    PoolIdTotalProtocolFeePaidInBpt = 'poolId__totalProtocolFeePaidInBPT',
    PoolIdTotalShares = 'poolId__totalShares',
    PoolIdTotalWeight = 'poolId__totalWeight',
    PoolIdTx = 'poolId__tx',
    PoolIdU = 'poolId__u',
    PoolIdUnitSeconds = 'poolId__unitSeconds',
    PoolIdUpperTarget = 'poolId__upperTarget',
    PoolIdV = 'poolId__v',
    PoolIdW = 'poolId__w',
    PoolIdWrappedIndex = 'poolId__wrappedIndex',
    PoolIdZ = 'poolId__z',
    ScheduledTimestamp = 'scheduledTimestamp',
    StartAmp = 'startAmp',
    StartTimestamp = 'startTimestamp',
}

export type Balancer = {
    __typename?: 'Balancer';
    id: Scalars['ID'];
    poolCount: Scalars['Int'];
    pools?: Maybe<Array<Pool>>;
    protocolFeesCollector?: Maybe<Scalars['Bytes']>;
};

export type BalancerPoolsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<Pool_Filter>;
};

export type Balancer_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<Balancer_Filter>>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<Balancer_Filter>>>;
    poolCount?: InputMaybe<Scalars['Int']>;
    poolCount_gt?: InputMaybe<Scalars['Int']>;
    poolCount_gte?: InputMaybe<Scalars['Int']>;
    poolCount_in?: InputMaybe<Array<Scalars['Int']>>;
    poolCount_lt?: InputMaybe<Scalars['Int']>;
    poolCount_lte?: InputMaybe<Scalars['Int']>;
    poolCount_not?: InputMaybe<Scalars['Int']>;
    poolCount_not_in?: InputMaybe<Array<Scalars['Int']>>;
    pools_?: InputMaybe<Pool_Filter>;
    protocolFeesCollector?: InputMaybe<Scalars['Bytes']>;
    protocolFeesCollector_contains?: InputMaybe<Scalars['Bytes']>;
    protocolFeesCollector_gt?: InputMaybe<Scalars['Bytes']>;
    protocolFeesCollector_gte?: InputMaybe<Scalars['Bytes']>;
    protocolFeesCollector_in?: InputMaybe<Array<Scalars['Bytes']>>;
    protocolFeesCollector_lt?: InputMaybe<Scalars['Bytes']>;
    protocolFeesCollector_lte?: InputMaybe<Scalars['Bytes']>;
    protocolFeesCollector_not?: InputMaybe<Scalars['Bytes']>;
    protocolFeesCollector_not_contains?: InputMaybe<Scalars['Bytes']>;
    protocolFeesCollector_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum Balancer_OrderBy {
    Id = 'id',
    PoolCount = 'poolCount',
    Pools = 'pools',
    ProtocolFeesCollector = 'protocolFeesCollector',
}

export type BlockChangedFilter = {
    number_gte: Scalars['Int'];
};

export type Block_Height = {
    hash?: InputMaybe<Scalars['Bytes']>;
    number?: InputMaybe<Scalars['Int']>;
    number_gte?: InputMaybe<Scalars['Int']>;
};

export type FxOracle = {
    __typename?: 'FXOracle';
    decimals?: Maybe<Scalars['Int']>;
    divisor?: Maybe<Scalars['String']>;
    id: Scalars['ID'];
    tokens: Array<Scalars['Bytes']>;
};

export type FxOracle_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<FxOracle_Filter>>>;
    decimals?: InputMaybe<Scalars['Int']>;
    decimals_gt?: InputMaybe<Scalars['Int']>;
    decimals_gte?: InputMaybe<Scalars['Int']>;
    decimals_in?: InputMaybe<Array<Scalars['Int']>>;
    decimals_lt?: InputMaybe<Scalars['Int']>;
    decimals_lte?: InputMaybe<Scalars['Int']>;
    decimals_not?: InputMaybe<Scalars['Int']>;
    decimals_not_in?: InputMaybe<Array<Scalars['Int']>>;
    divisor?: InputMaybe<Scalars['String']>;
    divisor_contains?: InputMaybe<Scalars['String']>;
    divisor_contains_nocase?: InputMaybe<Scalars['String']>;
    divisor_ends_with?: InputMaybe<Scalars['String']>;
    divisor_ends_with_nocase?: InputMaybe<Scalars['String']>;
    divisor_gt?: InputMaybe<Scalars['String']>;
    divisor_gte?: InputMaybe<Scalars['String']>;
    divisor_in?: InputMaybe<Array<Scalars['String']>>;
    divisor_lt?: InputMaybe<Scalars['String']>;
    divisor_lte?: InputMaybe<Scalars['String']>;
    divisor_not?: InputMaybe<Scalars['String']>;
    divisor_not_contains?: InputMaybe<Scalars['String']>;
    divisor_not_contains_nocase?: InputMaybe<Scalars['String']>;
    divisor_not_ends_with?: InputMaybe<Scalars['String']>;
    divisor_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    divisor_not_in?: InputMaybe<Array<Scalars['String']>>;
    divisor_not_starts_with?: InputMaybe<Scalars['String']>;
    divisor_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    divisor_starts_with?: InputMaybe<Scalars['String']>;
    divisor_starts_with_nocase?: InputMaybe<Scalars['String']>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<FxOracle_Filter>>>;
    tokens?: InputMaybe<Array<Scalars['Bytes']>>;
    tokens_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    tokens_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    tokens_not?: InputMaybe<Array<Scalars['Bytes']>>;
    tokens_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    tokens_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum FxOracle_OrderBy {
    Decimals = 'decimals',
    Divisor = 'divisor',
    Id = 'id',
    Tokens = 'tokens',
}

export enum InvestType {
    Exit = 'Exit',
    Join = 'Join',
}

export type JoinExit = {
    __typename?: 'JoinExit';
    amounts: Array<Scalars['BigDecimal']>;
    block?: Maybe<Scalars['BigInt']>;
    id: Scalars['ID'];
    pool: Pool;
    sender: Scalars['Bytes'];
    timestamp: Scalars['Int'];
    tx: Scalars['Bytes'];
    type: InvestType;
    user: Scalars['Bytes'];
};

export type JoinExit_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    amounts?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    and?: InputMaybe<Array<InputMaybe<JoinExit_Filter>>>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<JoinExit_Filter>>>;
    pool?: InputMaybe<Scalars['String']>;
    pool_?: InputMaybe<Pool_Filter>;
    pool_contains?: InputMaybe<Scalars['String']>;
    pool_contains_nocase?: InputMaybe<Scalars['String']>;
    pool_ends_with?: InputMaybe<Scalars['String']>;
    pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
    pool_gt?: InputMaybe<Scalars['String']>;
    pool_gte?: InputMaybe<Scalars['String']>;
    pool_in?: InputMaybe<Array<Scalars['String']>>;
    pool_lt?: InputMaybe<Scalars['String']>;
    pool_lte?: InputMaybe<Scalars['String']>;
    pool_not?: InputMaybe<Scalars['String']>;
    pool_not_contains?: InputMaybe<Scalars['String']>;
    pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
    pool_not_ends_with?: InputMaybe<Scalars['String']>;
    pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    pool_not_in?: InputMaybe<Array<Scalars['String']>>;
    pool_not_starts_with?: InputMaybe<Scalars['String']>;
    pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    pool_starts_with?: InputMaybe<Scalars['String']>;
    pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
    sender?: InputMaybe<Scalars['Bytes']>;
    sender_contains?: InputMaybe<Scalars['Bytes']>;
    sender_gt?: InputMaybe<Scalars['Bytes']>;
    sender_gte?: InputMaybe<Scalars['Bytes']>;
    sender_in?: InputMaybe<Array<Scalars['Bytes']>>;
    sender_lt?: InputMaybe<Scalars['Bytes']>;
    sender_lte?: InputMaybe<Scalars['Bytes']>;
    sender_not?: InputMaybe<Scalars['Bytes']>;
    sender_not_contains?: InputMaybe<Scalars['Bytes']>;
    sender_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    timestamp?: InputMaybe<Scalars['Int']>;
    timestamp_gt?: InputMaybe<Scalars['Int']>;
    timestamp_gte?: InputMaybe<Scalars['Int']>;
    timestamp_in?: InputMaybe<Array<Scalars['Int']>>;
    timestamp_lt?: InputMaybe<Scalars['Int']>;
    timestamp_lte?: InputMaybe<Scalars['Int']>;
    timestamp_not?: InputMaybe<Scalars['Int']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['Int']>>;
    tx?: InputMaybe<Scalars['Bytes']>;
    tx_contains?: InputMaybe<Scalars['Bytes']>;
    tx_gt?: InputMaybe<Scalars['Bytes']>;
    tx_gte?: InputMaybe<Scalars['Bytes']>;
    tx_in?: InputMaybe<Array<Scalars['Bytes']>>;
    tx_lt?: InputMaybe<Scalars['Bytes']>;
    tx_lte?: InputMaybe<Scalars['Bytes']>;
    tx_not?: InputMaybe<Scalars['Bytes']>;
    tx_not_contains?: InputMaybe<Scalars['Bytes']>;
    tx_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    type?: InputMaybe<InvestType>;
    type_in?: InputMaybe<Array<InvestType>>;
    type_not?: InputMaybe<InvestType>;
    type_not_in?: InputMaybe<Array<InvestType>>;
    user?: InputMaybe<Scalars['Bytes']>;
    user_contains?: InputMaybe<Scalars['Bytes']>;
    user_gt?: InputMaybe<Scalars['Bytes']>;
    user_gte?: InputMaybe<Scalars['Bytes']>;
    user_in?: InputMaybe<Array<Scalars['Bytes']>>;
    user_lt?: InputMaybe<Scalars['Bytes']>;
    user_lte?: InputMaybe<Scalars['Bytes']>;
    user_not?: InputMaybe<Scalars['Bytes']>;
    user_not_contains?: InputMaybe<Scalars['Bytes']>;
    user_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum JoinExit_OrderBy {
    Amounts = 'amounts',
    Block = 'block',
    Id = 'id',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolAlpha = 'pool__alpha',
    PoolAmp = 'pool__amp',
    PoolBaseToken = 'pool__baseToken',
    PoolBeta = 'pool__beta',
    PoolC = 'pool__c',
    PoolCreateTime = 'pool__createTime',
    PoolDSq = 'pool__dSq',
    PoolDelta = 'pool__delta',
    PoolEpsilon = 'pool__epsilon',
    PoolExpiryTime = 'pool__expiryTime',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInRecoveryMode = 'pool__isInRecoveryMode',
    PoolIsPaused = 'pool__isPaused',
    PoolJoinExitEnabled = 'pool__joinExitEnabled',
    PoolLambda = 'pool__lambda',
    PoolLastJoinExitAmp = 'pool__lastJoinExitAmp',
    PoolLastPostJoinExitInvariant = 'pool__lastPostJoinExitInvariant',
    PoolLowerTarget = 'pool__lowerTarget',
    PoolMainIndex = 'pool__mainIndex',
    PoolManagementAumFee = 'pool__managementAumFee',
    PoolManagementFee = 'pool__managementFee',
    PoolMustAllowlistLPs = 'pool__mustAllowlistLPs',
    PoolName = 'pool__name',
    PoolOracleEnabled = 'pool__oracleEnabled',
    PoolOwner = 'pool__owner',
    PoolPoolType = 'pool__poolType',
    PoolPoolTypeVersion = 'pool__poolTypeVersion',
    PoolPrincipalToken = 'pool__principalToken',
    PoolProtocolAumFeeCache = 'pool__protocolAumFeeCache',
    PoolProtocolId = 'pool__protocolId',
    PoolProtocolSwapFeeCache = 'pool__protocolSwapFeeCache',
    PoolProtocolYieldFeeCache = 'pool__protocolYieldFeeCache',
    PoolRoot3Alpha = 'pool__root3Alpha',
    PoolS = 'pool__s',
    PoolSqrtAlpha = 'pool__sqrtAlpha',
    PoolSqrtBeta = 'pool__sqrtBeta',
    PoolStrategyType = 'pool__strategyType',
    PoolSwapEnabled = 'pool__swapEnabled',
    PoolSwapEnabledCurationSignal = 'pool__swapEnabledCurationSignal',
    PoolSwapEnabledInternal = 'pool__swapEnabledInternal',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTauAlphaX = 'pool__tauAlphaX',
    PoolTauAlphaY = 'pool__tauAlphaY',
    PoolTauBetaX = 'pool__tauBetaX',
    PoolTauBetaY = 'pool__tauBetaY',
    PoolTotalAumFeeCollectedInBpt = 'pool__totalAumFeeCollectedInBPT',
    PoolTotalProtocolFeePaidInBpt = 'pool__totalProtocolFeePaidInBPT',
    PoolTotalShares = 'pool__totalShares',
    PoolTotalWeight = 'pool__totalWeight',
    PoolTx = 'pool__tx',
    PoolU = 'pool__u',
    PoolUnitSeconds = 'pool__unitSeconds',
    PoolUpperTarget = 'pool__upperTarget',
    PoolV = 'pool__v',
    PoolW = 'pool__w',
    PoolWrappedIndex = 'pool__wrappedIndex',
    PoolZ = 'pool__z',
    Sender = 'sender',
    Timestamp = 'timestamp',
    Tx = 'tx',
    Type = 'type',
    User = 'user',
}

export enum OperationType {
    Deposit = 'Deposit',
    Update = 'Update',
    Withdraw = 'Withdraw',
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type Pool = {
    __typename?: 'Pool';
    address: Scalars['Bytes'];
    alpha?: Maybe<Scalars['BigDecimal']>;
    amp?: Maybe<Scalars['BigInt']>;
    ampUpdates?: Maybe<Array<AmpUpdate>>;
    baseToken?: Maybe<Scalars['Bytes']>;
    beta?: Maybe<Scalars['BigDecimal']>;
    c?: Maybe<Scalars['BigDecimal']>;
    createTime: Scalars['Int'];
    dSq?: Maybe<Scalars['BigDecimal']>;
    delta?: Maybe<Scalars['BigDecimal']>;
    epsilon?: Maybe<Scalars['BigDecimal']>;
    expiryTime?: Maybe<Scalars['BigInt']>;
    factory?: Maybe<Scalars['Bytes']>;
    holdersCount: Scalars['BigInt'];
    id: Scalars['ID'];
    isInRecoveryMode?: Maybe<Scalars['Boolean']>;
    isPaused?: Maybe<Scalars['Boolean']>;
    joinExitEnabled?: Maybe<Scalars['Boolean']>;
    joinsExits?: Maybe<Array<JoinExit>>;
    lambda?: Maybe<Scalars['BigDecimal']>;
    lastJoinExitAmp?: Maybe<Scalars['BigInt']>;
    lastPostJoinExitInvariant?: Maybe<Scalars['BigDecimal']>;
    latestAmpUpdate?: Maybe<AmpUpdate>;
    lowerTarget?: Maybe<Scalars['BigDecimal']>;
    mainIndex?: Maybe<Scalars['Int']>;
    managementAumFee?: Maybe<Scalars['BigDecimal']>;
    managementFee?: Maybe<Scalars['BigDecimal']>;
    mustAllowlistLPs?: Maybe<Scalars['Boolean']>;
    name?: Maybe<Scalars['String']>;
    oracleEnabled: Scalars['Boolean'];
    owner?: Maybe<Scalars['Bytes']>;
    poolType?: Maybe<Scalars['String']>;
    poolTypeVersion?: Maybe<Scalars['Int']>;
    priceRateProviders?: Maybe<Array<PriceRateProvider>>;
    principalToken?: Maybe<Scalars['Bytes']>;
    protocolAumFeeCache?: Maybe<Scalars['BigDecimal']>;
    protocolId?: Maybe<Scalars['Int']>;
    protocolIdData?: Maybe<ProtocolIdData>;
    protocolSwapFeeCache?: Maybe<Scalars['BigDecimal']>;
    protocolYieldFeeCache?: Maybe<Scalars['BigDecimal']>;
    root3Alpha?: Maybe<Scalars['BigDecimal']>;
    s?: Maybe<Scalars['BigDecimal']>;
    shares?: Maybe<Array<PoolShare>>;
    sqrtAlpha?: Maybe<Scalars['BigDecimal']>;
    sqrtBeta?: Maybe<Scalars['BigDecimal']>;
    strategyType: Scalars['Int'];
    /** Indicates if a pool can be swapped against. Combines multiple sources, including offchain curation */
    swapEnabled: Scalars['Boolean'];
    /** External indication from an offchain permissioned actor */
    swapEnabledCurationSignal?: Maybe<Scalars['Boolean']>;
    /** The native swapEnabled boolean. internal to the pool. Only applies to Gyro, LBPs and InvestmentPools */
    swapEnabledInternal?: Maybe<Scalars['Boolean']>;
    swapFee: Scalars['BigDecimal'];
    swaps?: Maybe<Array<Swap>>;
    swapsCount: Scalars['BigInt'];
    symbol?: Maybe<Scalars['String']>;
    tauAlphaX?: Maybe<Scalars['BigDecimal']>;
    tauAlphaY?: Maybe<Scalars['BigDecimal']>;
    tauBetaX?: Maybe<Scalars['BigDecimal']>;
    tauBetaY?: Maybe<Scalars['BigDecimal']>;
    tokens?: Maybe<Array<PoolToken>>;
    tokensList: Array<Scalars['Bytes']>;
    totalAumFeeCollectedInBPT?: Maybe<Scalars['BigDecimal']>;
    totalProtocolFeePaidInBPT?: Maybe<Scalars['BigDecimal']>;
    totalShares: Scalars['BigDecimal'];
    totalWeight?: Maybe<Scalars['BigDecimal']>;
    tx?: Maybe<Scalars['Bytes']>;
    u?: Maybe<Scalars['BigDecimal']>;
    unitSeconds?: Maybe<Scalars['BigInt']>;
    upperTarget?: Maybe<Scalars['BigDecimal']>;
    v?: Maybe<Scalars['BigDecimal']>;
    vaultID: Balancer;
    w?: Maybe<Scalars['BigDecimal']>;
    wrappedIndex?: Maybe<Scalars['Int']>;
    z?: Maybe<Scalars['BigDecimal']>;
};

export type PoolAmpUpdatesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<AmpUpdate_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<AmpUpdate_Filter>;
};

export type PoolJoinsExitsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<JoinExit_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<JoinExit_Filter>;
};

export type PoolPriceRateProvidersArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PriceRateProvider_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<PriceRateProvider_Filter>;
};

export type PoolSharesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<PoolShare_Filter>;
};

export type PoolSwapsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Swap_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<Swap_Filter>;
};

export type PoolTokensArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolToken_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<PoolToken_Filter>;
};

export type PoolContract = {
    __typename?: 'PoolContract';
    id: Scalars['ID'];
    pool: Pool;
};

export type PoolContract_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<PoolContract_Filter>>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<PoolContract_Filter>>>;
    pool?: InputMaybe<Scalars['String']>;
    pool_?: InputMaybe<Pool_Filter>;
    pool_contains?: InputMaybe<Scalars['String']>;
    pool_contains_nocase?: InputMaybe<Scalars['String']>;
    pool_ends_with?: InputMaybe<Scalars['String']>;
    pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
    pool_gt?: InputMaybe<Scalars['String']>;
    pool_gte?: InputMaybe<Scalars['String']>;
    pool_in?: InputMaybe<Array<Scalars['String']>>;
    pool_lt?: InputMaybe<Scalars['String']>;
    pool_lte?: InputMaybe<Scalars['String']>;
    pool_not?: InputMaybe<Scalars['String']>;
    pool_not_contains?: InputMaybe<Scalars['String']>;
    pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
    pool_not_ends_with?: InputMaybe<Scalars['String']>;
    pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    pool_not_in?: InputMaybe<Array<Scalars['String']>>;
    pool_not_starts_with?: InputMaybe<Scalars['String']>;
    pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    pool_starts_with?: InputMaybe<Scalars['String']>;
    pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum PoolContract_OrderBy {
    Id = 'id',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolAlpha = 'pool__alpha',
    PoolAmp = 'pool__amp',
    PoolBaseToken = 'pool__baseToken',
    PoolBeta = 'pool__beta',
    PoolC = 'pool__c',
    PoolCreateTime = 'pool__createTime',
    PoolDSq = 'pool__dSq',
    PoolDelta = 'pool__delta',
    PoolEpsilon = 'pool__epsilon',
    PoolExpiryTime = 'pool__expiryTime',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInRecoveryMode = 'pool__isInRecoveryMode',
    PoolIsPaused = 'pool__isPaused',
    PoolJoinExitEnabled = 'pool__joinExitEnabled',
    PoolLambda = 'pool__lambda',
    PoolLastJoinExitAmp = 'pool__lastJoinExitAmp',
    PoolLastPostJoinExitInvariant = 'pool__lastPostJoinExitInvariant',
    PoolLowerTarget = 'pool__lowerTarget',
    PoolMainIndex = 'pool__mainIndex',
    PoolManagementAumFee = 'pool__managementAumFee',
    PoolManagementFee = 'pool__managementFee',
    PoolMustAllowlistLPs = 'pool__mustAllowlistLPs',
    PoolName = 'pool__name',
    PoolOracleEnabled = 'pool__oracleEnabled',
    PoolOwner = 'pool__owner',
    PoolPoolType = 'pool__poolType',
    PoolPoolTypeVersion = 'pool__poolTypeVersion',
    PoolPrincipalToken = 'pool__principalToken',
    PoolProtocolAumFeeCache = 'pool__protocolAumFeeCache',
    PoolProtocolId = 'pool__protocolId',
    PoolProtocolSwapFeeCache = 'pool__protocolSwapFeeCache',
    PoolProtocolYieldFeeCache = 'pool__protocolYieldFeeCache',
    PoolRoot3Alpha = 'pool__root3Alpha',
    PoolS = 'pool__s',
    PoolSqrtAlpha = 'pool__sqrtAlpha',
    PoolSqrtBeta = 'pool__sqrtBeta',
    PoolStrategyType = 'pool__strategyType',
    PoolSwapEnabled = 'pool__swapEnabled',
    PoolSwapEnabledCurationSignal = 'pool__swapEnabledCurationSignal',
    PoolSwapEnabledInternal = 'pool__swapEnabledInternal',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTauAlphaX = 'pool__tauAlphaX',
    PoolTauAlphaY = 'pool__tauAlphaY',
    PoolTauBetaX = 'pool__tauBetaX',
    PoolTauBetaY = 'pool__tauBetaY',
    PoolTotalAumFeeCollectedInBpt = 'pool__totalAumFeeCollectedInBPT',
    PoolTotalProtocolFeePaidInBpt = 'pool__totalProtocolFeePaidInBPT',
    PoolTotalShares = 'pool__totalShares',
    PoolTotalWeight = 'pool__totalWeight',
    PoolTx = 'pool__tx',
    PoolU = 'pool__u',
    PoolUnitSeconds = 'pool__unitSeconds',
    PoolUpperTarget = 'pool__upperTarget',
    PoolV = 'pool__v',
    PoolW = 'pool__w',
    PoolWrappedIndex = 'pool__wrappedIndex',
    PoolZ = 'pool__z',
}

export type PoolShare = {
    __typename?: 'PoolShare';
    balance: Scalars['BigDecimal'];
    id: Scalars['ID'];
    poolId: Pool;
    userAddress: Scalars['Bytes'];
};

export type PoolShare_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<PoolShare_Filter>>>;
    balance?: InputMaybe<Scalars['BigDecimal']>;
    balance_gt?: InputMaybe<Scalars['BigDecimal']>;
    balance_gte?: InputMaybe<Scalars['BigDecimal']>;
    balance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: InputMaybe<Scalars['BigDecimal']>;
    balance_lte?: InputMaybe<Scalars['BigDecimal']>;
    balance_not?: InputMaybe<Scalars['BigDecimal']>;
    balance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<PoolShare_Filter>>>;
    poolId?: InputMaybe<Scalars['String']>;
    poolId_?: InputMaybe<Pool_Filter>;
    poolId_contains?: InputMaybe<Scalars['String']>;
    poolId_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_ends_with?: InputMaybe<Scalars['String']>;
    poolId_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_gt?: InputMaybe<Scalars['String']>;
    poolId_gte?: InputMaybe<Scalars['String']>;
    poolId_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_lt?: InputMaybe<Scalars['String']>;
    poolId_lte?: InputMaybe<Scalars['String']>;
    poolId_not?: InputMaybe<Scalars['String']>;
    poolId_not_contains?: InputMaybe<Scalars['String']>;
    poolId_not_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: InputMaybe<Scalars['String']>;
    poolId_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_starts_with?: InputMaybe<Scalars['String']>;
    poolId_starts_with_nocase?: InputMaybe<Scalars['String']>;
    userAddress?: InputMaybe<Scalars['Bytes']>;
    userAddress_contains?: InputMaybe<Scalars['Bytes']>;
    userAddress_gt?: InputMaybe<Scalars['Bytes']>;
    userAddress_gte?: InputMaybe<Scalars['Bytes']>;
    userAddress_in?: InputMaybe<Array<Scalars['Bytes']>>;
    userAddress_lt?: InputMaybe<Scalars['Bytes']>;
    userAddress_lte?: InputMaybe<Scalars['Bytes']>;
    userAddress_not?: InputMaybe<Scalars['Bytes']>;
    userAddress_not_contains?: InputMaybe<Scalars['Bytes']>;
    userAddress_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum PoolShare_OrderBy {
    Balance = 'balance',
    Id = 'id',
    PoolId = 'poolId',
    PoolIdAddress = 'poolId__address',
    PoolIdAlpha = 'poolId__alpha',
    PoolIdAmp = 'poolId__amp',
    PoolIdBaseToken = 'poolId__baseToken',
    PoolIdBeta = 'poolId__beta',
    PoolIdC = 'poolId__c',
    PoolIdCreateTime = 'poolId__createTime',
    PoolIdDSq = 'poolId__dSq',
    PoolIdDelta = 'poolId__delta',
    PoolIdEpsilon = 'poolId__epsilon',
    PoolIdExpiryTime = 'poolId__expiryTime',
    PoolIdFactory = 'poolId__factory',
    PoolIdHoldersCount = 'poolId__holdersCount',
    PoolIdId = 'poolId__id',
    PoolIdIsInRecoveryMode = 'poolId__isInRecoveryMode',
    PoolIdIsPaused = 'poolId__isPaused',
    PoolIdJoinExitEnabled = 'poolId__joinExitEnabled',
    PoolIdLambda = 'poolId__lambda',
    PoolIdLastJoinExitAmp = 'poolId__lastJoinExitAmp',
    PoolIdLastPostJoinExitInvariant = 'poolId__lastPostJoinExitInvariant',
    PoolIdLowerTarget = 'poolId__lowerTarget',
    PoolIdMainIndex = 'poolId__mainIndex',
    PoolIdManagementAumFee = 'poolId__managementAumFee',
    PoolIdManagementFee = 'poolId__managementFee',
    PoolIdMustAllowlistLPs = 'poolId__mustAllowlistLPs',
    PoolIdName = 'poolId__name',
    PoolIdOracleEnabled = 'poolId__oracleEnabled',
    PoolIdOwner = 'poolId__owner',
    PoolIdPoolType = 'poolId__poolType',
    PoolIdPoolTypeVersion = 'poolId__poolTypeVersion',
    PoolIdPrincipalToken = 'poolId__principalToken',
    PoolIdProtocolAumFeeCache = 'poolId__protocolAumFeeCache',
    PoolIdProtocolId = 'poolId__protocolId',
    PoolIdProtocolSwapFeeCache = 'poolId__protocolSwapFeeCache',
    PoolIdProtocolYieldFeeCache = 'poolId__protocolYieldFeeCache',
    PoolIdRoot3Alpha = 'poolId__root3Alpha',
    PoolIdS = 'poolId__s',
    PoolIdSqrtAlpha = 'poolId__sqrtAlpha',
    PoolIdSqrtBeta = 'poolId__sqrtBeta',
    PoolIdStrategyType = 'poolId__strategyType',
    PoolIdSwapEnabled = 'poolId__swapEnabled',
    PoolIdSwapEnabledCurationSignal = 'poolId__swapEnabledCurationSignal',
    PoolIdSwapEnabledInternal = 'poolId__swapEnabledInternal',
    PoolIdSwapFee = 'poolId__swapFee',
    PoolIdSwapsCount = 'poolId__swapsCount',
    PoolIdSymbol = 'poolId__symbol',
    PoolIdTauAlphaX = 'poolId__tauAlphaX',
    PoolIdTauAlphaY = 'poolId__tauAlphaY',
    PoolIdTauBetaX = 'poolId__tauBetaX',
    PoolIdTauBetaY = 'poolId__tauBetaY',
    PoolIdTotalAumFeeCollectedInBpt = 'poolId__totalAumFeeCollectedInBPT',
    PoolIdTotalProtocolFeePaidInBpt = 'poolId__totalProtocolFeePaidInBPT',
    PoolIdTotalShares = 'poolId__totalShares',
    PoolIdTotalWeight = 'poolId__totalWeight',
    PoolIdTx = 'poolId__tx',
    PoolIdU = 'poolId__u',
    PoolIdUnitSeconds = 'poolId__unitSeconds',
    PoolIdUpperTarget = 'poolId__upperTarget',
    PoolIdV = 'poolId__v',
    PoolIdW = 'poolId__w',
    PoolIdWrappedIndex = 'poolId__wrappedIndex',
    PoolIdZ = 'poolId__z',
    UserAddress = 'userAddress',
}

export type PoolToken = {
    __typename?: 'PoolToken';
    address: Scalars['String'];
    balance: Scalars['BigDecimal'];
    decimals: Scalars['Int'];
    id: Scalars['ID'];
    index: Scalars['Int'];
    isExemptFromYieldProtocolFee?: Maybe<Scalars['Boolean']>;
    name: Scalars['String'];
    oldPriceRate: Scalars['BigDecimal'];
    paidProtocolFees: Scalars['BigDecimal'];
    poolId?: Maybe<Pool>;
    priceRate: Scalars['BigDecimal'];
    symbol: Scalars['String'];
    token: Token;
    weight?: Maybe<Scalars['BigDecimal']>;
};

export type PoolToken_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    address?: InputMaybe<Scalars['String']>;
    address_contains?: InputMaybe<Scalars['String']>;
    address_contains_nocase?: InputMaybe<Scalars['String']>;
    address_ends_with?: InputMaybe<Scalars['String']>;
    address_ends_with_nocase?: InputMaybe<Scalars['String']>;
    address_gt?: InputMaybe<Scalars['String']>;
    address_gte?: InputMaybe<Scalars['String']>;
    address_in?: InputMaybe<Array<Scalars['String']>>;
    address_lt?: InputMaybe<Scalars['String']>;
    address_lte?: InputMaybe<Scalars['String']>;
    address_not?: InputMaybe<Scalars['String']>;
    address_not_contains?: InputMaybe<Scalars['String']>;
    address_not_contains_nocase?: InputMaybe<Scalars['String']>;
    address_not_ends_with?: InputMaybe<Scalars['String']>;
    address_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    address_not_in?: InputMaybe<Array<Scalars['String']>>;
    address_not_starts_with?: InputMaybe<Scalars['String']>;
    address_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    address_starts_with?: InputMaybe<Scalars['String']>;
    address_starts_with_nocase?: InputMaybe<Scalars['String']>;
    and?: InputMaybe<Array<InputMaybe<PoolToken_Filter>>>;
    balance?: InputMaybe<Scalars['BigDecimal']>;
    balance_gt?: InputMaybe<Scalars['BigDecimal']>;
    balance_gte?: InputMaybe<Scalars['BigDecimal']>;
    balance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: InputMaybe<Scalars['BigDecimal']>;
    balance_lte?: InputMaybe<Scalars['BigDecimal']>;
    balance_not?: InputMaybe<Scalars['BigDecimal']>;
    balance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    decimals?: InputMaybe<Scalars['Int']>;
    decimals_gt?: InputMaybe<Scalars['Int']>;
    decimals_gte?: InputMaybe<Scalars['Int']>;
    decimals_in?: InputMaybe<Array<Scalars['Int']>>;
    decimals_lt?: InputMaybe<Scalars['Int']>;
    decimals_lte?: InputMaybe<Scalars['Int']>;
    decimals_not?: InputMaybe<Scalars['Int']>;
    decimals_not_in?: InputMaybe<Array<Scalars['Int']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    index?: InputMaybe<Scalars['Int']>;
    index_gt?: InputMaybe<Scalars['Int']>;
    index_gte?: InputMaybe<Scalars['Int']>;
    index_in?: InputMaybe<Array<Scalars['Int']>>;
    index_lt?: InputMaybe<Scalars['Int']>;
    index_lte?: InputMaybe<Scalars['Int']>;
    index_not?: InputMaybe<Scalars['Int']>;
    index_not_in?: InputMaybe<Array<Scalars['Int']>>;
    isExemptFromYieldProtocolFee?: InputMaybe<Scalars['Boolean']>;
    isExemptFromYieldProtocolFee_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isExemptFromYieldProtocolFee_not?: InputMaybe<Scalars['Boolean']>;
    isExemptFromYieldProtocolFee_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    name?: InputMaybe<Scalars['String']>;
    name_contains?: InputMaybe<Scalars['String']>;
    name_contains_nocase?: InputMaybe<Scalars['String']>;
    name_ends_with?: InputMaybe<Scalars['String']>;
    name_ends_with_nocase?: InputMaybe<Scalars['String']>;
    name_gt?: InputMaybe<Scalars['String']>;
    name_gte?: InputMaybe<Scalars['String']>;
    name_in?: InputMaybe<Array<Scalars['String']>>;
    name_lt?: InputMaybe<Scalars['String']>;
    name_lte?: InputMaybe<Scalars['String']>;
    name_not?: InputMaybe<Scalars['String']>;
    name_not_contains?: InputMaybe<Scalars['String']>;
    name_not_contains_nocase?: InputMaybe<Scalars['String']>;
    name_not_ends_with?: InputMaybe<Scalars['String']>;
    name_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    name_not_in?: InputMaybe<Array<Scalars['String']>>;
    name_not_starts_with?: InputMaybe<Scalars['String']>;
    name_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    name_starts_with?: InputMaybe<Scalars['String']>;
    name_starts_with_nocase?: InputMaybe<Scalars['String']>;
    oldPriceRate?: InputMaybe<Scalars['BigDecimal']>;
    oldPriceRate_gt?: InputMaybe<Scalars['BigDecimal']>;
    oldPriceRate_gte?: InputMaybe<Scalars['BigDecimal']>;
    oldPriceRate_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    oldPriceRate_lt?: InputMaybe<Scalars['BigDecimal']>;
    oldPriceRate_lte?: InputMaybe<Scalars['BigDecimal']>;
    oldPriceRate_not?: InputMaybe<Scalars['BigDecimal']>;
    oldPriceRate_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    or?: InputMaybe<Array<InputMaybe<PoolToken_Filter>>>;
    paidProtocolFees?: InputMaybe<Scalars['BigDecimal']>;
    paidProtocolFees_gt?: InputMaybe<Scalars['BigDecimal']>;
    paidProtocolFees_gte?: InputMaybe<Scalars['BigDecimal']>;
    paidProtocolFees_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    paidProtocolFees_lt?: InputMaybe<Scalars['BigDecimal']>;
    paidProtocolFees_lte?: InputMaybe<Scalars['BigDecimal']>;
    paidProtocolFees_not?: InputMaybe<Scalars['BigDecimal']>;
    paidProtocolFees_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    poolId?: InputMaybe<Scalars['String']>;
    poolId_?: InputMaybe<Pool_Filter>;
    poolId_contains?: InputMaybe<Scalars['String']>;
    poolId_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_ends_with?: InputMaybe<Scalars['String']>;
    poolId_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_gt?: InputMaybe<Scalars['String']>;
    poolId_gte?: InputMaybe<Scalars['String']>;
    poolId_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_lt?: InputMaybe<Scalars['String']>;
    poolId_lte?: InputMaybe<Scalars['String']>;
    poolId_not?: InputMaybe<Scalars['String']>;
    poolId_not_contains?: InputMaybe<Scalars['String']>;
    poolId_not_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: InputMaybe<Scalars['String']>;
    poolId_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_starts_with?: InputMaybe<Scalars['String']>;
    poolId_starts_with_nocase?: InputMaybe<Scalars['String']>;
    priceRate?: InputMaybe<Scalars['BigDecimal']>;
    priceRate_gt?: InputMaybe<Scalars['BigDecimal']>;
    priceRate_gte?: InputMaybe<Scalars['BigDecimal']>;
    priceRate_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    priceRate_lt?: InputMaybe<Scalars['BigDecimal']>;
    priceRate_lte?: InputMaybe<Scalars['BigDecimal']>;
    priceRate_not?: InputMaybe<Scalars['BigDecimal']>;
    priceRate_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    symbol?: InputMaybe<Scalars['String']>;
    symbol_contains?: InputMaybe<Scalars['String']>;
    symbol_contains_nocase?: InputMaybe<Scalars['String']>;
    symbol_ends_with?: InputMaybe<Scalars['String']>;
    symbol_ends_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_gt?: InputMaybe<Scalars['String']>;
    symbol_gte?: InputMaybe<Scalars['String']>;
    symbol_in?: InputMaybe<Array<Scalars['String']>>;
    symbol_lt?: InputMaybe<Scalars['String']>;
    symbol_lte?: InputMaybe<Scalars['String']>;
    symbol_not?: InputMaybe<Scalars['String']>;
    symbol_not_contains?: InputMaybe<Scalars['String']>;
    symbol_not_contains_nocase?: InputMaybe<Scalars['String']>;
    symbol_not_ends_with?: InputMaybe<Scalars['String']>;
    symbol_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_not_in?: InputMaybe<Array<Scalars['String']>>;
    symbol_not_starts_with?: InputMaybe<Scalars['String']>;
    symbol_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_starts_with?: InputMaybe<Scalars['String']>;
    symbol_starts_with_nocase?: InputMaybe<Scalars['String']>;
    token?: InputMaybe<Scalars['String']>;
    token_?: InputMaybe<Token_Filter>;
    token_contains?: InputMaybe<Scalars['String']>;
    token_contains_nocase?: InputMaybe<Scalars['String']>;
    token_ends_with?: InputMaybe<Scalars['String']>;
    token_ends_with_nocase?: InputMaybe<Scalars['String']>;
    token_gt?: InputMaybe<Scalars['String']>;
    token_gte?: InputMaybe<Scalars['String']>;
    token_in?: InputMaybe<Array<Scalars['String']>>;
    token_lt?: InputMaybe<Scalars['String']>;
    token_lte?: InputMaybe<Scalars['String']>;
    token_not?: InputMaybe<Scalars['String']>;
    token_not_contains?: InputMaybe<Scalars['String']>;
    token_not_contains_nocase?: InputMaybe<Scalars['String']>;
    token_not_ends_with?: InputMaybe<Scalars['String']>;
    token_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    token_not_in?: InputMaybe<Array<Scalars['String']>>;
    token_not_starts_with?: InputMaybe<Scalars['String']>;
    token_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    token_starts_with?: InputMaybe<Scalars['String']>;
    token_starts_with_nocase?: InputMaybe<Scalars['String']>;
    weight?: InputMaybe<Scalars['BigDecimal']>;
    weight_gt?: InputMaybe<Scalars['BigDecimal']>;
    weight_gte?: InputMaybe<Scalars['BigDecimal']>;
    weight_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    weight_lt?: InputMaybe<Scalars['BigDecimal']>;
    weight_lte?: InputMaybe<Scalars['BigDecimal']>;
    weight_not?: InputMaybe<Scalars['BigDecimal']>;
    weight_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolToken_OrderBy {
    Address = 'address',
    Balance = 'balance',
    Decimals = 'decimals',
    Id = 'id',
    Index = 'index',
    IsExemptFromYieldProtocolFee = 'isExemptFromYieldProtocolFee',
    Name = 'name',
    OldPriceRate = 'oldPriceRate',
    PaidProtocolFees = 'paidProtocolFees',
    PoolId = 'poolId',
    PoolIdAddress = 'poolId__address',
    PoolIdAlpha = 'poolId__alpha',
    PoolIdAmp = 'poolId__amp',
    PoolIdBaseToken = 'poolId__baseToken',
    PoolIdBeta = 'poolId__beta',
    PoolIdC = 'poolId__c',
    PoolIdCreateTime = 'poolId__createTime',
    PoolIdDSq = 'poolId__dSq',
    PoolIdDelta = 'poolId__delta',
    PoolIdEpsilon = 'poolId__epsilon',
    PoolIdExpiryTime = 'poolId__expiryTime',
    PoolIdFactory = 'poolId__factory',
    PoolIdHoldersCount = 'poolId__holdersCount',
    PoolIdId = 'poolId__id',
    PoolIdIsInRecoveryMode = 'poolId__isInRecoveryMode',
    PoolIdIsPaused = 'poolId__isPaused',
    PoolIdJoinExitEnabled = 'poolId__joinExitEnabled',
    PoolIdLambda = 'poolId__lambda',
    PoolIdLastJoinExitAmp = 'poolId__lastJoinExitAmp',
    PoolIdLastPostJoinExitInvariant = 'poolId__lastPostJoinExitInvariant',
    PoolIdLowerTarget = 'poolId__lowerTarget',
    PoolIdMainIndex = 'poolId__mainIndex',
    PoolIdManagementAumFee = 'poolId__managementAumFee',
    PoolIdManagementFee = 'poolId__managementFee',
    PoolIdMustAllowlistLPs = 'poolId__mustAllowlistLPs',
    PoolIdName = 'poolId__name',
    PoolIdOracleEnabled = 'poolId__oracleEnabled',
    PoolIdOwner = 'poolId__owner',
    PoolIdPoolType = 'poolId__poolType',
    PoolIdPoolTypeVersion = 'poolId__poolTypeVersion',
    PoolIdPrincipalToken = 'poolId__principalToken',
    PoolIdProtocolAumFeeCache = 'poolId__protocolAumFeeCache',
    PoolIdProtocolId = 'poolId__protocolId',
    PoolIdProtocolSwapFeeCache = 'poolId__protocolSwapFeeCache',
    PoolIdProtocolYieldFeeCache = 'poolId__protocolYieldFeeCache',
    PoolIdRoot3Alpha = 'poolId__root3Alpha',
    PoolIdS = 'poolId__s',
    PoolIdSqrtAlpha = 'poolId__sqrtAlpha',
    PoolIdSqrtBeta = 'poolId__sqrtBeta',
    PoolIdStrategyType = 'poolId__strategyType',
    PoolIdSwapEnabled = 'poolId__swapEnabled',
    PoolIdSwapEnabledCurationSignal = 'poolId__swapEnabledCurationSignal',
    PoolIdSwapEnabledInternal = 'poolId__swapEnabledInternal',
    PoolIdSwapFee = 'poolId__swapFee',
    PoolIdSwapsCount = 'poolId__swapsCount',
    PoolIdSymbol = 'poolId__symbol',
    PoolIdTauAlphaX = 'poolId__tauAlphaX',
    PoolIdTauAlphaY = 'poolId__tauAlphaY',
    PoolIdTauBetaX = 'poolId__tauBetaX',
    PoolIdTauBetaY = 'poolId__tauBetaY',
    PoolIdTotalAumFeeCollectedInBpt = 'poolId__totalAumFeeCollectedInBPT',
    PoolIdTotalProtocolFeePaidInBpt = 'poolId__totalProtocolFeePaidInBPT',
    PoolIdTotalShares = 'poolId__totalShares',
    PoolIdTotalWeight = 'poolId__totalWeight',
    PoolIdTx = 'poolId__tx',
    PoolIdU = 'poolId__u',
    PoolIdUnitSeconds = 'poolId__unitSeconds',
    PoolIdUpperTarget = 'poolId__upperTarget',
    PoolIdV = 'poolId__v',
    PoolIdW = 'poolId__w',
    PoolIdWrappedIndex = 'poolId__wrappedIndex',
    PoolIdZ = 'poolId__z',
    PriceRate = 'priceRate',
    Symbol = 'symbol',
    Token = 'token',
    TokenAddress = 'token__address',
    TokenDecimals = 'token__decimals',
    TokenFxOracleDecimals = 'token__fxOracleDecimals',
    TokenId = 'token__id',
    TokenLatestFxPrice = 'token__latestFXPrice',
    TokenName = 'token__name',
    TokenSymbol = 'token__symbol',
    TokenTotalBalanceNotional = 'token__totalBalanceNotional',
    Weight = 'weight',
}

export type Pool_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    address?: InputMaybe<Scalars['Bytes']>;
    address_contains?: InputMaybe<Scalars['Bytes']>;
    address_gt?: InputMaybe<Scalars['Bytes']>;
    address_gte?: InputMaybe<Scalars['Bytes']>;
    address_in?: InputMaybe<Array<Scalars['Bytes']>>;
    address_lt?: InputMaybe<Scalars['Bytes']>;
    address_lte?: InputMaybe<Scalars['Bytes']>;
    address_not?: InputMaybe<Scalars['Bytes']>;
    address_not_contains?: InputMaybe<Scalars['Bytes']>;
    address_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    alpha?: InputMaybe<Scalars['BigDecimal']>;
    alpha_gt?: InputMaybe<Scalars['BigDecimal']>;
    alpha_gte?: InputMaybe<Scalars['BigDecimal']>;
    alpha_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    alpha_lt?: InputMaybe<Scalars['BigDecimal']>;
    alpha_lte?: InputMaybe<Scalars['BigDecimal']>;
    alpha_not?: InputMaybe<Scalars['BigDecimal']>;
    alpha_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amp?: InputMaybe<Scalars['BigInt']>;
    ampUpdates_?: InputMaybe<AmpUpdate_Filter>;
    amp_gt?: InputMaybe<Scalars['BigInt']>;
    amp_gte?: InputMaybe<Scalars['BigInt']>;
    amp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    amp_lt?: InputMaybe<Scalars['BigInt']>;
    amp_lte?: InputMaybe<Scalars['BigInt']>;
    amp_not?: InputMaybe<Scalars['BigInt']>;
    amp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    and?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
    baseToken?: InputMaybe<Scalars['Bytes']>;
    baseToken_contains?: InputMaybe<Scalars['Bytes']>;
    baseToken_gt?: InputMaybe<Scalars['Bytes']>;
    baseToken_gte?: InputMaybe<Scalars['Bytes']>;
    baseToken_in?: InputMaybe<Array<Scalars['Bytes']>>;
    baseToken_lt?: InputMaybe<Scalars['Bytes']>;
    baseToken_lte?: InputMaybe<Scalars['Bytes']>;
    baseToken_not?: InputMaybe<Scalars['Bytes']>;
    baseToken_not_contains?: InputMaybe<Scalars['Bytes']>;
    baseToken_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    beta?: InputMaybe<Scalars['BigDecimal']>;
    beta_gt?: InputMaybe<Scalars['BigDecimal']>;
    beta_gte?: InputMaybe<Scalars['BigDecimal']>;
    beta_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    beta_lt?: InputMaybe<Scalars['BigDecimal']>;
    beta_lte?: InputMaybe<Scalars['BigDecimal']>;
    beta_not?: InputMaybe<Scalars['BigDecimal']>;
    beta_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    c?: InputMaybe<Scalars['BigDecimal']>;
    c_gt?: InputMaybe<Scalars['BigDecimal']>;
    c_gte?: InputMaybe<Scalars['BigDecimal']>;
    c_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    c_lt?: InputMaybe<Scalars['BigDecimal']>;
    c_lte?: InputMaybe<Scalars['BigDecimal']>;
    c_not?: InputMaybe<Scalars['BigDecimal']>;
    c_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    createTime?: InputMaybe<Scalars['Int']>;
    createTime_gt?: InputMaybe<Scalars['Int']>;
    createTime_gte?: InputMaybe<Scalars['Int']>;
    createTime_in?: InputMaybe<Array<Scalars['Int']>>;
    createTime_lt?: InputMaybe<Scalars['Int']>;
    createTime_lte?: InputMaybe<Scalars['Int']>;
    createTime_not?: InputMaybe<Scalars['Int']>;
    createTime_not_in?: InputMaybe<Array<Scalars['Int']>>;
    dSq?: InputMaybe<Scalars['BigDecimal']>;
    dSq_gt?: InputMaybe<Scalars['BigDecimal']>;
    dSq_gte?: InputMaybe<Scalars['BigDecimal']>;
    dSq_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    dSq_lt?: InputMaybe<Scalars['BigDecimal']>;
    dSq_lte?: InputMaybe<Scalars['BigDecimal']>;
    dSq_not?: InputMaybe<Scalars['BigDecimal']>;
    dSq_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    delta?: InputMaybe<Scalars['BigDecimal']>;
    delta_gt?: InputMaybe<Scalars['BigDecimal']>;
    delta_gte?: InputMaybe<Scalars['BigDecimal']>;
    delta_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    delta_lt?: InputMaybe<Scalars['BigDecimal']>;
    delta_lte?: InputMaybe<Scalars['BigDecimal']>;
    delta_not?: InputMaybe<Scalars['BigDecimal']>;
    delta_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    epsilon?: InputMaybe<Scalars['BigDecimal']>;
    epsilon_gt?: InputMaybe<Scalars['BigDecimal']>;
    epsilon_gte?: InputMaybe<Scalars['BigDecimal']>;
    epsilon_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    epsilon_lt?: InputMaybe<Scalars['BigDecimal']>;
    epsilon_lte?: InputMaybe<Scalars['BigDecimal']>;
    epsilon_not?: InputMaybe<Scalars['BigDecimal']>;
    epsilon_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    expiryTime?: InputMaybe<Scalars['BigInt']>;
    expiryTime_gt?: InputMaybe<Scalars['BigInt']>;
    expiryTime_gte?: InputMaybe<Scalars['BigInt']>;
    expiryTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
    expiryTime_lt?: InputMaybe<Scalars['BigInt']>;
    expiryTime_lte?: InputMaybe<Scalars['BigInt']>;
    expiryTime_not?: InputMaybe<Scalars['BigInt']>;
    expiryTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    factory?: InputMaybe<Scalars['Bytes']>;
    factory_contains?: InputMaybe<Scalars['Bytes']>;
    factory_gt?: InputMaybe<Scalars['Bytes']>;
    factory_gte?: InputMaybe<Scalars['Bytes']>;
    factory_in?: InputMaybe<Array<Scalars['Bytes']>>;
    factory_lt?: InputMaybe<Scalars['Bytes']>;
    factory_lte?: InputMaybe<Scalars['Bytes']>;
    factory_not?: InputMaybe<Scalars['Bytes']>;
    factory_not_contains?: InputMaybe<Scalars['Bytes']>;
    factory_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    holdersCount?: InputMaybe<Scalars['BigInt']>;
    holdersCount_gt?: InputMaybe<Scalars['BigInt']>;
    holdersCount_gte?: InputMaybe<Scalars['BigInt']>;
    holdersCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
    holdersCount_lt?: InputMaybe<Scalars['BigInt']>;
    holdersCount_lte?: InputMaybe<Scalars['BigInt']>;
    holdersCount_not?: InputMaybe<Scalars['BigInt']>;
    holdersCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    isInRecoveryMode?: InputMaybe<Scalars['Boolean']>;
    isInRecoveryMode_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isInRecoveryMode_not?: InputMaybe<Scalars['Boolean']>;
    isInRecoveryMode_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isPaused?: InputMaybe<Scalars['Boolean']>;
    isPaused_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isPaused_not?: InputMaybe<Scalars['Boolean']>;
    isPaused_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    joinExitEnabled?: InputMaybe<Scalars['Boolean']>;
    joinExitEnabled_in?: InputMaybe<Array<Scalars['Boolean']>>;
    joinExitEnabled_not?: InputMaybe<Scalars['Boolean']>;
    joinExitEnabled_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    joinsExits_?: InputMaybe<JoinExit_Filter>;
    lambda?: InputMaybe<Scalars['BigDecimal']>;
    lambda_gt?: InputMaybe<Scalars['BigDecimal']>;
    lambda_gte?: InputMaybe<Scalars['BigDecimal']>;
    lambda_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    lambda_lt?: InputMaybe<Scalars['BigDecimal']>;
    lambda_lte?: InputMaybe<Scalars['BigDecimal']>;
    lambda_not?: InputMaybe<Scalars['BigDecimal']>;
    lambda_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    lastJoinExitAmp?: InputMaybe<Scalars['BigInt']>;
    lastJoinExitAmp_gt?: InputMaybe<Scalars['BigInt']>;
    lastJoinExitAmp_gte?: InputMaybe<Scalars['BigInt']>;
    lastJoinExitAmp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lastJoinExitAmp_lt?: InputMaybe<Scalars['BigInt']>;
    lastJoinExitAmp_lte?: InputMaybe<Scalars['BigInt']>;
    lastJoinExitAmp_not?: InputMaybe<Scalars['BigInt']>;
    lastJoinExitAmp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lastPostJoinExitInvariant?: InputMaybe<Scalars['BigDecimal']>;
    lastPostJoinExitInvariant_gt?: InputMaybe<Scalars['BigDecimal']>;
    lastPostJoinExitInvariant_gte?: InputMaybe<Scalars['BigDecimal']>;
    lastPostJoinExitInvariant_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    lastPostJoinExitInvariant_lt?: InputMaybe<Scalars['BigDecimal']>;
    lastPostJoinExitInvariant_lte?: InputMaybe<Scalars['BigDecimal']>;
    lastPostJoinExitInvariant_not?: InputMaybe<Scalars['BigDecimal']>;
    lastPostJoinExitInvariant_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    latestAmpUpdate?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_?: InputMaybe<AmpUpdate_Filter>;
    latestAmpUpdate_contains?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_contains_nocase?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_ends_with?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_ends_with_nocase?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_gt?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_gte?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_in?: InputMaybe<Array<Scalars['String']>>;
    latestAmpUpdate_lt?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_lte?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_not?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_not_contains?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_not_contains_nocase?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_not_ends_with?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_not_in?: InputMaybe<Array<Scalars['String']>>;
    latestAmpUpdate_not_starts_with?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_starts_with?: InputMaybe<Scalars['String']>;
    latestAmpUpdate_starts_with_nocase?: InputMaybe<Scalars['String']>;
    lowerTarget?: InputMaybe<Scalars['BigDecimal']>;
    lowerTarget_gt?: InputMaybe<Scalars['BigDecimal']>;
    lowerTarget_gte?: InputMaybe<Scalars['BigDecimal']>;
    lowerTarget_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    lowerTarget_lt?: InputMaybe<Scalars['BigDecimal']>;
    lowerTarget_lte?: InputMaybe<Scalars['BigDecimal']>;
    lowerTarget_not?: InputMaybe<Scalars['BigDecimal']>;
    lowerTarget_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    mainIndex?: InputMaybe<Scalars['Int']>;
    mainIndex_gt?: InputMaybe<Scalars['Int']>;
    mainIndex_gte?: InputMaybe<Scalars['Int']>;
    mainIndex_in?: InputMaybe<Array<Scalars['Int']>>;
    mainIndex_lt?: InputMaybe<Scalars['Int']>;
    mainIndex_lte?: InputMaybe<Scalars['Int']>;
    mainIndex_not?: InputMaybe<Scalars['Int']>;
    mainIndex_not_in?: InputMaybe<Array<Scalars['Int']>>;
    managementAumFee?: InputMaybe<Scalars['BigDecimal']>;
    managementAumFee_gt?: InputMaybe<Scalars['BigDecimal']>;
    managementAumFee_gte?: InputMaybe<Scalars['BigDecimal']>;
    managementAumFee_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    managementAumFee_lt?: InputMaybe<Scalars['BigDecimal']>;
    managementAumFee_lte?: InputMaybe<Scalars['BigDecimal']>;
    managementAumFee_not?: InputMaybe<Scalars['BigDecimal']>;
    managementAumFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    managementFee?: InputMaybe<Scalars['BigDecimal']>;
    managementFee_gt?: InputMaybe<Scalars['BigDecimal']>;
    managementFee_gte?: InputMaybe<Scalars['BigDecimal']>;
    managementFee_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    managementFee_lt?: InputMaybe<Scalars['BigDecimal']>;
    managementFee_lte?: InputMaybe<Scalars['BigDecimal']>;
    managementFee_not?: InputMaybe<Scalars['BigDecimal']>;
    managementFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    mustAllowlistLPs?: InputMaybe<Scalars['Boolean']>;
    mustAllowlistLPs_in?: InputMaybe<Array<Scalars['Boolean']>>;
    mustAllowlistLPs_not?: InputMaybe<Scalars['Boolean']>;
    mustAllowlistLPs_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    name?: InputMaybe<Scalars['String']>;
    name_contains?: InputMaybe<Scalars['String']>;
    name_contains_nocase?: InputMaybe<Scalars['String']>;
    name_ends_with?: InputMaybe<Scalars['String']>;
    name_ends_with_nocase?: InputMaybe<Scalars['String']>;
    name_gt?: InputMaybe<Scalars['String']>;
    name_gte?: InputMaybe<Scalars['String']>;
    name_in?: InputMaybe<Array<Scalars['String']>>;
    name_lt?: InputMaybe<Scalars['String']>;
    name_lte?: InputMaybe<Scalars['String']>;
    name_not?: InputMaybe<Scalars['String']>;
    name_not_contains?: InputMaybe<Scalars['String']>;
    name_not_contains_nocase?: InputMaybe<Scalars['String']>;
    name_not_ends_with?: InputMaybe<Scalars['String']>;
    name_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    name_not_in?: InputMaybe<Array<Scalars['String']>>;
    name_not_starts_with?: InputMaybe<Scalars['String']>;
    name_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    name_starts_with?: InputMaybe<Scalars['String']>;
    name_starts_with_nocase?: InputMaybe<Scalars['String']>;
    or?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
    oracleEnabled?: InputMaybe<Scalars['Boolean']>;
    oracleEnabled_in?: InputMaybe<Array<Scalars['Boolean']>>;
    oracleEnabled_not?: InputMaybe<Scalars['Boolean']>;
    oracleEnabled_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    owner?: InputMaybe<Scalars['Bytes']>;
    owner_contains?: InputMaybe<Scalars['Bytes']>;
    owner_gt?: InputMaybe<Scalars['Bytes']>;
    owner_gte?: InputMaybe<Scalars['Bytes']>;
    owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
    owner_lt?: InputMaybe<Scalars['Bytes']>;
    owner_lte?: InputMaybe<Scalars['Bytes']>;
    owner_not?: InputMaybe<Scalars['Bytes']>;
    owner_not_contains?: InputMaybe<Scalars['Bytes']>;
    owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    poolType?: InputMaybe<Scalars['String']>;
    poolTypeVersion?: InputMaybe<Scalars['Int']>;
    poolTypeVersion_gt?: InputMaybe<Scalars['Int']>;
    poolTypeVersion_gte?: InputMaybe<Scalars['Int']>;
    poolTypeVersion_in?: InputMaybe<Array<Scalars['Int']>>;
    poolTypeVersion_lt?: InputMaybe<Scalars['Int']>;
    poolTypeVersion_lte?: InputMaybe<Scalars['Int']>;
    poolTypeVersion_not?: InputMaybe<Scalars['Int']>;
    poolTypeVersion_not_in?: InputMaybe<Array<Scalars['Int']>>;
    poolType_contains?: InputMaybe<Scalars['String']>;
    poolType_contains_nocase?: InputMaybe<Scalars['String']>;
    poolType_ends_with?: InputMaybe<Scalars['String']>;
    poolType_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolType_gt?: InputMaybe<Scalars['String']>;
    poolType_gte?: InputMaybe<Scalars['String']>;
    poolType_in?: InputMaybe<Array<Scalars['String']>>;
    poolType_lt?: InputMaybe<Scalars['String']>;
    poolType_lte?: InputMaybe<Scalars['String']>;
    poolType_not?: InputMaybe<Scalars['String']>;
    poolType_not_contains?: InputMaybe<Scalars['String']>;
    poolType_not_contains_nocase?: InputMaybe<Scalars['String']>;
    poolType_not_ends_with?: InputMaybe<Scalars['String']>;
    poolType_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolType_not_in?: InputMaybe<Array<Scalars['String']>>;
    poolType_not_starts_with?: InputMaybe<Scalars['String']>;
    poolType_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    poolType_starts_with?: InputMaybe<Scalars['String']>;
    poolType_starts_with_nocase?: InputMaybe<Scalars['String']>;
    priceRateProviders_?: InputMaybe<PriceRateProvider_Filter>;
    principalToken?: InputMaybe<Scalars['Bytes']>;
    principalToken_contains?: InputMaybe<Scalars['Bytes']>;
    principalToken_gt?: InputMaybe<Scalars['Bytes']>;
    principalToken_gte?: InputMaybe<Scalars['Bytes']>;
    principalToken_in?: InputMaybe<Array<Scalars['Bytes']>>;
    principalToken_lt?: InputMaybe<Scalars['Bytes']>;
    principalToken_lte?: InputMaybe<Scalars['Bytes']>;
    principalToken_not?: InputMaybe<Scalars['Bytes']>;
    principalToken_not_contains?: InputMaybe<Scalars['Bytes']>;
    principalToken_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    protocolAumFeeCache?: InputMaybe<Scalars['BigDecimal']>;
    protocolAumFeeCache_gt?: InputMaybe<Scalars['BigDecimal']>;
    protocolAumFeeCache_gte?: InputMaybe<Scalars['BigDecimal']>;
    protocolAumFeeCache_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    protocolAumFeeCache_lt?: InputMaybe<Scalars['BigDecimal']>;
    protocolAumFeeCache_lte?: InputMaybe<Scalars['BigDecimal']>;
    protocolAumFeeCache_not?: InputMaybe<Scalars['BigDecimal']>;
    protocolAumFeeCache_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    protocolId?: InputMaybe<Scalars['Int']>;
    protocolIdData?: InputMaybe<Scalars['String']>;
    protocolIdData_?: InputMaybe<ProtocolIdData_Filter>;
    protocolIdData_contains?: InputMaybe<Scalars['String']>;
    protocolIdData_contains_nocase?: InputMaybe<Scalars['String']>;
    protocolIdData_ends_with?: InputMaybe<Scalars['String']>;
    protocolIdData_ends_with_nocase?: InputMaybe<Scalars['String']>;
    protocolIdData_gt?: InputMaybe<Scalars['String']>;
    protocolIdData_gte?: InputMaybe<Scalars['String']>;
    protocolIdData_in?: InputMaybe<Array<Scalars['String']>>;
    protocolIdData_lt?: InputMaybe<Scalars['String']>;
    protocolIdData_lte?: InputMaybe<Scalars['String']>;
    protocolIdData_not?: InputMaybe<Scalars['String']>;
    protocolIdData_not_contains?: InputMaybe<Scalars['String']>;
    protocolIdData_not_contains_nocase?: InputMaybe<Scalars['String']>;
    protocolIdData_not_ends_with?: InputMaybe<Scalars['String']>;
    protocolIdData_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    protocolIdData_not_in?: InputMaybe<Array<Scalars['String']>>;
    protocolIdData_not_starts_with?: InputMaybe<Scalars['String']>;
    protocolIdData_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    protocolIdData_starts_with?: InputMaybe<Scalars['String']>;
    protocolIdData_starts_with_nocase?: InputMaybe<Scalars['String']>;
    protocolId_gt?: InputMaybe<Scalars['Int']>;
    protocolId_gte?: InputMaybe<Scalars['Int']>;
    protocolId_in?: InputMaybe<Array<Scalars['Int']>>;
    protocolId_lt?: InputMaybe<Scalars['Int']>;
    protocolId_lte?: InputMaybe<Scalars['Int']>;
    protocolId_not?: InputMaybe<Scalars['Int']>;
    protocolId_not_in?: InputMaybe<Array<Scalars['Int']>>;
    protocolSwapFeeCache?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFeeCache_gt?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFeeCache_gte?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFeeCache_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    protocolSwapFeeCache_lt?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFeeCache_lte?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFeeCache_not?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFeeCache_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    protocolYieldFeeCache?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFeeCache_gt?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFeeCache_gte?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFeeCache_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    protocolYieldFeeCache_lt?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFeeCache_lte?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFeeCache_not?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFeeCache_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    root3Alpha?: InputMaybe<Scalars['BigDecimal']>;
    root3Alpha_gt?: InputMaybe<Scalars['BigDecimal']>;
    root3Alpha_gte?: InputMaybe<Scalars['BigDecimal']>;
    root3Alpha_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    root3Alpha_lt?: InputMaybe<Scalars['BigDecimal']>;
    root3Alpha_lte?: InputMaybe<Scalars['BigDecimal']>;
    root3Alpha_not?: InputMaybe<Scalars['BigDecimal']>;
    root3Alpha_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    s?: InputMaybe<Scalars['BigDecimal']>;
    s_gt?: InputMaybe<Scalars['BigDecimal']>;
    s_gte?: InputMaybe<Scalars['BigDecimal']>;
    s_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    s_lt?: InputMaybe<Scalars['BigDecimal']>;
    s_lte?: InputMaybe<Scalars['BigDecimal']>;
    s_not?: InputMaybe<Scalars['BigDecimal']>;
    s_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    shares_?: InputMaybe<PoolShare_Filter>;
    sqrtAlpha?: InputMaybe<Scalars['BigDecimal']>;
    sqrtAlpha_gt?: InputMaybe<Scalars['BigDecimal']>;
    sqrtAlpha_gte?: InputMaybe<Scalars['BigDecimal']>;
    sqrtAlpha_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    sqrtAlpha_lt?: InputMaybe<Scalars['BigDecimal']>;
    sqrtAlpha_lte?: InputMaybe<Scalars['BigDecimal']>;
    sqrtAlpha_not?: InputMaybe<Scalars['BigDecimal']>;
    sqrtAlpha_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    sqrtBeta?: InputMaybe<Scalars['BigDecimal']>;
    sqrtBeta_gt?: InputMaybe<Scalars['BigDecimal']>;
    sqrtBeta_gte?: InputMaybe<Scalars['BigDecimal']>;
    sqrtBeta_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    sqrtBeta_lt?: InputMaybe<Scalars['BigDecimal']>;
    sqrtBeta_lte?: InputMaybe<Scalars['BigDecimal']>;
    sqrtBeta_not?: InputMaybe<Scalars['BigDecimal']>;
    sqrtBeta_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    strategyType?: InputMaybe<Scalars['Int']>;
    strategyType_gt?: InputMaybe<Scalars['Int']>;
    strategyType_gte?: InputMaybe<Scalars['Int']>;
    strategyType_in?: InputMaybe<Array<Scalars['Int']>>;
    strategyType_lt?: InputMaybe<Scalars['Int']>;
    strategyType_lte?: InputMaybe<Scalars['Int']>;
    strategyType_not?: InputMaybe<Scalars['Int']>;
    strategyType_not_in?: InputMaybe<Array<Scalars['Int']>>;
    swapEnabled?: InputMaybe<Scalars['Boolean']>;
    swapEnabledCurationSignal?: InputMaybe<Scalars['Boolean']>;
    swapEnabledCurationSignal_in?: InputMaybe<Array<Scalars['Boolean']>>;
    swapEnabledCurationSignal_not?: InputMaybe<Scalars['Boolean']>;
    swapEnabledCurationSignal_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    swapEnabledInternal?: InputMaybe<Scalars['Boolean']>;
    swapEnabledInternal_in?: InputMaybe<Array<Scalars['Boolean']>>;
    swapEnabledInternal_not?: InputMaybe<Scalars['Boolean']>;
    swapEnabledInternal_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    swapEnabled_in?: InputMaybe<Array<Scalars['Boolean']>>;
    swapEnabled_not?: InputMaybe<Scalars['Boolean']>;
    swapEnabled_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    swapFee?: InputMaybe<Scalars['BigDecimal']>;
    swapFee_gt?: InputMaybe<Scalars['BigDecimal']>;
    swapFee_gte?: InputMaybe<Scalars['BigDecimal']>;
    swapFee_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    swapFee_lt?: InputMaybe<Scalars['BigDecimal']>;
    swapFee_lte?: InputMaybe<Scalars['BigDecimal']>;
    swapFee_not?: InputMaybe<Scalars['BigDecimal']>;
    swapFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    swapsCount?: InputMaybe<Scalars['BigInt']>;
    swapsCount_gt?: InputMaybe<Scalars['BigInt']>;
    swapsCount_gte?: InputMaybe<Scalars['BigInt']>;
    swapsCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
    swapsCount_lt?: InputMaybe<Scalars['BigInt']>;
    swapsCount_lte?: InputMaybe<Scalars['BigInt']>;
    swapsCount_not?: InputMaybe<Scalars['BigInt']>;
    swapsCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    swaps_?: InputMaybe<Swap_Filter>;
    symbol?: InputMaybe<Scalars['String']>;
    symbol_contains?: InputMaybe<Scalars['String']>;
    symbol_contains_nocase?: InputMaybe<Scalars['String']>;
    symbol_ends_with?: InputMaybe<Scalars['String']>;
    symbol_ends_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_gt?: InputMaybe<Scalars['String']>;
    symbol_gte?: InputMaybe<Scalars['String']>;
    symbol_in?: InputMaybe<Array<Scalars['String']>>;
    symbol_lt?: InputMaybe<Scalars['String']>;
    symbol_lte?: InputMaybe<Scalars['String']>;
    symbol_not?: InputMaybe<Scalars['String']>;
    symbol_not_contains?: InputMaybe<Scalars['String']>;
    symbol_not_contains_nocase?: InputMaybe<Scalars['String']>;
    symbol_not_ends_with?: InputMaybe<Scalars['String']>;
    symbol_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_not_in?: InputMaybe<Array<Scalars['String']>>;
    symbol_not_starts_with?: InputMaybe<Scalars['String']>;
    symbol_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_starts_with?: InputMaybe<Scalars['String']>;
    symbol_starts_with_nocase?: InputMaybe<Scalars['String']>;
    tauAlphaX?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaX_gt?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaX_gte?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaX_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tauAlphaX_lt?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaX_lte?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaX_not?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaX_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tauAlphaY?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaY_gt?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaY_gte?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaY_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tauAlphaY_lt?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaY_lte?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaY_not?: InputMaybe<Scalars['BigDecimal']>;
    tauAlphaY_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tauBetaX?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaX_gt?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaX_gte?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaX_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tauBetaX_lt?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaX_lte?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaX_not?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaX_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tauBetaY?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaY_gt?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaY_gte?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaY_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tauBetaY_lt?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaY_lte?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaY_not?: InputMaybe<Scalars['BigDecimal']>;
    tauBetaY_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tokensList?: InputMaybe<Array<Scalars['Bytes']>>;
    tokensList_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    tokensList_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    tokensList_not?: InputMaybe<Array<Scalars['Bytes']>>;
    tokensList_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    tokensList_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    tokens_?: InputMaybe<PoolToken_Filter>;
    totalAumFeeCollectedInBPT?: InputMaybe<Scalars['BigDecimal']>;
    totalAumFeeCollectedInBPT_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalAumFeeCollectedInBPT_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalAumFeeCollectedInBPT_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalAumFeeCollectedInBPT_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalAumFeeCollectedInBPT_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalAumFeeCollectedInBPT_not?: InputMaybe<Scalars['BigDecimal']>;
    totalAumFeeCollectedInBPT_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolFeePaidInBPT?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolFeePaidInBPT_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolFeePaidInBPT_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolFeePaidInBPT_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolFeePaidInBPT_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolFeePaidInBPT_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolFeePaidInBPT_not?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolFeePaidInBPT_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalShares?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalShares_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_not?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalWeight?: InputMaybe<Scalars['BigDecimal']>;
    totalWeight_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalWeight_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalWeight_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalWeight_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalWeight_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalWeight_not?: InputMaybe<Scalars['BigDecimal']>;
    totalWeight_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tx?: InputMaybe<Scalars['Bytes']>;
    tx_contains?: InputMaybe<Scalars['Bytes']>;
    tx_gt?: InputMaybe<Scalars['Bytes']>;
    tx_gte?: InputMaybe<Scalars['Bytes']>;
    tx_in?: InputMaybe<Array<Scalars['Bytes']>>;
    tx_lt?: InputMaybe<Scalars['Bytes']>;
    tx_lte?: InputMaybe<Scalars['Bytes']>;
    tx_not?: InputMaybe<Scalars['Bytes']>;
    tx_not_contains?: InputMaybe<Scalars['Bytes']>;
    tx_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    u?: InputMaybe<Scalars['BigDecimal']>;
    u_gt?: InputMaybe<Scalars['BigDecimal']>;
    u_gte?: InputMaybe<Scalars['BigDecimal']>;
    u_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    u_lt?: InputMaybe<Scalars['BigDecimal']>;
    u_lte?: InputMaybe<Scalars['BigDecimal']>;
    u_not?: InputMaybe<Scalars['BigDecimal']>;
    u_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    unitSeconds?: InputMaybe<Scalars['BigInt']>;
    unitSeconds_gt?: InputMaybe<Scalars['BigInt']>;
    unitSeconds_gte?: InputMaybe<Scalars['BigInt']>;
    unitSeconds_in?: InputMaybe<Array<Scalars['BigInt']>>;
    unitSeconds_lt?: InputMaybe<Scalars['BigInt']>;
    unitSeconds_lte?: InputMaybe<Scalars['BigInt']>;
    unitSeconds_not?: InputMaybe<Scalars['BigInt']>;
    unitSeconds_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    upperTarget?: InputMaybe<Scalars['BigDecimal']>;
    upperTarget_gt?: InputMaybe<Scalars['BigDecimal']>;
    upperTarget_gte?: InputMaybe<Scalars['BigDecimal']>;
    upperTarget_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    upperTarget_lt?: InputMaybe<Scalars['BigDecimal']>;
    upperTarget_lte?: InputMaybe<Scalars['BigDecimal']>;
    upperTarget_not?: InputMaybe<Scalars['BigDecimal']>;
    upperTarget_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    v?: InputMaybe<Scalars['BigDecimal']>;
    v_gt?: InputMaybe<Scalars['BigDecimal']>;
    v_gte?: InputMaybe<Scalars['BigDecimal']>;
    v_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    v_lt?: InputMaybe<Scalars['BigDecimal']>;
    v_lte?: InputMaybe<Scalars['BigDecimal']>;
    v_not?: InputMaybe<Scalars['BigDecimal']>;
    v_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    vaultID?: InputMaybe<Scalars['String']>;
    vaultID_?: InputMaybe<Balancer_Filter>;
    vaultID_contains?: InputMaybe<Scalars['String']>;
    vaultID_contains_nocase?: InputMaybe<Scalars['String']>;
    vaultID_ends_with?: InputMaybe<Scalars['String']>;
    vaultID_ends_with_nocase?: InputMaybe<Scalars['String']>;
    vaultID_gt?: InputMaybe<Scalars['String']>;
    vaultID_gte?: InputMaybe<Scalars['String']>;
    vaultID_in?: InputMaybe<Array<Scalars['String']>>;
    vaultID_lt?: InputMaybe<Scalars['String']>;
    vaultID_lte?: InputMaybe<Scalars['String']>;
    vaultID_not?: InputMaybe<Scalars['String']>;
    vaultID_not_contains?: InputMaybe<Scalars['String']>;
    vaultID_not_contains_nocase?: InputMaybe<Scalars['String']>;
    vaultID_not_ends_with?: InputMaybe<Scalars['String']>;
    vaultID_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    vaultID_not_in?: InputMaybe<Array<Scalars['String']>>;
    vaultID_not_starts_with?: InputMaybe<Scalars['String']>;
    vaultID_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    vaultID_starts_with?: InputMaybe<Scalars['String']>;
    vaultID_starts_with_nocase?: InputMaybe<Scalars['String']>;
    w?: InputMaybe<Scalars['BigDecimal']>;
    w_gt?: InputMaybe<Scalars['BigDecimal']>;
    w_gte?: InputMaybe<Scalars['BigDecimal']>;
    w_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    w_lt?: InputMaybe<Scalars['BigDecimal']>;
    w_lte?: InputMaybe<Scalars['BigDecimal']>;
    w_not?: InputMaybe<Scalars['BigDecimal']>;
    w_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    wrappedIndex?: InputMaybe<Scalars['Int']>;
    wrappedIndex_gt?: InputMaybe<Scalars['Int']>;
    wrappedIndex_gte?: InputMaybe<Scalars['Int']>;
    wrappedIndex_in?: InputMaybe<Array<Scalars['Int']>>;
    wrappedIndex_lt?: InputMaybe<Scalars['Int']>;
    wrappedIndex_lte?: InputMaybe<Scalars['Int']>;
    wrappedIndex_not?: InputMaybe<Scalars['Int']>;
    wrappedIndex_not_in?: InputMaybe<Array<Scalars['Int']>>;
    z?: InputMaybe<Scalars['BigDecimal']>;
    z_gt?: InputMaybe<Scalars['BigDecimal']>;
    z_gte?: InputMaybe<Scalars['BigDecimal']>;
    z_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    z_lt?: InputMaybe<Scalars['BigDecimal']>;
    z_lte?: InputMaybe<Scalars['BigDecimal']>;
    z_not?: InputMaybe<Scalars['BigDecimal']>;
    z_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum Pool_OrderBy {
    Address = 'address',
    Alpha = 'alpha',
    Amp = 'amp',
    AmpUpdates = 'ampUpdates',
    BaseToken = 'baseToken',
    Beta = 'beta',
    C = 'c',
    CreateTime = 'createTime',
    DSq = 'dSq',
    Delta = 'delta',
    Epsilon = 'epsilon',
    ExpiryTime = 'expiryTime',
    Factory = 'factory',
    HoldersCount = 'holdersCount',
    Id = 'id',
    IsInRecoveryMode = 'isInRecoveryMode',
    IsPaused = 'isPaused',
    JoinExitEnabled = 'joinExitEnabled',
    JoinsExits = 'joinsExits',
    Lambda = 'lambda',
    LastJoinExitAmp = 'lastJoinExitAmp',
    LastPostJoinExitInvariant = 'lastPostJoinExitInvariant',
    LatestAmpUpdate = 'latestAmpUpdate',
    LatestAmpUpdateEndAmp = 'latestAmpUpdate__endAmp',
    LatestAmpUpdateEndTimestamp = 'latestAmpUpdate__endTimestamp',
    LatestAmpUpdateId = 'latestAmpUpdate__id',
    LatestAmpUpdateScheduledTimestamp = 'latestAmpUpdate__scheduledTimestamp',
    LatestAmpUpdateStartAmp = 'latestAmpUpdate__startAmp',
    LatestAmpUpdateStartTimestamp = 'latestAmpUpdate__startTimestamp',
    LowerTarget = 'lowerTarget',
    MainIndex = 'mainIndex',
    ManagementAumFee = 'managementAumFee',
    ManagementFee = 'managementFee',
    MustAllowlistLPs = 'mustAllowlistLPs',
    Name = 'name',
    OracleEnabled = 'oracleEnabled',
    Owner = 'owner',
    PoolType = 'poolType',
    PoolTypeVersion = 'poolTypeVersion',
    PriceRateProviders = 'priceRateProviders',
    PrincipalToken = 'principalToken',
    ProtocolAumFeeCache = 'protocolAumFeeCache',
    ProtocolId = 'protocolId',
    ProtocolIdData = 'protocolIdData',
    ProtocolIdDataId = 'protocolIdData__id',
    ProtocolIdDataName = 'protocolIdData__name',
    ProtocolSwapFeeCache = 'protocolSwapFeeCache',
    ProtocolYieldFeeCache = 'protocolYieldFeeCache',
    Root3Alpha = 'root3Alpha',
    S = 's',
    Shares = 'shares',
    SqrtAlpha = 'sqrtAlpha',
    SqrtBeta = 'sqrtBeta',
    StrategyType = 'strategyType',
    SwapEnabled = 'swapEnabled',
    SwapEnabledCurationSignal = 'swapEnabledCurationSignal',
    SwapEnabledInternal = 'swapEnabledInternal',
    SwapFee = 'swapFee',
    Swaps = 'swaps',
    SwapsCount = 'swapsCount',
    Symbol = 'symbol',
    TauAlphaX = 'tauAlphaX',
    TauAlphaY = 'tauAlphaY',
    TauBetaX = 'tauBetaX',
    TauBetaY = 'tauBetaY',
    Tokens = 'tokens',
    TokensList = 'tokensList',
    TotalAumFeeCollectedInBpt = 'totalAumFeeCollectedInBPT',
    TotalProtocolFeePaidInBpt = 'totalProtocolFeePaidInBPT',
    TotalShares = 'totalShares',
    TotalWeight = 'totalWeight',
    Tx = 'tx',
    U = 'u',
    UnitSeconds = 'unitSeconds',
    UpperTarget = 'upperTarget',
    V = 'v',
    VaultId = 'vaultID',
    VaultIdId = 'vaultID__id',
    VaultIdPoolCount = 'vaultID__poolCount',
    VaultIdProtocolFeesCollector = 'vaultID__protocolFeesCollector',
    W = 'w',
    WrappedIndex = 'wrappedIndex',
    Z = 'z',
}

export type PriceRateProvider = {
    __typename?: 'PriceRateProvider';
    address: Scalars['Bytes'];
    cacheDuration?: Maybe<Scalars['Int']>;
    cacheExpiry?: Maybe<Scalars['Int']>;
    id: Scalars['ID'];
    lastCached?: Maybe<Scalars['Int']>;
    poolId: Pool;
    rate?: Maybe<Scalars['BigDecimal']>;
    token: PoolToken;
};

export type PriceRateProvider_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    address?: InputMaybe<Scalars['Bytes']>;
    address_contains?: InputMaybe<Scalars['Bytes']>;
    address_gt?: InputMaybe<Scalars['Bytes']>;
    address_gte?: InputMaybe<Scalars['Bytes']>;
    address_in?: InputMaybe<Array<Scalars['Bytes']>>;
    address_lt?: InputMaybe<Scalars['Bytes']>;
    address_lte?: InputMaybe<Scalars['Bytes']>;
    address_not?: InputMaybe<Scalars['Bytes']>;
    address_not_contains?: InputMaybe<Scalars['Bytes']>;
    address_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    and?: InputMaybe<Array<InputMaybe<PriceRateProvider_Filter>>>;
    cacheDuration?: InputMaybe<Scalars['Int']>;
    cacheDuration_gt?: InputMaybe<Scalars['Int']>;
    cacheDuration_gte?: InputMaybe<Scalars['Int']>;
    cacheDuration_in?: InputMaybe<Array<Scalars['Int']>>;
    cacheDuration_lt?: InputMaybe<Scalars['Int']>;
    cacheDuration_lte?: InputMaybe<Scalars['Int']>;
    cacheDuration_not?: InputMaybe<Scalars['Int']>;
    cacheDuration_not_in?: InputMaybe<Array<Scalars['Int']>>;
    cacheExpiry?: InputMaybe<Scalars['Int']>;
    cacheExpiry_gt?: InputMaybe<Scalars['Int']>;
    cacheExpiry_gte?: InputMaybe<Scalars['Int']>;
    cacheExpiry_in?: InputMaybe<Array<Scalars['Int']>>;
    cacheExpiry_lt?: InputMaybe<Scalars['Int']>;
    cacheExpiry_lte?: InputMaybe<Scalars['Int']>;
    cacheExpiry_not?: InputMaybe<Scalars['Int']>;
    cacheExpiry_not_in?: InputMaybe<Array<Scalars['Int']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    lastCached?: InputMaybe<Scalars['Int']>;
    lastCached_gt?: InputMaybe<Scalars['Int']>;
    lastCached_gte?: InputMaybe<Scalars['Int']>;
    lastCached_in?: InputMaybe<Array<Scalars['Int']>>;
    lastCached_lt?: InputMaybe<Scalars['Int']>;
    lastCached_lte?: InputMaybe<Scalars['Int']>;
    lastCached_not?: InputMaybe<Scalars['Int']>;
    lastCached_not_in?: InputMaybe<Array<Scalars['Int']>>;
    or?: InputMaybe<Array<InputMaybe<PriceRateProvider_Filter>>>;
    poolId?: InputMaybe<Scalars['String']>;
    poolId_?: InputMaybe<Pool_Filter>;
    poolId_contains?: InputMaybe<Scalars['String']>;
    poolId_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_ends_with?: InputMaybe<Scalars['String']>;
    poolId_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_gt?: InputMaybe<Scalars['String']>;
    poolId_gte?: InputMaybe<Scalars['String']>;
    poolId_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_lt?: InputMaybe<Scalars['String']>;
    poolId_lte?: InputMaybe<Scalars['String']>;
    poolId_not?: InputMaybe<Scalars['String']>;
    poolId_not_contains?: InputMaybe<Scalars['String']>;
    poolId_not_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: InputMaybe<Scalars['String']>;
    poolId_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_starts_with?: InputMaybe<Scalars['String']>;
    poolId_starts_with_nocase?: InputMaybe<Scalars['String']>;
    rate?: InputMaybe<Scalars['BigDecimal']>;
    rate_gt?: InputMaybe<Scalars['BigDecimal']>;
    rate_gte?: InputMaybe<Scalars['BigDecimal']>;
    rate_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    rate_lt?: InputMaybe<Scalars['BigDecimal']>;
    rate_lte?: InputMaybe<Scalars['BigDecimal']>;
    rate_not?: InputMaybe<Scalars['BigDecimal']>;
    rate_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    token?: InputMaybe<Scalars['String']>;
    token_?: InputMaybe<PoolToken_Filter>;
    token_contains?: InputMaybe<Scalars['String']>;
    token_contains_nocase?: InputMaybe<Scalars['String']>;
    token_ends_with?: InputMaybe<Scalars['String']>;
    token_ends_with_nocase?: InputMaybe<Scalars['String']>;
    token_gt?: InputMaybe<Scalars['String']>;
    token_gte?: InputMaybe<Scalars['String']>;
    token_in?: InputMaybe<Array<Scalars['String']>>;
    token_lt?: InputMaybe<Scalars['String']>;
    token_lte?: InputMaybe<Scalars['String']>;
    token_not?: InputMaybe<Scalars['String']>;
    token_not_contains?: InputMaybe<Scalars['String']>;
    token_not_contains_nocase?: InputMaybe<Scalars['String']>;
    token_not_ends_with?: InputMaybe<Scalars['String']>;
    token_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    token_not_in?: InputMaybe<Array<Scalars['String']>>;
    token_not_starts_with?: InputMaybe<Scalars['String']>;
    token_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    token_starts_with?: InputMaybe<Scalars['String']>;
    token_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum PriceRateProvider_OrderBy {
    Address = 'address',
    CacheDuration = 'cacheDuration',
    CacheExpiry = 'cacheExpiry',
    Id = 'id',
    LastCached = 'lastCached',
    PoolId = 'poolId',
    PoolIdAddress = 'poolId__address',
    PoolIdAlpha = 'poolId__alpha',
    PoolIdAmp = 'poolId__amp',
    PoolIdBaseToken = 'poolId__baseToken',
    PoolIdBeta = 'poolId__beta',
    PoolIdC = 'poolId__c',
    PoolIdCreateTime = 'poolId__createTime',
    PoolIdDSq = 'poolId__dSq',
    PoolIdDelta = 'poolId__delta',
    PoolIdEpsilon = 'poolId__epsilon',
    PoolIdExpiryTime = 'poolId__expiryTime',
    PoolIdFactory = 'poolId__factory',
    PoolIdHoldersCount = 'poolId__holdersCount',
    PoolIdId = 'poolId__id',
    PoolIdIsInRecoveryMode = 'poolId__isInRecoveryMode',
    PoolIdIsPaused = 'poolId__isPaused',
    PoolIdJoinExitEnabled = 'poolId__joinExitEnabled',
    PoolIdLambda = 'poolId__lambda',
    PoolIdLastJoinExitAmp = 'poolId__lastJoinExitAmp',
    PoolIdLastPostJoinExitInvariant = 'poolId__lastPostJoinExitInvariant',
    PoolIdLowerTarget = 'poolId__lowerTarget',
    PoolIdMainIndex = 'poolId__mainIndex',
    PoolIdManagementAumFee = 'poolId__managementAumFee',
    PoolIdManagementFee = 'poolId__managementFee',
    PoolIdMustAllowlistLPs = 'poolId__mustAllowlistLPs',
    PoolIdName = 'poolId__name',
    PoolIdOracleEnabled = 'poolId__oracleEnabled',
    PoolIdOwner = 'poolId__owner',
    PoolIdPoolType = 'poolId__poolType',
    PoolIdPoolTypeVersion = 'poolId__poolTypeVersion',
    PoolIdPrincipalToken = 'poolId__principalToken',
    PoolIdProtocolAumFeeCache = 'poolId__protocolAumFeeCache',
    PoolIdProtocolId = 'poolId__protocolId',
    PoolIdProtocolSwapFeeCache = 'poolId__protocolSwapFeeCache',
    PoolIdProtocolYieldFeeCache = 'poolId__protocolYieldFeeCache',
    PoolIdRoot3Alpha = 'poolId__root3Alpha',
    PoolIdS = 'poolId__s',
    PoolIdSqrtAlpha = 'poolId__sqrtAlpha',
    PoolIdSqrtBeta = 'poolId__sqrtBeta',
    PoolIdStrategyType = 'poolId__strategyType',
    PoolIdSwapEnabled = 'poolId__swapEnabled',
    PoolIdSwapEnabledCurationSignal = 'poolId__swapEnabledCurationSignal',
    PoolIdSwapEnabledInternal = 'poolId__swapEnabledInternal',
    PoolIdSwapFee = 'poolId__swapFee',
    PoolIdSwapsCount = 'poolId__swapsCount',
    PoolIdSymbol = 'poolId__symbol',
    PoolIdTauAlphaX = 'poolId__tauAlphaX',
    PoolIdTauAlphaY = 'poolId__tauAlphaY',
    PoolIdTauBetaX = 'poolId__tauBetaX',
    PoolIdTauBetaY = 'poolId__tauBetaY',
    PoolIdTotalAumFeeCollectedInBpt = 'poolId__totalAumFeeCollectedInBPT',
    PoolIdTotalProtocolFeePaidInBpt = 'poolId__totalProtocolFeePaidInBPT',
    PoolIdTotalShares = 'poolId__totalShares',
    PoolIdTotalWeight = 'poolId__totalWeight',
    PoolIdTx = 'poolId__tx',
    PoolIdU = 'poolId__u',
    PoolIdUnitSeconds = 'poolId__unitSeconds',
    PoolIdUpperTarget = 'poolId__upperTarget',
    PoolIdV = 'poolId__v',
    PoolIdW = 'poolId__w',
    PoolIdWrappedIndex = 'poolId__wrappedIndex',
    PoolIdZ = 'poolId__z',
    Rate = 'rate',
    Token = 'token',
    TokenAddress = 'token__address',
    TokenBalance = 'token__balance',
    TokenDecimals = 'token__decimals',
    TokenId = 'token__id',
    TokenIndex = 'token__index',
    TokenIsExemptFromYieldProtocolFee = 'token__isExemptFromYieldProtocolFee',
    TokenName = 'token__name',
    TokenOldPriceRate = 'token__oldPriceRate',
    TokenPaidProtocolFees = 'token__paidProtocolFees',
    TokenPriceRate = 'token__priceRate',
    TokenSymbol = 'token__symbol',
    TokenWeight = 'token__weight',
}

export type ProtocolIdData = {
    __typename?: 'ProtocolIdData';
    id: Scalars['ID'];
    name: Scalars['String'];
};

export type ProtocolIdData_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<ProtocolIdData_Filter>>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    name?: InputMaybe<Scalars['String']>;
    name_contains?: InputMaybe<Scalars['String']>;
    name_contains_nocase?: InputMaybe<Scalars['String']>;
    name_ends_with?: InputMaybe<Scalars['String']>;
    name_ends_with_nocase?: InputMaybe<Scalars['String']>;
    name_gt?: InputMaybe<Scalars['String']>;
    name_gte?: InputMaybe<Scalars['String']>;
    name_in?: InputMaybe<Array<Scalars['String']>>;
    name_lt?: InputMaybe<Scalars['String']>;
    name_lte?: InputMaybe<Scalars['String']>;
    name_not?: InputMaybe<Scalars['String']>;
    name_not_contains?: InputMaybe<Scalars['String']>;
    name_not_contains_nocase?: InputMaybe<Scalars['String']>;
    name_not_ends_with?: InputMaybe<Scalars['String']>;
    name_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    name_not_in?: InputMaybe<Array<Scalars['String']>>;
    name_not_starts_with?: InputMaybe<Scalars['String']>;
    name_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    name_starts_with?: InputMaybe<Scalars['String']>;
    name_starts_with_nocase?: InputMaybe<Scalars['String']>;
    or?: InputMaybe<Array<InputMaybe<ProtocolIdData_Filter>>>;
};

export enum ProtocolIdData_OrderBy {
    Id = 'id',
    Name = 'name',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    ampUpdate?: Maybe<AmpUpdate>;
    ampUpdates: Array<AmpUpdate>;
    balancer?: Maybe<Balancer>;
    balancers: Array<Balancer>;
    fxoracle?: Maybe<FxOracle>;
    fxoracles: Array<FxOracle>;
    joinExit?: Maybe<JoinExit>;
    joinExits: Array<JoinExit>;
    pool?: Maybe<Pool>;
    poolContract?: Maybe<PoolContract>;
    poolContracts: Array<PoolContract>;
    poolShare?: Maybe<PoolShare>;
    poolShares: Array<PoolShare>;
    poolToken?: Maybe<PoolToken>;
    poolTokens: Array<PoolToken>;
    pools: Array<Pool>;
    priceRateProvider?: Maybe<PriceRateProvider>;
    priceRateProviders: Array<PriceRateProvider>;
    protocolIdData?: Maybe<ProtocolIdData>;
    protocolIdDatas: Array<ProtocolIdData>;
    swap?: Maybe<Swap>;
    swaps: Array<Swap>;
    token?: Maybe<Token>;
    tokens: Array<Token>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryAmpUpdateArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryAmpUpdatesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<AmpUpdate_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<AmpUpdate_Filter>;
};

export type QueryBalancerArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBalancersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Balancer_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Balancer_Filter>;
};

export type QueryFxoracleArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryFxoraclesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<FxOracle_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<FxOracle_Filter>;
};

export type QueryJoinExitArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryJoinExitsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<JoinExit_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<JoinExit_Filter>;
};

export type QueryPoolArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolContractArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolContractsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolContract_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolContract_Filter>;
};

export type QueryPoolShareArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolSharesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolShare_Filter>;
};

export type QueryPoolTokenArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolTokensArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolToken_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolToken_Filter>;
};

export type QueryPoolsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Pool_Filter>;
};

export type QueryPriceRateProviderArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPriceRateProvidersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PriceRateProvider_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PriceRateProvider_Filter>;
};

export type QueryProtocolIdDataArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryProtocolIdDatasArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<ProtocolIdData_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<ProtocolIdData_Filter>;
};

export type QuerySwapArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QuerySwapsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Swap_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Swap_Filter>;
};

export type QueryTokenArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTokensArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Token_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Token_Filter>;
};

export type Swap = {
    __typename?: 'Swap';
    block?: Maybe<Scalars['BigInt']>;
    caller: Scalars['Bytes'];
    id: Scalars['ID'];
    poolId: Pool;
    timestamp: Scalars['Int'];
    tokenAmountIn: Scalars['BigDecimal'];
    tokenAmountOut: Scalars['BigDecimal'];
    tokenIn: Scalars['Bytes'];
    tokenInSym: Scalars['String'];
    tokenOut: Scalars['Bytes'];
    tokenOutSym: Scalars['String'];
    tx: Scalars['Bytes'];
    userAddress: Scalars['Bytes'];
};

export type Swap_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<Swap_Filter>>>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    caller?: InputMaybe<Scalars['Bytes']>;
    caller_contains?: InputMaybe<Scalars['Bytes']>;
    caller_gt?: InputMaybe<Scalars['Bytes']>;
    caller_gte?: InputMaybe<Scalars['Bytes']>;
    caller_in?: InputMaybe<Array<Scalars['Bytes']>>;
    caller_lt?: InputMaybe<Scalars['Bytes']>;
    caller_lte?: InputMaybe<Scalars['Bytes']>;
    caller_not?: InputMaybe<Scalars['Bytes']>;
    caller_not_contains?: InputMaybe<Scalars['Bytes']>;
    caller_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<Swap_Filter>>>;
    poolId?: InputMaybe<Scalars['String']>;
    poolId_?: InputMaybe<Pool_Filter>;
    poolId_contains?: InputMaybe<Scalars['String']>;
    poolId_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_ends_with?: InputMaybe<Scalars['String']>;
    poolId_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_gt?: InputMaybe<Scalars['String']>;
    poolId_gte?: InputMaybe<Scalars['String']>;
    poolId_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_lt?: InputMaybe<Scalars['String']>;
    poolId_lte?: InputMaybe<Scalars['String']>;
    poolId_not?: InputMaybe<Scalars['String']>;
    poolId_not_contains?: InputMaybe<Scalars['String']>;
    poolId_not_contains_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with?: InputMaybe<Scalars['String']>;
    poolId_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_not_in?: InputMaybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: InputMaybe<Scalars['String']>;
    poolId_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    poolId_starts_with?: InputMaybe<Scalars['String']>;
    poolId_starts_with_nocase?: InputMaybe<Scalars['String']>;
    timestamp?: InputMaybe<Scalars['Int']>;
    timestamp_gt?: InputMaybe<Scalars['Int']>;
    timestamp_gte?: InputMaybe<Scalars['Int']>;
    timestamp_in?: InputMaybe<Array<Scalars['Int']>>;
    timestamp_lt?: InputMaybe<Scalars['Int']>;
    timestamp_lte?: InputMaybe<Scalars['Int']>;
    timestamp_not?: InputMaybe<Scalars['Int']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['Int']>>;
    tokenAmountIn?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountIn_gt?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountIn_gte?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountIn_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tokenAmountIn_lt?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountIn_lte?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountIn_not?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountIn_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tokenAmountOut?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountOut_gt?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountOut_gte?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountOut_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tokenAmountOut_lt?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountOut_lte?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountOut_not?: InputMaybe<Scalars['BigDecimal']>;
    tokenAmountOut_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    tokenIn?: InputMaybe<Scalars['Bytes']>;
    tokenInSym?: InputMaybe<Scalars['String']>;
    tokenInSym_contains?: InputMaybe<Scalars['String']>;
    tokenInSym_contains_nocase?: InputMaybe<Scalars['String']>;
    tokenInSym_ends_with?: InputMaybe<Scalars['String']>;
    tokenInSym_ends_with_nocase?: InputMaybe<Scalars['String']>;
    tokenInSym_gt?: InputMaybe<Scalars['String']>;
    tokenInSym_gte?: InputMaybe<Scalars['String']>;
    tokenInSym_in?: InputMaybe<Array<Scalars['String']>>;
    tokenInSym_lt?: InputMaybe<Scalars['String']>;
    tokenInSym_lte?: InputMaybe<Scalars['String']>;
    tokenInSym_not?: InputMaybe<Scalars['String']>;
    tokenInSym_not_contains?: InputMaybe<Scalars['String']>;
    tokenInSym_not_contains_nocase?: InputMaybe<Scalars['String']>;
    tokenInSym_not_ends_with?: InputMaybe<Scalars['String']>;
    tokenInSym_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    tokenInSym_not_in?: InputMaybe<Array<Scalars['String']>>;
    tokenInSym_not_starts_with?: InputMaybe<Scalars['String']>;
    tokenInSym_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    tokenInSym_starts_with?: InputMaybe<Scalars['String']>;
    tokenInSym_starts_with_nocase?: InputMaybe<Scalars['String']>;
    tokenIn_contains?: InputMaybe<Scalars['Bytes']>;
    tokenIn_gt?: InputMaybe<Scalars['Bytes']>;
    tokenIn_gte?: InputMaybe<Scalars['Bytes']>;
    tokenIn_in?: InputMaybe<Array<Scalars['Bytes']>>;
    tokenIn_lt?: InputMaybe<Scalars['Bytes']>;
    tokenIn_lte?: InputMaybe<Scalars['Bytes']>;
    tokenIn_not?: InputMaybe<Scalars['Bytes']>;
    tokenIn_not_contains?: InputMaybe<Scalars['Bytes']>;
    tokenIn_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    tokenOut?: InputMaybe<Scalars['Bytes']>;
    tokenOutSym?: InputMaybe<Scalars['String']>;
    tokenOutSym_contains?: InputMaybe<Scalars['String']>;
    tokenOutSym_contains_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSym_ends_with?: InputMaybe<Scalars['String']>;
    tokenOutSym_ends_with_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSym_gt?: InputMaybe<Scalars['String']>;
    tokenOutSym_gte?: InputMaybe<Scalars['String']>;
    tokenOutSym_in?: InputMaybe<Array<Scalars['String']>>;
    tokenOutSym_lt?: InputMaybe<Scalars['String']>;
    tokenOutSym_lte?: InputMaybe<Scalars['String']>;
    tokenOutSym_not?: InputMaybe<Scalars['String']>;
    tokenOutSym_not_contains?: InputMaybe<Scalars['String']>;
    tokenOutSym_not_contains_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSym_not_ends_with?: InputMaybe<Scalars['String']>;
    tokenOutSym_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSym_not_in?: InputMaybe<Array<Scalars['String']>>;
    tokenOutSym_not_starts_with?: InputMaybe<Scalars['String']>;
    tokenOutSym_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSym_starts_with?: InputMaybe<Scalars['String']>;
    tokenOutSym_starts_with_nocase?: InputMaybe<Scalars['String']>;
    tokenOut_contains?: InputMaybe<Scalars['Bytes']>;
    tokenOut_gt?: InputMaybe<Scalars['Bytes']>;
    tokenOut_gte?: InputMaybe<Scalars['Bytes']>;
    tokenOut_in?: InputMaybe<Array<Scalars['Bytes']>>;
    tokenOut_lt?: InputMaybe<Scalars['Bytes']>;
    tokenOut_lte?: InputMaybe<Scalars['Bytes']>;
    tokenOut_not?: InputMaybe<Scalars['Bytes']>;
    tokenOut_not_contains?: InputMaybe<Scalars['Bytes']>;
    tokenOut_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    tx?: InputMaybe<Scalars['Bytes']>;
    tx_contains?: InputMaybe<Scalars['Bytes']>;
    tx_gt?: InputMaybe<Scalars['Bytes']>;
    tx_gte?: InputMaybe<Scalars['Bytes']>;
    tx_in?: InputMaybe<Array<Scalars['Bytes']>>;
    tx_lt?: InputMaybe<Scalars['Bytes']>;
    tx_lte?: InputMaybe<Scalars['Bytes']>;
    tx_not?: InputMaybe<Scalars['Bytes']>;
    tx_not_contains?: InputMaybe<Scalars['Bytes']>;
    tx_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    userAddress?: InputMaybe<Scalars['Bytes']>;
    userAddress_contains?: InputMaybe<Scalars['Bytes']>;
    userAddress_gt?: InputMaybe<Scalars['Bytes']>;
    userAddress_gte?: InputMaybe<Scalars['Bytes']>;
    userAddress_in?: InputMaybe<Array<Scalars['Bytes']>>;
    userAddress_lt?: InputMaybe<Scalars['Bytes']>;
    userAddress_lte?: InputMaybe<Scalars['Bytes']>;
    userAddress_not?: InputMaybe<Scalars['Bytes']>;
    userAddress_not_contains?: InputMaybe<Scalars['Bytes']>;
    userAddress_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum Swap_OrderBy {
    Block = 'block',
    Caller = 'caller',
    Id = 'id',
    PoolId = 'poolId',
    PoolIdAddress = 'poolId__address',
    PoolIdAlpha = 'poolId__alpha',
    PoolIdAmp = 'poolId__amp',
    PoolIdBaseToken = 'poolId__baseToken',
    PoolIdBeta = 'poolId__beta',
    PoolIdC = 'poolId__c',
    PoolIdCreateTime = 'poolId__createTime',
    PoolIdDSq = 'poolId__dSq',
    PoolIdDelta = 'poolId__delta',
    PoolIdEpsilon = 'poolId__epsilon',
    PoolIdExpiryTime = 'poolId__expiryTime',
    PoolIdFactory = 'poolId__factory',
    PoolIdHoldersCount = 'poolId__holdersCount',
    PoolIdId = 'poolId__id',
    PoolIdIsInRecoveryMode = 'poolId__isInRecoveryMode',
    PoolIdIsPaused = 'poolId__isPaused',
    PoolIdJoinExitEnabled = 'poolId__joinExitEnabled',
    PoolIdLambda = 'poolId__lambda',
    PoolIdLastJoinExitAmp = 'poolId__lastJoinExitAmp',
    PoolIdLastPostJoinExitInvariant = 'poolId__lastPostJoinExitInvariant',
    PoolIdLowerTarget = 'poolId__lowerTarget',
    PoolIdMainIndex = 'poolId__mainIndex',
    PoolIdManagementAumFee = 'poolId__managementAumFee',
    PoolIdManagementFee = 'poolId__managementFee',
    PoolIdMustAllowlistLPs = 'poolId__mustAllowlistLPs',
    PoolIdName = 'poolId__name',
    PoolIdOracleEnabled = 'poolId__oracleEnabled',
    PoolIdOwner = 'poolId__owner',
    PoolIdPoolType = 'poolId__poolType',
    PoolIdPoolTypeVersion = 'poolId__poolTypeVersion',
    PoolIdPrincipalToken = 'poolId__principalToken',
    PoolIdProtocolAumFeeCache = 'poolId__protocolAumFeeCache',
    PoolIdProtocolId = 'poolId__protocolId',
    PoolIdProtocolSwapFeeCache = 'poolId__protocolSwapFeeCache',
    PoolIdProtocolYieldFeeCache = 'poolId__protocolYieldFeeCache',
    PoolIdRoot3Alpha = 'poolId__root3Alpha',
    PoolIdS = 'poolId__s',
    PoolIdSqrtAlpha = 'poolId__sqrtAlpha',
    PoolIdSqrtBeta = 'poolId__sqrtBeta',
    PoolIdStrategyType = 'poolId__strategyType',
    PoolIdSwapEnabled = 'poolId__swapEnabled',
    PoolIdSwapEnabledCurationSignal = 'poolId__swapEnabledCurationSignal',
    PoolIdSwapEnabledInternal = 'poolId__swapEnabledInternal',
    PoolIdSwapFee = 'poolId__swapFee',
    PoolIdSwapsCount = 'poolId__swapsCount',
    PoolIdSymbol = 'poolId__symbol',
    PoolIdTauAlphaX = 'poolId__tauAlphaX',
    PoolIdTauAlphaY = 'poolId__tauAlphaY',
    PoolIdTauBetaX = 'poolId__tauBetaX',
    PoolIdTauBetaY = 'poolId__tauBetaY',
    PoolIdTotalAumFeeCollectedInBpt = 'poolId__totalAumFeeCollectedInBPT',
    PoolIdTotalProtocolFeePaidInBpt = 'poolId__totalProtocolFeePaidInBPT',
    PoolIdTotalShares = 'poolId__totalShares',
    PoolIdTotalWeight = 'poolId__totalWeight',
    PoolIdTx = 'poolId__tx',
    PoolIdU = 'poolId__u',
    PoolIdUnitSeconds = 'poolId__unitSeconds',
    PoolIdUpperTarget = 'poolId__upperTarget',
    PoolIdV = 'poolId__v',
    PoolIdW = 'poolId__w',
    PoolIdWrappedIndex = 'poolId__wrappedIndex',
    PoolIdZ = 'poolId__z',
    Timestamp = 'timestamp',
    TokenAmountIn = 'tokenAmountIn',
    TokenAmountOut = 'tokenAmountOut',
    TokenIn = 'tokenIn',
    TokenInSym = 'tokenInSym',
    TokenOut = 'tokenOut',
    TokenOutSym = 'tokenOutSym',
    Tx = 'tx',
    UserAddress = 'userAddress',
}

export type Token = {
    __typename?: 'Token';
    address: Scalars['String'];
    decimals: Scalars['Int'];
    fxOracleDecimals?: Maybe<Scalars['Int']>;
    id: Scalars['ID'];
    latestFXPrice?: Maybe<Scalars['BigDecimal']>;
    name?: Maybe<Scalars['String']>;
    pool?: Maybe<Pool>;
    symbol?: Maybe<Scalars['String']>;
    totalBalanceNotional: Scalars['BigDecimal'];
};

export type Token_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    address?: InputMaybe<Scalars['String']>;
    address_contains?: InputMaybe<Scalars['String']>;
    address_contains_nocase?: InputMaybe<Scalars['String']>;
    address_ends_with?: InputMaybe<Scalars['String']>;
    address_ends_with_nocase?: InputMaybe<Scalars['String']>;
    address_gt?: InputMaybe<Scalars['String']>;
    address_gte?: InputMaybe<Scalars['String']>;
    address_in?: InputMaybe<Array<Scalars['String']>>;
    address_lt?: InputMaybe<Scalars['String']>;
    address_lte?: InputMaybe<Scalars['String']>;
    address_not?: InputMaybe<Scalars['String']>;
    address_not_contains?: InputMaybe<Scalars['String']>;
    address_not_contains_nocase?: InputMaybe<Scalars['String']>;
    address_not_ends_with?: InputMaybe<Scalars['String']>;
    address_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    address_not_in?: InputMaybe<Array<Scalars['String']>>;
    address_not_starts_with?: InputMaybe<Scalars['String']>;
    address_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    address_starts_with?: InputMaybe<Scalars['String']>;
    address_starts_with_nocase?: InputMaybe<Scalars['String']>;
    and?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
    decimals?: InputMaybe<Scalars['Int']>;
    decimals_gt?: InputMaybe<Scalars['Int']>;
    decimals_gte?: InputMaybe<Scalars['Int']>;
    decimals_in?: InputMaybe<Array<Scalars['Int']>>;
    decimals_lt?: InputMaybe<Scalars['Int']>;
    decimals_lte?: InputMaybe<Scalars['Int']>;
    decimals_not?: InputMaybe<Scalars['Int']>;
    decimals_not_in?: InputMaybe<Array<Scalars['Int']>>;
    fxOracleDecimals?: InputMaybe<Scalars['Int']>;
    fxOracleDecimals_gt?: InputMaybe<Scalars['Int']>;
    fxOracleDecimals_gte?: InputMaybe<Scalars['Int']>;
    fxOracleDecimals_in?: InputMaybe<Array<Scalars['Int']>>;
    fxOracleDecimals_lt?: InputMaybe<Scalars['Int']>;
    fxOracleDecimals_lte?: InputMaybe<Scalars['Int']>;
    fxOracleDecimals_not?: InputMaybe<Scalars['Int']>;
    fxOracleDecimals_not_in?: InputMaybe<Array<Scalars['Int']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    latestFXPrice?: InputMaybe<Scalars['BigDecimal']>;
    latestFXPrice_gt?: InputMaybe<Scalars['BigDecimal']>;
    latestFXPrice_gte?: InputMaybe<Scalars['BigDecimal']>;
    latestFXPrice_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    latestFXPrice_lt?: InputMaybe<Scalars['BigDecimal']>;
    latestFXPrice_lte?: InputMaybe<Scalars['BigDecimal']>;
    latestFXPrice_not?: InputMaybe<Scalars['BigDecimal']>;
    latestFXPrice_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    name?: InputMaybe<Scalars['String']>;
    name_contains?: InputMaybe<Scalars['String']>;
    name_contains_nocase?: InputMaybe<Scalars['String']>;
    name_ends_with?: InputMaybe<Scalars['String']>;
    name_ends_with_nocase?: InputMaybe<Scalars['String']>;
    name_gt?: InputMaybe<Scalars['String']>;
    name_gte?: InputMaybe<Scalars['String']>;
    name_in?: InputMaybe<Array<Scalars['String']>>;
    name_lt?: InputMaybe<Scalars['String']>;
    name_lte?: InputMaybe<Scalars['String']>;
    name_not?: InputMaybe<Scalars['String']>;
    name_not_contains?: InputMaybe<Scalars['String']>;
    name_not_contains_nocase?: InputMaybe<Scalars['String']>;
    name_not_ends_with?: InputMaybe<Scalars['String']>;
    name_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    name_not_in?: InputMaybe<Array<Scalars['String']>>;
    name_not_starts_with?: InputMaybe<Scalars['String']>;
    name_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    name_starts_with?: InputMaybe<Scalars['String']>;
    name_starts_with_nocase?: InputMaybe<Scalars['String']>;
    or?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
    pool?: InputMaybe<Scalars['String']>;
    pool_?: InputMaybe<Pool_Filter>;
    pool_contains?: InputMaybe<Scalars['String']>;
    pool_contains_nocase?: InputMaybe<Scalars['String']>;
    pool_ends_with?: InputMaybe<Scalars['String']>;
    pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
    pool_gt?: InputMaybe<Scalars['String']>;
    pool_gte?: InputMaybe<Scalars['String']>;
    pool_in?: InputMaybe<Array<Scalars['String']>>;
    pool_lt?: InputMaybe<Scalars['String']>;
    pool_lte?: InputMaybe<Scalars['String']>;
    pool_not?: InputMaybe<Scalars['String']>;
    pool_not_contains?: InputMaybe<Scalars['String']>;
    pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
    pool_not_ends_with?: InputMaybe<Scalars['String']>;
    pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    pool_not_in?: InputMaybe<Array<Scalars['String']>>;
    pool_not_starts_with?: InputMaybe<Scalars['String']>;
    pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    pool_starts_with?: InputMaybe<Scalars['String']>;
    pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
    symbol?: InputMaybe<Scalars['String']>;
    symbol_contains?: InputMaybe<Scalars['String']>;
    symbol_contains_nocase?: InputMaybe<Scalars['String']>;
    symbol_ends_with?: InputMaybe<Scalars['String']>;
    symbol_ends_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_gt?: InputMaybe<Scalars['String']>;
    symbol_gte?: InputMaybe<Scalars['String']>;
    symbol_in?: InputMaybe<Array<Scalars['String']>>;
    symbol_lt?: InputMaybe<Scalars['String']>;
    symbol_lte?: InputMaybe<Scalars['String']>;
    symbol_not?: InputMaybe<Scalars['String']>;
    symbol_not_contains?: InputMaybe<Scalars['String']>;
    symbol_not_contains_nocase?: InputMaybe<Scalars['String']>;
    symbol_not_ends_with?: InputMaybe<Scalars['String']>;
    symbol_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_not_in?: InputMaybe<Array<Scalars['String']>>;
    symbol_not_starts_with?: InputMaybe<Scalars['String']>;
    symbol_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    symbol_starts_with?: InputMaybe<Scalars['String']>;
    symbol_starts_with_nocase?: InputMaybe<Scalars['String']>;
    totalBalanceNotional?: InputMaybe<Scalars['BigDecimal']>;
    totalBalanceNotional_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalBalanceNotional_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalBalanceNotional_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalBalanceNotional_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalBalanceNotional_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalBalanceNotional_not?: InputMaybe<Scalars['BigDecimal']>;
    totalBalanceNotional_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum Token_OrderBy {
    Address = 'address',
    Decimals = 'decimals',
    FxOracleDecimals = 'fxOracleDecimals',
    Id = 'id',
    LatestFxPrice = 'latestFXPrice',
    Name = 'name',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolAlpha = 'pool__alpha',
    PoolAmp = 'pool__amp',
    PoolBaseToken = 'pool__baseToken',
    PoolBeta = 'pool__beta',
    PoolC = 'pool__c',
    PoolCreateTime = 'pool__createTime',
    PoolDSq = 'pool__dSq',
    PoolDelta = 'pool__delta',
    PoolEpsilon = 'pool__epsilon',
    PoolExpiryTime = 'pool__expiryTime',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInRecoveryMode = 'pool__isInRecoveryMode',
    PoolIsPaused = 'pool__isPaused',
    PoolJoinExitEnabled = 'pool__joinExitEnabled',
    PoolLambda = 'pool__lambda',
    PoolLastJoinExitAmp = 'pool__lastJoinExitAmp',
    PoolLastPostJoinExitInvariant = 'pool__lastPostJoinExitInvariant',
    PoolLowerTarget = 'pool__lowerTarget',
    PoolMainIndex = 'pool__mainIndex',
    PoolManagementAumFee = 'pool__managementAumFee',
    PoolManagementFee = 'pool__managementFee',
    PoolMustAllowlistLPs = 'pool__mustAllowlistLPs',
    PoolName = 'pool__name',
    PoolOracleEnabled = 'pool__oracleEnabled',
    PoolOwner = 'pool__owner',
    PoolPoolType = 'pool__poolType',
    PoolPoolTypeVersion = 'pool__poolTypeVersion',
    PoolPrincipalToken = 'pool__principalToken',
    PoolProtocolAumFeeCache = 'pool__protocolAumFeeCache',
    PoolProtocolId = 'pool__protocolId',
    PoolProtocolSwapFeeCache = 'pool__protocolSwapFeeCache',
    PoolProtocolYieldFeeCache = 'pool__protocolYieldFeeCache',
    PoolRoot3Alpha = 'pool__root3Alpha',
    PoolS = 'pool__s',
    PoolSqrtAlpha = 'pool__sqrtAlpha',
    PoolSqrtBeta = 'pool__sqrtBeta',
    PoolStrategyType = 'pool__strategyType',
    PoolSwapEnabled = 'pool__swapEnabled',
    PoolSwapEnabledCurationSignal = 'pool__swapEnabledCurationSignal',
    PoolSwapEnabledInternal = 'pool__swapEnabledInternal',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTauAlphaX = 'pool__tauAlphaX',
    PoolTauAlphaY = 'pool__tauAlphaY',
    PoolTauBetaX = 'pool__tauBetaX',
    PoolTauBetaY = 'pool__tauBetaY',
    PoolTotalAumFeeCollectedInBpt = 'pool__totalAumFeeCollectedInBPT',
    PoolTotalProtocolFeePaidInBpt = 'pool__totalProtocolFeePaidInBPT',
    PoolTotalShares = 'pool__totalShares',
    PoolTotalWeight = 'pool__totalWeight',
    PoolTx = 'pool__tx',
    PoolU = 'pool__u',
    PoolUnitSeconds = 'pool__unitSeconds',
    PoolUpperTarget = 'pool__upperTarget',
    PoolV = 'pool__v',
    PoolW = 'pool__w',
    PoolWrappedIndex = 'pool__wrappedIndex',
    PoolZ = 'pool__z',
    Symbol = 'symbol',
    TotalBalanceNotional = 'totalBalanceNotional',
}

export type _Block_ = {
    __typename?: '_Block_';
    /** The hash of the block */
    hash?: Maybe<Scalars['Bytes']>;
    /** The block number */
    number: Scalars['Int'];
    /** The hash of the parent block */
    parentHash?: Maybe<Scalars['Bytes']>;
    /** Integer representation of the timestamp stored in blocks for the chain */
    timestamp?: Maybe<Scalars['Int']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
    __typename?: '_Meta_';
    /**
     * Information about a specific subgraph block. The hash of the block
     * will be null if the _meta field has a block constraint that asks for
     * a block number. It will be filled if the _meta field has no block constraint
     * and therefore asks for the latest  block
     *
     */
    block: _Block_;
    /** The deployment ID */
    deployment: Scalars['String'];
    /** If `true`, the subgraph encountered indexing errors at some past block */
    hasIndexingErrors: Scalars['Boolean'];
};

export enum _SubgraphErrorPolicy_ {
    /** Data will be returned even if the subgraph has indexing errors */
    Allow = 'allow',
    /** If the subgraph has indexing errors, data will be omitted. The default. */
    Deny = 'deny',
}

export type BalancerPoolSharesQueryVariables = Exact<{
    skip?: InputMaybe<Scalars['Int']>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    where?: InputMaybe<PoolShare_Filter>;
    block?: InputMaybe<Block_Height>;
}>;

export type BalancerPoolSharesQuery = {
    __typename?: 'Query';
    poolShares: Array<{
        __typename?: 'PoolShare';
        id: string;
        balance: string;
        poolId: { __typename?: 'Pool'; id: string };
    }>;
};

export type BalancerPoolShareFragment = {
    __typename?: 'PoolShare';
    id: string;
    balance: string;
    poolId: { __typename?: 'Pool'; id: string };
};

export type BalancerPoolFragment = {
    __typename?: 'Pool';
    id: string;
    address: string;
    poolType?: string | null;
    poolTypeVersion?: number | null;
    symbol?: string | null;
    name?: string | null;
    swapFee: string;
    totalShares: string;
    swapsCount: string;
    holdersCount: string;
    createTime: number;
    swapEnabled: boolean;
    tokensList: Array<string>;
    lowerTarget?: string | null;
    upperTarget?: string | null;
    mainIndex?: number | null;
    wrappedIndex?: number | null;
    factory?: string | null;
    expiryTime?: string | null;
    unitSeconds?: string | null;
    principalToken?: string | null;
    baseToken?: string | null;
    owner?: string | null;
    amp?: string | null;
    alpha?: string | null;
    beta?: string | null;
    sqrtAlpha?: string | null;
    sqrtBeta?: string | null;
    root3Alpha?: string | null;
    c?: string | null;
    s?: string | null;
    lambda?: string | null;
    tauAlphaX?: string | null;
    tauAlphaY?: string | null;
    tauBetaX?: string | null;
    tauBetaY?: string | null;
    u?: string | null;
    v?: string | null;
    w?: string | null;
    z?: string | null;
    dSq?: string | null;
    delta?: string | null;
    epsilon?: string | null;
    priceRateProviders?: Array<{
        __typename?: 'PriceRateProvider';
        address: string;
        token: { __typename?: 'PoolToken'; address: string };
    }> | null;
    tokens?: Array<{
        __typename?: 'PoolToken';
        id: string;
        symbol: string;
        name: string;
        decimals: number;
        address: string;
        balance: string;
        weight?: string | null;
        priceRate: string;
        isExemptFromYieldProtocolFee?: boolean | null;
        index: number;
        token: { __typename?: 'Token'; latestFXPrice?: string | null };
    }> | null;
};

export type BalancerPoolTokenFragment = {
    __typename?: 'PoolToken';
    id: string;
    symbol: string;
    name: string;
    decimals: number;
    address: string;
    balance: string;
    weight?: string | null;
    priceRate: string;
    isExemptFromYieldProtocolFee?: boolean | null;
    index: number;
    token: { __typename?: 'Token'; latestFXPrice?: string | null };
};

export type BalancerPoolsQueryVariables = Exact<{
    skip?: InputMaybe<Scalars['Int']>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    where?: InputMaybe<Pool_Filter>;
    block?: InputMaybe<Block_Height>;
}>;

export type BalancerPoolsQuery = {
    __typename?: 'Query';
    pools: Array<{
        __typename?: 'Pool';
        id: string;
        address: string;
        poolType?: string | null;
        poolTypeVersion?: number | null;
        symbol?: string | null;
        name?: string | null;
        swapFee: string;
        totalShares: string;
        swapsCount: string;
        holdersCount: string;
        createTime: number;
        swapEnabled: boolean;
        tokensList: Array<string>;
        lowerTarget?: string | null;
        upperTarget?: string | null;
        mainIndex?: number | null;
        wrappedIndex?: number | null;
        factory?: string | null;
        expiryTime?: string | null;
        unitSeconds?: string | null;
        principalToken?: string | null;
        baseToken?: string | null;
        owner?: string | null;
        amp?: string | null;
        alpha?: string | null;
        beta?: string | null;
        sqrtAlpha?: string | null;
        sqrtBeta?: string | null;
        root3Alpha?: string | null;
        c?: string | null;
        s?: string | null;
        lambda?: string | null;
        tauAlphaX?: string | null;
        tauAlphaY?: string | null;
        tauBetaX?: string | null;
        tauBetaY?: string | null;
        u?: string | null;
        v?: string | null;
        w?: string | null;
        z?: string | null;
        dSq?: string | null;
        delta?: string | null;
        epsilon?: string | null;
        priceRateProviders?: Array<{
            __typename?: 'PriceRateProvider';
            address: string;
            token: { __typename?: 'PoolToken'; address: string };
        }> | null;
        tokens?: Array<{
            __typename?: 'PoolToken';
            id: string;
            symbol: string;
            name: string;
            decimals: number;
            address: string;
            balance: string;
            weight?: string | null;
            priceRate: string;
            isExemptFromYieldProtocolFee?: boolean | null;
            index: number;
            token: { __typename?: 'Token'; latestFXPrice?: string | null };
        }> | null;
    }>;
};

export type BalancerPoolQueryVariables = Exact<{
    id: Scalars['ID'];
    block?: InputMaybe<Block_Height>;
}>;

export type BalancerPoolQuery = {
    __typename?: 'Query';
    pool?: {
        __typename?: 'Pool';
        id: string;
        address: string;
        poolType?: string | null;
        poolTypeVersion?: number | null;
        symbol?: string | null;
        name?: string | null;
        swapFee: string;
        totalShares: string;
        swapsCount: string;
        holdersCount: string;
        createTime: number;
        swapEnabled: boolean;
        tokensList: Array<string>;
        lowerTarget?: string | null;
        upperTarget?: string | null;
        mainIndex?: number | null;
        wrappedIndex?: number | null;
        factory?: string | null;
        expiryTime?: string | null;
        unitSeconds?: string | null;
        principalToken?: string | null;
        baseToken?: string | null;
        owner?: string | null;
        amp?: string | null;
        alpha?: string | null;
        beta?: string | null;
        sqrtAlpha?: string | null;
        sqrtBeta?: string | null;
        root3Alpha?: string | null;
        c?: string | null;
        s?: string | null;
        lambda?: string | null;
        tauAlphaX?: string | null;
        tauAlphaY?: string | null;
        tauBetaX?: string | null;
        tauBetaY?: string | null;
        u?: string | null;
        v?: string | null;
        w?: string | null;
        z?: string | null;
        dSq?: string | null;
        delta?: string | null;
        epsilon?: string | null;
        priceRateProviders?: Array<{
            __typename?: 'PriceRateProvider';
            address: string;
            token: { __typename?: 'PoolToken'; address: string };
        }> | null;
        tokens?: Array<{
            __typename?: 'PoolToken';
            id: string;
            symbol: string;
            name: string;
            decimals: number;
            address: string;
            balance: string;
            weight?: string | null;
            priceRate: string;
            isExemptFromYieldProtocolFee?: boolean | null;
            index: number;
            token: { __typename?: 'Token'; latestFXPrice?: string | null };
        }> | null;
    } | null;
};

export type BalancerJoinExitsQueryVariables = Exact<{
    skip?: InputMaybe<Scalars['Int']>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<JoinExit_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    where?: InputMaybe<JoinExit_Filter>;
    block?: InputMaybe<Block_Height>;
}>;

export type BalancerJoinExitsQuery = {
    __typename?: 'Query';
    joinExits: Array<{
        __typename?: 'JoinExit';
        amounts: Array<string>;
        id: string;
        sender: string;
        block?: string | null;
        timestamp: number;
        tx: string;
        type: InvestType;
        pool: { __typename?: 'Pool'; id: string; tokensList: Array<string> };
    }>;
};

export type BalancerJoinExitFragment = {
    __typename?: 'JoinExit';
    amounts: Array<string>;
    id: string;
    sender: string;
    block?: string | null;
    timestamp: number;
    tx: string;
    type: InvestType;
    pool: { __typename?: 'Pool'; id: string; tokensList: Array<string> };
};

export type BalancerSwapsQueryVariables = Exact<{
    skip?: InputMaybe<Scalars['Int']>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Swap_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    where?: InputMaybe<Swap_Filter>;
    block?: InputMaybe<Block_Height>;
}>;

export type BalancerSwapsQuery = {
    __typename?: 'Query';
    swaps: Array<{
        __typename?: 'Swap';
        id: string;
        caller: string;
        tokenIn: string;
        tokenInSym: string;
        tokenOut: string;
        tokenOutSym: string;
        tokenAmountIn: string;
        tokenAmountOut: string;
        userAddress: string;
        timestamp: number;
        tx: string;
        block?: string | null;
        poolId: {
            __typename?: 'Pool';
            id: string;
            swapFee: string;
            poolType?: string | null;
            tokens?: Array<{
                __typename?: 'PoolToken';
                token: { __typename?: 'Token'; address: string; latestFXPrice?: string | null };
            }> | null;
        };
    }>;
};

export type BalancerSwapFragment = {
    __typename?: 'Swap';
    id: string;
    caller: string;
    tokenIn: string;
    tokenInSym: string;
    tokenOut: string;
    tokenOutSym: string;
    tokenAmountIn: string;
    tokenAmountOut: string;
    userAddress: string;
    timestamp: number;
    tx: string;
    block?: string | null;
    poolId: {
        __typename?: 'Pool';
        id: string;
        swapFee: string;
        poolType?: string | null;
        tokens?: Array<{
            __typename?: 'PoolToken';
            token: { __typename?: 'Token'; address: string; latestFXPrice?: string | null };
        }> | null;
    };
};

export type BalancerGetPoolsWithActiveUpdatesQueryVariables = Exact<{
    timestamp: Scalars['BigInt'];
}>;

export type BalancerGetPoolsWithActiveUpdatesQuery = {
    __typename?: 'Query';
    ampUpdates: Array<{ __typename?: 'AmpUpdate'; poolId: { __typename?: 'Pool'; id: string } }>;
};

export type BalancerGetMetaQueryVariables = Exact<{ [key: string]: never }>;

export type BalancerGetMetaQuery = {
    __typename?: 'Query';
    meta?: {
        __typename?: '_Meta_';
        deployment: string;
        hasIndexingErrors: boolean;
        block: { __typename?: '_Block_'; number: number };
    } | null;
};

export type PoolBalancesFragment = {
    __typename?: 'Pool';
    id: string;
    address: string;
    totalShares: string;
    tokens?: Array<{
        __typename?: 'PoolToken';
        address: string;
        decimals: number;
        balance: string;
        priceRate: string;
    }> | null;
};

export type PoolBalancesQueryVariables = Exact<{
    skip?: InputMaybe<Scalars['Int']>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    where?: InputMaybe<Pool_Filter>;
    block?: InputMaybe<Block_Height>;
}>;

export type PoolBalancesQuery = {
    __typename?: 'Query';
    pools: Array<{
        __typename?: 'Pool';
        id: string;
        address: string;
        totalShares: string;
        tokens?: Array<{
            __typename?: 'PoolToken';
            address: string;
            decimals: number;
            balance: string;
            priceRate: string;
        }> | null;
    }>;
};

export const BalancerPoolShareFragmentDoc = gql`
    fragment BalancerPoolShare on PoolShare {
        id
        balance
        poolId {
            id
        }
    }
`;
export const BalancerPoolTokenFragmentDoc = gql`
    fragment BalancerPoolToken on PoolToken {
        id
        symbol
        name
        decimals
        address
        balance
        weight
        priceRate
        isExemptFromYieldProtocolFee
        index
        token {
            latestFXPrice
        }
    }
`;
export const BalancerPoolFragmentDoc = gql`
    fragment BalancerPool on Pool {
        id
        address
        poolType
        poolTypeVersion
        symbol
        name
        swapFee
        totalShares
        swapsCount
        holdersCount
        createTime
        swapEnabled
        tokensList
        lowerTarget
        upperTarget
        mainIndex
        wrappedIndex
        factory
        expiryTime
        unitSeconds
        principalToken
        baseToken
        owner
        amp
        alpha
        beta
        sqrtAlpha
        sqrtBeta
        root3Alpha
        c
        s
        lambda
        tauAlphaX
        tauAlphaY
        tauBetaX
        tauBetaY
        u
        v
        w
        z
        dSq
        delta
        epsilon
        priceRateProviders {
            address
            token {
                address
            }
        }
        tokens {
            ...BalancerPoolToken
        }
    }
    ${BalancerPoolTokenFragmentDoc}
`;
export const BalancerJoinExitFragmentDoc = gql`
    fragment BalancerJoinExit on JoinExit {
        amounts
        id
        sender
        block
        timestamp
        tx
        type
        pool {
            id
            tokensList
        }
    }
`;
export const BalancerSwapFragmentDoc = gql`
    fragment BalancerSwap on Swap {
        id
        caller
        tokenIn
        tokenInSym
        tokenOut
        tokenOutSym
        tokenAmountIn
        tokenAmountOut
        poolId {
            id
            swapFee
            poolType
            tokens {
                token {
                    address
                    latestFXPrice
                }
            }
        }
        userAddress
        timestamp
        tx
        block
    }
`;
export const PoolBalancesFragmentDoc = gql`
    fragment PoolBalances on Pool {
        id
        address
        totalShares
        tokens {
            address
            decimals
            balance
            priceRate
        }
    }
`;
export const BalancerPoolSharesDocument = gql`
    query BalancerPoolShares(
        $skip: Int
        $first: Int
        $orderBy: PoolShare_orderBy
        $orderDirection: OrderDirection
        $where: PoolShare_filter
        $block: Block_height
    ) {
        poolShares(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...BalancerPoolShare
        }
    }
    ${BalancerPoolShareFragmentDoc}
`;
export const BalancerPoolsDocument = gql`
    query BalancerPools(
        $skip: Int
        $first: Int
        $orderBy: Pool_orderBy
        $orderDirection: OrderDirection
        $where: Pool_filter
        $block: Block_height
    ) {
        pools(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...BalancerPool
        }
    }
    ${BalancerPoolFragmentDoc}
`;
export const BalancerPoolDocument = gql`
    query BalancerPool($id: ID!, $block: Block_height) {
        pool(id: $id, block: $block) {
            ...BalancerPool
        }
    }
    ${BalancerPoolFragmentDoc}
`;
export const BalancerJoinExitsDocument = gql`
    query BalancerJoinExits(
        $skip: Int
        $first: Int
        $orderBy: JoinExit_orderBy
        $orderDirection: OrderDirection
        $where: JoinExit_filter
        $block: Block_height
    ) {
        joinExits(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...BalancerJoinExit
        }
    }
    ${BalancerJoinExitFragmentDoc}
`;
export const BalancerSwapsDocument = gql`
    query BalancerSwaps(
        $skip: Int
        $first: Int
        $orderBy: Swap_orderBy
        $orderDirection: OrderDirection
        $where: Swap_filter
        $block: Block_height
    ) {
        swaps(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...BalancerSwap
        }
    }
    ${BalancerSwapFragmentDoc}
`;
export const BalancerGetPoolsWithActiveUpdatesDocument = gql`
    query BalancerGetPoolsWithActiveUpdates($timestamp: BigInt!) {
        ampUpdates(where: { endTimestamp_gte: $timestamp }) {
            poolId {
                id
            }
        }
    }
`;
export const BalancerGetMetaDocument = gql`
    query BalancerGetMeta {
        meta: _meta {
            block {
                number
            }
            deployment
            hasIndexingErrors
        }
    }
`;
export const PoolBalancesDocument = gql`
    query PoolBalances(
        $skip: Int
        $first: Int
        $orderBy: Pool_orderBy
        $orderDirection: OrderDirection
        $where: Pool_filter
        $block: Block_height
    ) {
        pools(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...PoolBalances
        }
    }
    ${PoolBalancesFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
    operationType?: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        BalancerPoolShares(
            variables?: BalancerPoolSharesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerPoolSharesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerPoolSharesQuery>(BalancerPoolSharesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerPoolShares',
                'query',
            );
        },
        BalancerPools(
            variables?: BalancerPoolsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerPoolsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerPoolsQuery>(BalancerPoolsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerPools',
                'query',
            );
        },
        BalancerPool(
            variables: BalancerPoolQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerPoolQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerPoolQuery>(BalancerPoolDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerPool',
                'query',
            );
        },
        BalancerJoinExits(
            variables?: BalancerJoinExitsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerJoinExitsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerJoinExitsQuery>(BalancerJoinExitsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerJoinExits',
                'query',
            );
        },
        BalancerSwaps(
            variables?: BalancerSwapsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerSwapsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerSwapsQuery>(BalancerSwapsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerSwaps',
                'query',
            );
        },
        BalancerGetPoolsWithActiveUpdates(
            variables: BalancerGetPoolsWithActiveUpdatesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerGetPoolsWithActiveUpdatesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerGetPoolsWithActiveUpdatesQuery>(
                        BalancerGetPoolsWithActiveUpdatesDocument,
                        variables,
                        { ...requestHeaders, ...wrappedRequestHeaders },
                    ),
                'BalancerGetPoolsWithActiveUpdates',
                'query',
            );
        },
        BalancerGetMeta(
            variables?: BalancerGetMetaQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerGetMetaQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerGetMetaQuery>(BalancerGetMetaDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerGetMeta',
                'query',
            );
        },
        PoolBalances(
            variables?: PoolBalancesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<PoolBalancesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<PoolBalancesQuery>(PoolBalancesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'PoolBalances',
                'query',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
