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
    /**
     * 8 bytes signed integer
     *
     */
    Int8: any;
    /**
     * A string representation of microseconds UNIX timestamp (16 digits)
     *
     */
    Timestamp: any;
};

export type AddRemove = {
    amounts: Array<Scalars['BigDecimal']>;
    blockNumber: Scalars['BigInt'];
    blockTimestamp: Scalars['BigInt'];
    id: Scalars['Bytes'];
    logIndex: Scalars['BigInt'];
    pool: Pool;
    sender: Scalars['Bytes'];
    transactionHash: Scalars['Bytes'];
    type: InvestType;
    user: User;
};

export type AddRemove_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    amounts?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amounts_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    and?: InputMaybe<Array<InputMaybe<AddRemove_Filter>>>;
    blockNumber?: InputMaybe<Scalars['BigInt']>;
    blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
    blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
    blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
    blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
    blockNumber_not?: InputMaybe<Scalars['BigInt']>;
    blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockTimestamp?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    logIndex?: InputMaybe<Scalars['BigInt']>;
    logIndex_gt?: InputMaybe<Scalars['BigInt']>;
    logIndex_gte?: InputMaybe<Scalars['BigInt']>;
    logIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
    logIndex_lt?: InputMaybe<Scalars['BigInt']>;
    logIndex_lte?: InputMaybe<Scalars['BigInt']>;
    logIndex_not?: InputMaybe<Scalars['BigInt']>;
    logIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    or?: InputMaybe<Array<InputMaybe<AddRemove_Filter>>>;
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
    transactionHash?: InputMaybe<Scalars['Bytes']>;
    transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
    transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
    transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
    transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
    transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    type?: InputMaybe<InvestType>;
    type_in?: InputMaybe<Array<InvestType>>;
    type_not?: InputMaybe<InvestType>;
    type_not_in?: InputMaybe<Array<InvestType>>;
    user?: InputMaybe<Scalars['String']>;
    user_?: InputMaybe<User_Filter>;
    user_contains?: InputMaybe<Scalars['String']>;
    user_contains_nocase?: InputMaybe<Scalars['String']>;
    user_ends_with?: InputMaybe<Scalars['String']>;
    user_ends_with_nocase?: InputMaybe<Scalars['String']>;
    user_gt?: InputMaybe<Scalars['String']>;
    user_gte?: InputMaybe<Scalars['String']>;
    user_in?: InputMaybe<Array<Scalars['String']>>;
    user_lt?: InputMaybe<Scalars['String']>;
    user_lte?: InputMaybe<Scalars['String']>;
    user_not?: InputMaybe<Scalars['String']>;
    user_not_contains?: InputMaybe<Scalars['String']>;
    user_not_contains_nocase?: InputMaybe<Scalars['String']>;
    user_not_ends_with?: InputMaybe<Scalars['String']>;
    user_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    user_not_in?: InputMaybe<Array<Scalars['String']>>;
    user_not_starts_with?: InputMaybe<Scalars['String']>;
    user_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    user_starts_with?: InputMaybe<Scalars['String']>;
    user_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum AddRemove_OrderBy {
    Amounts = 'amounts',
    BlockNumber = 'blockNumber',
    BlockTimestamp = 'blockTimestamp',
    Id = 'id',
    LogIndex = 'logIndex',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolBlockNumber = 'pool__blockNumber',
    PoolBlockTimestamp = 'pool__blockTimestamp',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInitialized = 'pool__isInitialized',
    PoolName = 'pool__name',
    PoolPauseManager = 'pool__pauseManager',
    PoolPauseWindowEndTime = 'pool__pauseWindowEndTime',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTotalShares = 'pool__totalShares',
    PoolTransactionHash = 'pool__transactionHash',
    Sender = 'sender',
    TransactionHash = 'transactionHash',
    Type = 'type',
    User = 'user',
    UserId = 'user__id',
}

export enum Aggregation_Interval {
    Day = 'day',
    Hour = 'hour',
}

export type BlockChangedFilter = {
    number_gte: Scalars['Int'];
};

export type Block_Height = {
    hash?: InputMaybe<Scalars['Bytes']>;
    number?: InputMaybe<Scalars['Int']>;
    number_gte?: InputMaybe<Scalars['Int']>;
};

export type Buffer = {
    id: Scalars['Bytes'];
    totalShares: Scalars['BigDecimal'];
    underlyingBalance: Scalars['BigDecimal'];
    underlyingToken: Token;
    wrappedBalance: Scalars['BigDecimal'];
    wrappedToken: Token;
};

export type BufferShare = {
    balance: Scalars['BigDecimal'];
    buffer: Buffer;
    id: Scalars['Bytes'];
    user: User;
};

export type BufferShare_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<BufferShare_Filter>>>;
    balance?: InputMaybe<Scalars['BigDecimal']>;
    balance_gt?: InputMaybe<Scalars['BigDecimal']>;
    balance_gte?: InputMaybe<Scalars['BigDecimal']>;
    balance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: InputMaybe<Scalars['BigDecimal']>;
    balance_lte?: InputMaybe<Scalars['BigDecimal']>;
    balance_not?: InputMaybe<Scalars['BigDecimal']>;
    balance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    buffer?: InputMaybe<Scalars['String']>;
    buffer_?: InputMaybe<Buffer_Filter>;
    buffer_contains?: InputMaybe<Scalars['String']>;
    buffer_contains_nocase?: InputMaybe<Scalars['String']>;
    buffer_ends_with?: InputMaybe<Scalars['String']>;
    buffer_ends_with_nocase?: InputMaybe<Scalars['String']>;
    buffer_gt?: InputMaybe<Scalars['String']>;
    buffer_gte?: InputMaybe<Scalars['String']>;
    buffer_in?: InputMaybe<Array<Scalars['String']>>;
    buffer_lt?: InputMaybe<Scalars['String']>;
    buffer_lte?: InputMaybe<Scalars['String']>;
    buffer_not?: InputMaybe<Scalars['String']>;
    buffer_not_contains?: InputMaybe<Scalars['String']>;
    buffer_not_contains_nocase?: InputMaybe<Scalars['String']>;
    buffer_not_ends_with?: InputMaybe<Scalars['String']>;
    buffer_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    buffer_not_in?: InputMaybe<Array<Scalars['String']>>;
    buffer_not_starts_with?: InputMaybe<Scalars['String']>;
    buffer_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    buffer_starts_with?: InputMaybe<Scalars['String']>;
    buffer_starts_with_nocase?: InputMaybe<Scalars['String']>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    or?: InputMaybe<Array<InputMaybe<BufferShare_Filter>>>;
    user?: InputMaybe<Scalars['String']>;
    user_?: InputMaybe<User_Filter>;
    user_contains?: InputMaybe<Scalars['String']>;
    user_contains_nocase?: InputMaybe<Scalars['String']>;
    user_ends_with?: InputMaybe<Scalars['String']>;
    user_ends_with_nocase?: InputMaybe<Scalars['String']>;
    user_gt?: InputMaybe<Scalars['String']>;
    user_gte?: InputMaybe<Scalars['String']>;
    user_in?: InputMaybe<Array<Scalars['String']>>;
    user_lt?: InputMaybe<Scalars['String']>;
    user_lte?: InputMaybe<Scalars['String']>;
    user_not?: InputMaybe<Scalars['String']>;
    user_not_contains?: InputMaybe<Scalars['String']>;
    user_not_contains_nocase?: InputMaybe<Scalars['String']>;
    user_not_ends_with?: InputMaybe<Scalars['String']>;
    user_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    user_not_in?: InputMaybe<Array<Scalars['String']>>;
    user_not_starts_with?: InputMaybe<Scalars['String']>;
    user_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    user_starts_with?: InputMaybe<Scalars['String']>;
    user_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum BufferShare_OrderBy {
    Balance = 'balance',
    Buffer = 'buffer',
    BufferId = 'buffer__id',
    BufferTotalShares = 'buffer__totalShares',
    BufferUnderlyingBalance = 'buffer__underlyingBalance',
    BufferWrappedBalance = 'buffer__wrappedBalance',
    Id = 'id',
    User = 'user',
    UserId = 'user__id',
}

export type Buffer_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<Buffer_Filter>>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    or?: InputMaybe<Array<InputMaybe<Buffer_Filter>>>;
    totalShares?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalShares_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_not?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    underlyingBalance?: InputMaybe<Scalars['BigDecimal']>;
    underlyingBalance_gt?: InputMaybe<Scalars['BigDecimal']>;
    underlyingBalance_gte?: InputMaybe<Scalars['BigDecimal']>;
    underlyingBalance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    underlyingBalance_lt?: InputMaybe<Scalars['BigDecimal']>;
    underlyingBalance_lte?: InputMaybe<Scalars['BigDecimal']>;
    underlyingBalance_not?: InputMaybe<Scalars['BigDecimal']>;
    underlyingBalance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    underlyingToken?: InputMaybe<Scalars['String']>;
    underlyingToken_?: InputMaybe<Token_Filter>;
    underlyingToken_contains?: InputMaybe<Scalars['String']>;
    underlyingToken_contains_nocase?: InputMaybe<Scalars['String']>;
    underlyingToken_ends_with?: InputMaybe<Scalars['String']>;
    underlyingToken_ends_with_nocase?: InputMaybe<Scalars['String']>;
    underlyingToken_gt?: InputMaybe<Scalars['String']>;
    underlyingToken_gte?: InputMaybe<Scalars['String']>;
    underlyingToken_in?: InputMaybe<Array<Scalars['String']>>;
    underlyingToken_lt?: InputMaybe<Scalars['String']>;
    underlyingToken_lte?: InputMaybe<Scalars['String']>;
    underlyingToken_not?: InputMaybe<Scalars['String']>;
    underlyingToken_not_contains?: InputMaybe<Scalars['String']>;
    underlyingToken_not_contains_nocase?: InputMaybe<Scalars['String']>;
    underlyingToken_not_ends_with?: InputMaybe<Scalars['String']>;
    underlyingToken_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    underlyingToken_not_in?: InputMaybe<Array<Scalars['String']>>;
    underlyingToken_not_starts_with?: InputMaybe<Scalars['String']>;
    underlyingToken_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    underlyingToken_starts_with?: InputMaybe<Scalars['String']>;
    underlyingToken_starts_with_nocase?: InputMaybe<Scalars['String']>;
    wrappedBalance?: InputMaybe<Scalars['BigDecimal']>;
    wrappedBalance_gt?: InputMaybe<Scalars['BigDecimal']>;
    wrappedBalance_gte?: InputMaybe<Scalars['BigDecimal']>;
    wrappedBalance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    wrappedBalance_lt?: InputMaybe<Scalars['BigDecimal']>;
    wrappedBalance_lte?: InputMaybe<Scalars['BigDecimal']>;
    wrappedBalance_not?: InputMaybe<Scalars['BigDecimal']>;
    wrappedBalance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    wrappedToken?: InputMaybe<Scalars['String']>;
    wrappedToken_?: InputMaybe<Token_Filter>;
    wrappedToken_contains?: InputMaybe<Scalars['String']>;
    wrappedToken_contains_nocase?: InputMaybe<Scalars['String']>;
    wrappedToken_ends_with?: InputMaybe<Scalars['String']>;
    wrappedToken_ends_with_nocase?: InputMaybe<Scalars['String']>;
    wrappedToken_gt?: InputMaybe<Scalars['String']>;
    wrappedToken_gte?: InputMaybe<Scalars['String']>;
    wrappedToken_in?: InputMaybe<Array<Scalars['String']>>;
    wrappedToken_lt?: InputMaybe<Scalars['String']>;
    wrappedToken_lte?: InputMaybe<Scalars['String']>;
    wrappedToken_not?: InputMaybe<Scalars['String']>;
    wrappedToken_not_contains?: InputMaybe<Scalars['String']>;
    wrappedToken_not_contains_nocase?: InputMaybe<Scalars['String']>;
    wrappedToken_not_ends_with?: InputMaybe<Scalars['String']>;
    wrappedToken_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    wrappedToken_not_in?: InputMaybe<Array<Scalars['String']>>;
    wrappedToken_not_starts_with?: InputMaybe<Scalars['String']>;
    wrappedToken_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    wrappedToken_starts_with?: InputMaybe<Scalars['String']>;
    wrappedToken_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Buffer_OrderBy {
    Id = 'id',
    TotalShares = 'totalShares',
    UnderlyingBalance = 'underlyingBalance',
    UnderlyingToken = 'underlyingToken',
    UnderlyingTokenAddress = 'underlyingToken__address',
    UnderlyingTokenDecimals = 'underlyingToken__decimals',
    UnderlyingTokenId = 'underlyingToken__id',
    UnderlyingTokenName = 'underlyingToken__name',
    UnderlyingTokenSymbol = 'underlyingToken__symbol',
    WrappedBalance = 'wrappedBalance',
    WrappedToken = 'wrappedToken',
    WrappedTokenAddress = 'wrappedToken__address',
    WrappedTokenDecimals = 'wrappedToken__decimals',
    WrappedTokenId = 'wrappedToken__id',
    WrappedTokenName = 'wrappedToken__name',
    WrappedTokenSymbol = 'wrappedToken__symbol',
}

export type Hook = {
    address: Scalars['Bytes'];
    id: Scalars['Bytes'];
    pools?: Maybe<Array<Pool>>;
};

export type HookPoolsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<Pool_Filter>;
};

export type HookConfig = {
    enableHookAdjustedAmounts: Scalars['Boolean'];
    hook: Hook;
    id: Scalars['Bytes'];
    pool: Pool;
    shouldCallAfterAddLiquidity: Scalars['Boolean'];
    shouldCallAfterInitialize: Scalars['Boolean'];
    shouldCallAfterRemoveLiquidity: Scalars['Boolean'];
    shouldCallAfterSwap: Scalars['Boolean'];
    shouldCallBeforeAddLiquidity: Scalars['Boolean'];
    shouldCallBeforeInitialize: Scalars['Boolean'];
    shouldCallBeforeRemoveLiquidity: Scalars['Boolean'];
    shouldCallBeforeSwap: Scalars['Boolean'];
    shouldCallComputeDynamicSwapFee: Scalars['Boolean'];
};

export type HookConfig_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<HookConfig_Filter>>>;
    enableHookAdjustedAmounts?: InputMaybe<Scalars['Boolean']>;
    enableHookAdjustedAmounts_in?: InputMaybe<Array<Scalars['Boolean']>>;
    enableHookAdjustedAmounts_not?: InputMaybe<Scalars['Boolean']>;
    enableHookAdjustedAmounts_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    hook?: InputMaybe<Scalars['String']>;
    hook_?: InputMaybe<Hook_Filter>;
    hook_contains?: InputMaybe<Scalars['String']>;
    hook_contains_nocase?: InputMaybe<Scalars['String']>;
    hook_ends_with?: InputMaybe<Scalars['String']>;
    hook_ends_with_nocase?: InputMaybe<Scalars['String']>;
    hook_gt?: InputMaybe<Scalars['String']>;
    hook_gte?: InputMaybe<Scalars['String']>;
    hook_in?: InputMaybe<Array<Scalars['String']>>;
    hook_lt?: InputMaybe<Scalars['String']>;
    hook_lte?: InputMaybe<Scalars['String']>;
    hook_not?: InputMaybe<Scalars['String']>;
    hook_not_contains?: InputMaybe<Scalars['String']>;
    hook_not_contains_nocase?: InputMaybe<Scalars['String']>;
    hook_not_ends_with?: InputMaybe<Scalars['String']>;
    hook_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    hook_not_in?: InputMaybe<Array<Scalars['String']>>;
    hook_not_starts_with?: InputMaybe<Scalars['String']>;
    hook_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    hook_starts_with?: InputMaybe<Scalars['String']>;
    hook_starts_with_nocase?: InputMaybe<Scalars['String']>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    or?: InputMaybe<Array<InputMaybe<HookConfig_Filter>>>;
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
    shouldCallAfterAddLiquidity?: InputMaybe<Scalars['Boolean']>;
    shouldCallAfterAddLiquidity_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallAfterAddLiquidity_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallAfterAddLiquidity_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallAfterInitialize?: InputMaybe<Scalars['Boolean']>;
    shouldCallAfterInitialize_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallAfterInitialize_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallAfterInitialize_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallAfterRemoveLiquidity?: InputMaybe<Scalars['Boolean']>;
    shouldCallAfterRemoveLiquidity_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallAfterRemoveLiquidity_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallAfterRemoveLiquidity_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallAfterSwap?: InputMaybe<Scalars['Boolean']>;
    shouldCallAfterSwap_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallAfterSwap_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallAfterSwap_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallBeforeAddLiquidity?: InputMaybe<Scalars['Boolean']>;
    shouldCallBeforeAddLiquidity_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallBeforeAddLiquidity_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallBeforeAddLiquidity_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallBeforeInitialize?: InputMaybe<Scalars['Boolean']>;
    shouldCallBeforeInitialize_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallBeforeInitialize_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallBeforeInitialize_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallBeforeRemoveLiquidity?: InputMaybe<Scalars['Boolean']>;
    shouldCallBeforeRemoveLiquidity_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallBeforeRemoveLiquidity_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallBeforeRemoveLiquidity_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallBeforeSwap?: InputMaybe<Scalars['Boolean']>;
    shouldCallBeforeSwap_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallBeforeSwap_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallBeforeSwap_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallComputeDynamicSwapFee?: InputMaybe<Scalars['Boolean']>;
    shouldCallComputeDynamicSwapFee_in?: InputMaybe<Array<Scalars['Boolean']>>;
    shouldCallComputeDynamicSwapFee_not?: InputMaybe<Scalars['Boolean']>;
    shouldCallComputeDynamicSwapFee_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
};

export enum HookConfig_OrderBy {
    EnableHookAdjustedAmounts = 'enableHookAdjustedAmounts',
    Hook = 'hook',
    HookAddress = 'hook__address',
    HookId = 'hook__id',
    Id = 'id',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolBlockNumber = 'pool__blockNumber',
    PoolBlockTimestamp = 'pool__blockTimestamp',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInitialized = 'pool__isInitialized',
    PoolName = 'pool__name',
    PoolPauseManager = 'pool__pauseManager',
    PoolPauseWindowEndTime = 'pool__pauseWindowEndTime',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTotalShares = 'pool__totalShares',
    PoolTransactionHash = 'pool__transactionHash',
    ShouldCallAfterAddLiquidity = 'shouldCallAfterAddLiquidity',
    ShouldCallAfterInitialize = 'shouldCallAfterInitialize',
    ShouldCallAfterRemoveLiquidity = 'shouldCallAfterRemoveLiquidity',
    ShouldCallAfterSwap = 'shouldCallAfterSwap',
    ShouldCallBeforeAddLiquidity = 'shouldCallBeforeAddLiquidity',
    ShouldCallBeforeInitialize = 'shouldCallBeforeInitialize',
    ShouldCallBeforeRemoveLiquidity = 'shouldCallBeforeRemoveLiquidity',
    ShouldCallBeforeSwap = 'shouldCallBeforeSwap',
    ShouldCallComputeDynamicSwapFee = 'shouldCallComputeDynamicSwapFee',
}

export type Hook_Filter = {
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
    and?: InputMaybe<Array<InputMaybe<Hook_Filter>>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    or?: InputMaybe<Array<InputMaybe<Hook_Filter>>>;
    pools_?: InputMaybe<Pool_Filter>;
};

export enum Hook_OrderBy {
    Address = 'address',
    Id = 'id',
    Pools = 'pools',
}

export enum InvestType {
    Add = 'Add',
    Remove = 'Remove',
}

export type LiquidityManagement = {
    disableUnbalancedLiquidity: Scalars['Boolean'];
    enableAddLiquidityCustom: Scalars['Boolean'];
    enableDonation: Scalars['Boolean'];
    enableRemoveLiquidityCustom: Scalars['Boolean'];
    id: Scalars['Bytes'];
    pool: Pool;
};

export type LiquidityManagement_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<LiquidityManagement_Filter>>>;
    disableUnbalancedLiquidity?: InputMaybe<Scalars['Boolean']>;
    disableUnbalancedLiquidity_in?: InputMaybe<Array<Scalars['Boolean']>>;
    disableUnbalancedLiquidity_not?: InputMaybe<Scalars['Boolean']>;
    disableUnbalancedLiquidity_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    enableAddLiquidityCustom?: InputMaybe<Scalars['Boolean']>;
    enableAddLiquidityCustom_in?: InputMaybe<Array<Scalars['Boolean']>>;
    enableAddLiquidityCustom_not?: InputMaybe<Scalars['Boolean']>;
    enableAddLiquidityCustom_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    enableDonation?: InputMaybe<Scalars['Boolean']>;
    enableDonation_in?: InputMaybe<Array<Scalars['Boolean']>>;
    enableDonation_not?: InputMaybe<Scalars['Boolean']>;
    enableDonation_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    enableRemoveLiquidityCustom?: InputMaybe<Scalars['Boolean']>;
    enableRemoveLiquidityCustom_in?: InputMaybe<Array<Scalars['Boolean']>>;
    enableRemoveLiquidityCustom_not?: InputMaybe<Scalars['Boolean']>;
    enableRemoveLiquidityCustom_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    or?: InputMaybe<Array<InputMaybe<LiquidityManagement_Filter>>>;
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

export enum LiquidityManagement_OrderBy {
    DisableUnbalancedLiquidity = 'disableUnbalancedLiquidity',
    EnableAddLiquidityCustom = 'enableAddLiquidityCustom',
    EnableDonation = 'enableDonation',
    EnableRemoveLiquidityCustom = 'enableRemoveLiquidityCustom',
    Id = 'id',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolBlockNumber = 'pool__blockNumber',
    PoolBlockTimestamp = 'pool__blockTimestamp',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInitialized = 'pool__isInitialized',
    PoolName = 'pool__name',
    PoolPauseManager = 'pool__pauseManager',
    PoolPauseWindowEndTime = 'pool__pauseWindowEndTime',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTotalShares = 'pool__totalShares',
    PoolTransactionHash = 'pool__transactionHash',
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type Pool = {
    address: Scalars['Bytes'];
    blockNumber: Scalars['BigInt'];
    blockTimestamp: Scalars['BigInt'];
    factory: Scalars['Bytes'];
    holdersCount: Scalars['BigInt'];
    hook: Hook;
    hookConfig: HookConfig;
    id: Scalars['Bytes'];
    isInitialized: Scalars['Boolean'];
    liquidityManagement: LiquidityManagement;
    name: Scalars['String'];
    pauseManager: Scalars['Bytes'];
    pauseWindowEndTime: Scalars['BigInt'];
    rateProviders: Array<RateProvider>;
    snapshots: Array<PoolSnapshot>;
    swapFee: Scalars['BigDecimal'];
    swapsCount: Scalars['BigInt'];
    symbol: Scalars['String'];
    tokens: Array<PoolToken>;
    totalShares: Scalars['BigDecimal'];
    transactionHash: Scalars['Bytes'];
    vault: Vault;
};

export type PoolRateProvidersArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RateProvider_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<RateProvider_Filter>;
};

export type PoolSnapshotsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolSnapshot_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<PoolSnapshot_Filter>;
};

export type PoolTokensArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolToken_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<PoolToken_Filter>;
};

export type PoolShare = {
    balance: Scalars['BigDecimal'];
    id: Scalars['ID'];
    pool: Pool;
    user: User;
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
    user?: InputMaybe<Scalars['String']>;
    user_?: InputMaybe<User_Filter>;
    user_contains?: InputMaybe<Scalars['String']>;
    user_contains_nocase?: InputMaybe<Scalars['String']>;
    user_ends_with?: InputMaybe<Scalars['String']>;
    user_ends_with_nocase?: InputMaybe<Scalars['String']>;
    user_gt?: InputMaybe<Scalars['String']>;
    user_gte?: InputMaybe<Scalars['String']>;
    user_in?: InputMaybe<Array<Scalars['String']>>;
    user_lt?: InputMaybe<Scalars['String']>;
    user_lte?: InputMaybe<Scalars['String']>;
    user_not?: InputMaybe<Scalars['String']>;
    user_not_contains?: InputMaybe<Scalars['String']>;
    user_not_contains_nocase?: InputMaybe<Scalars['String']>;
    user_not_ends_with?: InputMaybe<Scalars['String']>;
    user_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    user_not_in?: InputMaybe<Array<Scalars['String']>>;
    user_not_starts_with?: InputMaybe<Scalars['String']>;
    user_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    user_starts_with?: InputMaybe<Scalars['String']>;
    user_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum PoolShare_OrderBy {
    Balance = 'balance',
    Id = 'id',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolBlockNumber = 'pool__blockNumber',
    PoolBlockTimestamp = 'pool__blockTimestamp',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInitialized = 'pool__isInitialized',
    PoolName = 'pool__name',
    PoolPauseManager = 'pool__pauseManager',
    PoolPauseWindowEndTime = 'pool__pauseWindowEndTime',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTotalShares = 'pool__totalShares',
    PoolTransactionHash = 'pool__transactionHash',
    User = 'user',
    UserId = 'user__id',
}

export type PoolSnapshot = {
    balances: Array<Scalars['BigDecimal']>;
    holdersCount: Scalars['BigInt'];
    id: Scalars['ID'];
    pool: Pool;
    swapsCount: Scalars['BigInt'];
    timestamp: Scalars['Int'];
    totalProtocolSwapFees: Array<Scalars['BigDecimal']>;
    totalProtocolYieldFees: Array<Scalars['BigDecimal']>;
    totalShares: Scalars['BigDecimal'];
    totalSwapFees: Array<Scalars['BigDecimal']>;
    totalSwapVolumes: Array<Scalars['BigDecimal']>;
};

export type PoolSnapshot_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<PoolSnapshot_Filter>>>;
    balances?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balances_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balances_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balances_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balances_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balances_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
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
    or?: InputMaybe<Array<InputMaybe<PoolSnapshot_Filter>>>;
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
    swapsCount?: InputMaybe<Scalars['BigInt']>;
    swapsCount_gt?: InputMaybe<Scalars['BigInt']>;
    swapsCount_gte?: InputMaybe<Scalars['BigInt']>;
    swapsCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
    swapsCount_lt?: InputMaybe<Scalars['BigInt']>;
    swapsCount_lte?: InputMaybe<Scalars['BigInt']>;
    swapsCount_not?: InputMaybe<Scalars['BigInt']>;
    swapsCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp?: InputMaybe<Scalars['Int']>;
    timestamp_gt?: InputMaybe<Scalars['Int']>;
    timestamp_gte?: InputMaybe<Scalars['Int']>;
    timestamp_in?: InputMaybe<Array<Scalars['Int']>>;
    timestamp_lt?: InputMaybe<Scalars['Int']>;
    timestamp_lte?: InputMaybe<Scalars['Int']>;
    timestamp_not?: InputMaybe<Scalars['Int']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['Int']>>;
    totalProtocolSwapFees?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolSwapFees_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolSwapFees_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolSwapFees_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolSwapFees_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolSwapFees_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolYieldFees?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolYieldFees_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolYieldFees_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolYieldFees_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolYieldFees_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolYieldFees_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalShares?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalShares_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_not?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapFees?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapFees_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapFees_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapFees_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapFees_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapFees_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolumes?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolumes_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolumes_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolumes_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolumes_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolumes_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolSnapshot_OrderBy {
    Balances = 'balances',
    HoldersCount = 'holdersCount',
    Id = 'id',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolBlockNumber = 'pool__blockNumber',
    PoolBlockTimestamp = 'pool__blockTimestamp',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInitialized = 'pool__isInitialized',
    PoolName = 'pool__name',
    PoolPauseManager = 'pool__pauseManager',
    PoolPauseWindowEndTime = 'pool__pauseWindowEndTime',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTotalShares = 'pool__totalShares',
    PoolTransactionHash = 'pool__transactionHash',
    SwapsCount = 'swapsCount',
    Timestamp = 'timestamp',
    TotalProtocolSwapFees = 'totalProtocolSwapFees',
    TotalProtocolYieldFees = 'totalProtocolYieldFees',
    TotalShares = 'totalShares',
    TotalSwapFees = 'totalSwapFees',
    TotalSwapVolumes = 'totalSwapVolumes',
}

export type PoolToken = {
    address: Scalars['Bytes'];
    balance: Scalars['BigDecimal'];
    buffer?: Maybe<Buffer>;
    decimals: Scalars['Int'];
    id: Scalars['Bytes'];
    index: Scalars['Int'];
    name: Scalars['String'];
    nestedPool?: Maybe<Pool>;
    paysYieldFees: Scalars['Boolean'];
    pool: Pool;
    priceRate: Scalars['BigDecimal'];
    symbol: Scalars['String'];
    totalProtocolSwapFee: Scalars['BigDecimal'];
    totalProtocolYieldFee: Scalars['BigDecimal'];
    volume: Scalars['BigDecimal'];
};

export type PoolToken_Filter = {
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
    and?: InputMaybe<Array<InputMaybe<PoolToken_Filter>>>;
    balance?: InputMaybe<Scalars['BigDecimal']>;
    balance_gt?: InputMaybe<Scalars['BigDecimal']>;
    balance_gte?: InputMaybe<Scalars['BigDecimal']>;
    balance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: InputMaybe<Scalars['BigDecimal']>;
    balance_lte?: InputMaybe<Scalars['BigDecimal']>;
    balance_not?: InputMaybe<Scalars['BigDecimal']>;
    balance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    buffer?: InputMaybe<Scalars['String']>;
    buffer_?: InputMaybe<Buffer_Filter>;
    buffer_contains?: InputMaybe<Scalars['String']>;
    buffer_contains_nocase?: InputMaybe<Scalars['String']>;
    buffer_ends_with?: InputMaybe<Scalars['String']>;
    buffer_ends_with_nocase?: InputMaybe<Scalars['String']>;
    buffer_gt?: InputMaybe<Scalars['String']>;
    buffer_gte?: InputMaybe<Scalars['String']>;
    buffer_in?: InputMaybe<Array<Scalars['String']>>;
    buffer_lt?: InputMaybe<Scalars['String']>;
    buffer_lte?: InputMaybe<Scalars['String']>;
    buffer_not?: InputMaybe<Scalars['String']>;
    buffer_not_contains?: InputMaybe<Scalars['String']>;
    buffer_not_contains_nocase?: InputMaybe<Scalars['String']>;
    buffer_not_ends_with?: InputMaybe<Scalars['String']>;
    buffer_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    buffer_not_in?: InputMaybe<Array<Scalars['String']>>;
    buffer_not_starts_with?: InputMaybe<Scalars['String']>;
    buffer_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    buffer_starts_with?: InputMaybe<Scalars['String']>;
    buffer_starts_with_nocase?: InputMaybe<Scalars['String']>;
    decimals?: InputMaybe<Scalars['Int']>;
    decimals_gt?: InputMaybe<Scalars['Int']>;
    decimals_gte?: InputMaybe<Scalars['Int']>;
    decimals_in?: InputMaybe<Array<Scalars['Int']>>;
    decimals_lt?: InputMaybe<Scalars['Int']>;
    decimals_lte?: InputMaybe<Scalars['Int']>;
    decimals_not?: InputMaybe<Scalars['Int']>;
    decimals_not_in?: InputMaybe<Array<Scalars['Int']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    index?: InputMaybe<Scalars['Int']>;
    index_gt?: InputMaybe<Scalars['Int']>;
    index_gte?: InputMaybe<Scalars['Int']>;
    index_in?: InputMaybe<Array<Scalars['Int']>>;
    index_lt?: InputMaybe<Scalars['Int']>;
    index_lte?: InputMaybe<Scalars['Int']>;
    index_not?: InputMaybe<Scalars['Int']>;
    index_not_in?: InputMaybe<Array<Scalars['Int']>>;
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
    nestedPool?: InputMaybe<Scalars['String']>;
    nestedPool_?: InputMaybe<Pool_Filter>;
    nestedPool_contains?: InputMaybe<Scalars['String']>;
    nestedPool_contains_nocase?: InputMaybe<Scalars['String']>;
    nestedPool_ends_with?: InputMaybe<Scalars['String']>;
    nestedPool_ends_with_nocase?: InputMaybe<Scalars['String']>;
    nestedPool_gt?: InputMaybe<Scalars['String']>;
    nestedPool_gte?: InputMaybe<Scalars['String']>;
    nestedPool_in?: InputMaybe<Array<Scalars['String']>>;
    nestedPool_lt?: InputMaybe<Scalars['String']>;
    nestedPool_lte?: InputMaybe<Scalars['String']>;
    nestedPool_not?: InputMaybe<Scalars['String']>;
    nestedPool_not_contains?: InputMaybe<Scalars['String']>;
    nestedPool_not_contains_nocase?: InputMaybe<Scalars['String']>;
    nestedPool_not_ends_with?: InputMaybe<Scalars['String']>;
    nestedPool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    nestedPool_not_in?: InputMaybe<Array<Scalars['String']>>;
    nestedPool_not_starts_with?: InputMaybe<Scalars['String']>;
    nestedPool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    nestedPool_starts_with?: InputMaybe<Scalars['String']>;
    nestedPool_starts_with_nocase?: InputMaybe<Scalars['String']>;
    or?: InputMaybe<Array<InputMaybe<PoolToken_Filter>>>;
    paysYieldFees?: InputMaybe<Scalars['Boolean']>;
    paysYieldFees_in?: InputMaybe<Array<Scalars['Boolean']>>;
    paysYieldFees_not?: InputMaybe<Scalars['Boolean']>;
    paysYieldFees_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
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
    totalProtocolSwapFee?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolSwapFee_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolSwapFee_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolSwapFee_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolSwapFee_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolSwapFee_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolSwapFee_not?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolSwapFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolYieldFee?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolYieldFee_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolYieldFee_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolYieldFee_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalProtocolYieldFee_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolYieldFee_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolYieldFee_not?: InputMaybe<Scalars['BigDecimal']>;
    totalProtocolYieldFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    volume?: InputMaybe<Scalars['BigDecimal']>;
    volume_gt?: InputMaybe<Scalars['BigDecimal']>;
    volume_gte?: InputMaybe<Scalars['BigDecimal']>;
    volume_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    volume_lt?: InputMaybe<Scalars['BigDecimal']>;
    volume_lte?: InputMaybe<Scalars['BigDecimal']>;
    volume_not?: InputMaybe<Scalars['BigDecimal']>;
    volume_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolToken_OrderBy {
    Address = 'address',
    Balance = 'balance',
    Buffer = 'buffer',
    BufferId = 'buffer__id',
    BufferTotalShares = 'buffer__totalShares',
    BufferUnderlyingBalance = 'buffer__underlyingBalance',
    BufferWrappedBalance = 'buffer__wrappedBalance',
    Decimals = 'decimals',
    Id = 'id',
    Index = 'index',
    Name = 'name',
    NestedPool = 'nestedPool',
    NestedPoolAddress = 'nestedPool__address',
    NestedPoolBlockNumber = 'nestedPool__blockNumber',
    NestedPoolBlockTimestamp = 'nestedPool__blockTimestamp',
    NestedPoolFactory = 'nestedPool__factory',
    NestedPoolHoldersCount = 'nestedPool__holdersCount',
    NestedPoolId = 'nestedPool__id',
    NestedPoolIsInitialized = 'nestedPool__isInitialized',
    NestedPoolName = 'nestedPool__name',
    NestedPoolPauseManager = 'nestedPool__pauseManager',
    NestedPoolPauseWindowEndTime = 'nestedPool__pauseWindowEndTime',
    NestedPoolSwapFee = 'nestedPool__swapFee',
    NestedPoolSwapsCount = 'nestedPool__swapsCount',
    NestedPoolSymbol = 'nestedPool__symbol',
    NestedPoolTotalShares = 'nestedPool__totalShares',
    NestedPoolTransactionHash = 'nestedPool__transactionHash',
    PaysYieldFees = 'paysYieldFees',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolBlockNumber = 'pool__blockNumber',
    PoolBlockTimestamp = 'pool__blockTimestamp',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInitialized = 'pool__isInitialized',
    PoolName = 'pool__name',
    PoolPauseManager = 'pool__pauseManager',
    PoolPauseWindowEndTime = 'pool__pauseWindowEndTime',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTotalShares = 'pool__totalShares',
    PoolTransactionHash = 'pool__transactionHash',
    PriceRate = 'priceRate',
    Symbol = 'symbol',
    TotalProtocolSwapFee = 'totalProtocolSwapFee',
    TotalProtocolYieldFee = 'totalProtocolYieldFee',
    Volume = 'volume',
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
    and?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
    blockNumber?: InputMaybe<Scalars['BigInt']>;
    blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
    blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
    blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
    blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
    blockNumber_not?: InputMaybe<Scalars['BigInt']>;
    blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockTimestamp?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    hook?: InputMaybe<Scalars['String']>;
    hookConfig?: InputMaybe<Scalars['String']>;
    hookConfig_?: InputMaybe<HookConfig_Filter>;
    hookConfig_contains?: InputMaybe<Scalars['String']>;
    hookConfig_contains_nocase?: InputMaybe<Scalars['String']>;
    hookConfig_ends_with?: InputMaybe<Scalars['String']>;
    hookConfig_ends_with_nocase?: InputMaybe<Scalars['String']>;
    hookConfig_gt?: InputMaybe<Scalars['String']>;
    hookConfig_gte?: InputMaybe<Scalars['String']>;
    hookConfig_in?: InputMaybe<Array<Scalars['String']>>;
    hookConfig_lt?: InputMaybe<Scalars['String']>;
    hookConfig_lte?: InputMaybe<Scalars['String']>;
    hookConfig_not?: InputMaybe<Scalars['String']>;
    hookConfig_not_contains?: InputMaybe<Scalars['String']>;
    hookConfig_not_contains_nocase?: InputMaybe<Scalars['String']>;
    hookConfig_not_ends_with?: InputMaybe<Scalars['String']>;
    hookConfig_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    hookConfig_not_in?: InputMaybe<Array<Scalars['String']>>;
    hookConfig_not_starts_with?: InputMaybe<Scalars['String']>;
    hookConfig_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    hookConfig_starts_with?: InputMaybe<Scalars['String']>;
    hookConfig_starts_with_nocase?: InputMaybe<Scalars['String']>;
    hook_?: InputMaybe<Hook_Filter>;
    hook_contains?: InputMaybe<Scalars['String']>;
    hook_contains_nocase?: InputMaybe<Scalars['String']>;
    hook_ends_with?: InputMaybe<Scalars['String']>;
    hook_ends_with_nocase?: InputMaybe<Scalars['String']>;
    hook_gt?: InputMaybe<Scalars['String']>;
    hook_gte?: InputMaybe<Scalars['String']>;
    hook_in?: InputMaybe<Array<Scalars['String']>>;
    hook_lt?: InputMaybe<Scalars['String']>;
    hook_lte?: InputMaybe<Scalars['String']>;
    hook_not?: InputMaybe<Scalars['String']>;
    hook_not_contains?: InputMaybe<Scalars['String']>;
    hook_not_contains_nocase?: InputMaybe<Scalars['String']>;
    hook_not_ends_with?: InputMaybe<Scalars['String']>;
    hook_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    hook_not_in?: InputMaybe<Array<Scalars['String']>>;
    hook_not_starts_with?: InputMaybe<Scalars['String']>;
    hook_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    hook_starts_with?: InputMaybe<Scalars['String']>;
    hook_starts_with_nocase?: InputMaybe<Scalars['String']>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    isInitialized?: InputMaybe<Scalars['Boolean']>;
    isInitialized_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isInitialized_not?: InputMaybe<Scalars['Boolean']>;
    isInitialized_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    liquidityManagement?: InputMaybe<Scalars['String']>;
    liquidityManagement_?: InputMaybe<LiquidityManagement_Filter>;
    liquidityManagement_contains?: InputMaybe<Scalars['String']>;
    liquidityManagement_contains_nocase?: InputMaybe<Scalars['String']>;
    liquidityManagement_ends_with?: InputMaybe<Scalars['String']>;
    liquidityManagement_ends_with_nocase?: InputMaybe<Scalars['String']>;
    liquidityManagement_gt?: InputMaybe<Scalars['String']>;
    liquidityManagement_gte?: InputMaybe<Scalars['String']>;
    liquidityManagement_in?: InputMaybe<Array<Scalars['String']>>;
    liquidityManagement_lt?: InputMaybe<Scalars['String']>;
    liquidityManagement_lte?: InputMaybe<Scalars['String']>;
    liquidityManagement_not?: InputMaybe<Scalars['String']>;
    liquidityManagement_not_contains?: InputMaybe<Scalars['String']>;
    liquidityManagement_not_contains_nocase?: InputMaybe<Scalars['String']>;
    liquidityManagement_not_ends_with?: InputMaybe<Scalars['String']>;
    liquidityManagement_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    liquidityManagement_not_in?: InputMaybe<Array<Scalars['String']>>;
    liquidityManagement_not_starts_with?: InputMaybe<Scalars['String']>;
    liquidityManagement_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    liquidityManagement_starts_with?: InputMaybe<Scalars['String']>;
    liquidityManagement_starts_with_nocase?: InputMaybe<Scalars['String']>;
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
    pauseManager?: InputMaybe<Scalars['Bytes']>;
    pauseManager_contains?: InputMaybe<Scalars['Bytes']>;
    pauseManager_gt?: InputMaybe<Scalars['Bytes']>;
    pauseManager_gte?: InputMaybe<Scalars['Bytes']>;
    pauseManager_in?: InputMaybe<Array<Scalars['Bytes']>>;
    pauseManager_lt?: InputMaybe<Scalars['Bytes']>;
    pauseManager_lte?: InputMaybe<Scalars['Bytes']>;
    pauseManager_not?: InputMaybe<Scalars['Bytes']>;
    pauseManager_not_contains?: InputMaybe<Scalars['Bytes']>;
    pauseManager_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    pauseWindowEndTime?: InputMaybe<Scalars['BigInt']>;
    pauseWindowEndTime_gt?: InputMaybe<Scalars['BigInt']>;
    pauseWindowEndTime_gte?: InputMaybe<Scalars['BigInt']>;
    pauseWindowEndTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
    pauseWindowEndTime_lt?: InputMaybe<Scalars['BigInt']>;
    pauseWindowEndTime_lte?: InputMaybe<Scalars['BigInt']>;
    pauseWindowEndTime_not?: InputMaybe<Scalars['BigInt']>;
    pauseWindowEndTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    rateProviders_?: InputMaybe<RateProvider_Filter>;
    snapshots_?: InputMaybe<PoolSnapshot_Filter>;
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
    tokens_?: InputMaybe<PoolToken_Filter>;
    totalShares?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalShares_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_not?: InputMaybe<Scalars['BigDecimal']>;
    totalShares_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    transactionHash?: InputMaybe<Scalars['Bytes']>;
    transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
    transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
    transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
    transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
    transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    vault?: InputMaybe<Scalars['String']>;
    vault_?: InputMaybe<Vault_Filter>;
    vault_contains?: InputMaybe<Scalars['String']>;
    vault_contains_nocase?: InputMaybe<Scalars['String']>;
    vault_ends_with?: InputMaybe<Scalars['String']>;
    vault_ends_with_nocase?: InputMaybe<Scalars['String']>;
    vault_gt?: InputMaybe<Scalars['String']>;
    vault_gte?: InputMaybe<Scalars['String']>;
    vault_in?: InputMaybe<Array<Scalars['String']>>;
    vault_lt?: InputMaybe<Scalars['String']>;
    vault_lte?: InputMaybe<Scalars['String']>;
    vault_not?: InputMaybe<Scalars['String']>;
    vault_not_contains?: InputMaybe<Scalars['String']>;
    vault_not_contains_nocase?: InputMaybe<Scalars['String']>;
    vault_not_ends_with?: InputMaybe<Scalars['String']>;
    vault_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    vault_not_in?: InputMaybe<Array<Scalars['String']>>;
    vault_not_starts_with?: InputMaybe<Scalars['String']>;
    vault_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    vault_starts_with?: InputMaybe<Scalars['String']>;
    vault_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Pool_OrderBy {
    Address = 'address',
    BlockNumber = 'blockNumber',
    BlockTimestamp = 'blockTimestamp',
    Factory = 'factory',
    HoldersCount = 'holdersCount',
    Hook = 'hook',
    HookConfig = 'hookConfig',
    HookConfigEnableHookAdjustedAmounts = 'hookConfig__enableHookAdjustedAmounts',
    HookConfigId = 'hookConfig__id',
    HookConfigShouldCallAfterAddLiquidity = 'hookConfig__shouldCallAfterAddLiquidity',
    HookConfigShouldCallAfterInitialize = 'hookConfig__shouldCallAfterInitialize',
    HookConfigShouldCallAfterRemoveLiquidity = 'hookConfig__shouldCallAfterRemoveLiquidity',
    HookConfigShouldCallAfterSwap = 'hookConfig__shouldCallAfterSwap',
    HookConfigShouldCallBeforeAddLiquidity = 'hookConfig__shouldCallBeforeAddLiquidity',
    HookConfigShouldCallBeforeInitialize = 'hookConfig__shouldCallBeforeInitialize',
    HookConfigShouldCallBeforeRemoveLiquidity = 'hookConfig__shouldCallBeforeRemoveLiquidity',
    HookConfigShouldCallBeforeSwap = 'hookConfig__shouldCallBeforeSwap',
    HookConfigShouldCallComputeDynamicSwapFee = 'hookConfig__shouldCallComputeDynamicSwapFee',
    HookAddress = 'hook__address',
    HookId = 'hook__id',
    Id = 'id',
    IsInitialized = 'isInitialized',
    LiquidityManagement = 'liquidityManagement',
    LiquidityManagementDisableUnbalancedLiquidity = 'liquidityManagement__disableUnbalancedLiquidity',
    LiquidityManagementEnableAddLiquidityCustom = 'liquidityManagement__enableAddLiquidityCustom',
    LiquidityManagementEnableDonation = 'liquidityManagement__enableDonation',
    LiquidityManagementEnableRemoveLiquidityCustom = 'liquidityManagement__enableRemoveLiquidityCustom',
    LiquidityManagementId = 'liquidityManagement__id',
    Name = 'name',
    PauseManager = 'pauseManager',
    PauseWindowEndTime = 'pauseWindowEndTime',
    RateProviders = 'rateProviders',
    Snapshots = 'snapshots',
    SwapFee = 'swapFee',
    SwapsCount = 'swapsCount',
    Symbol = 'symbol',
    Tokens = 'tokens',
    TotalShares = 'totalShares',
    TransactionHash = 'transactionHash',
    Vault = 'vault',
    VaultAuthorizer = 'vault__authorizer',
    VaultId = 'vault__id',
    VaultIsPaused = 'vault__isPaused',
    VaultProtocolSwapFee = 'vault__protocolSwapFee',
    VaultProtocolYieldFee = 'vault__protocolYieldFee',
}

export type Query = {
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    addRemove?: Maybe<AddRemove>;
    addRemoves: Array<AddRemove>;
    buffer?: Maybe<Buffer>;
    bufferShare?: Maybe<BufferShare>;
    bufferShares: Array<BufferShare>;
    buffers: Array<Buffer>;
    hook?: Maybe<Hook>;
    hookConfig?: Maybe<HookConfig>;
    hookConfigs: Array<HookConfig>;
    hooks: Array<Hook>;
    liquidityManagement?: Maybe<LiquidityManagement>;
    liquidityManagements: Array<LiquidityManagement>;
    pool?: Maybe<Pool>;
    poolShare?: Maybe<PoolShare>;
    poolShares: Array<PoolShare>;
    poolSnapshot?: Maybe<PoolSnapshot>;
    poolSnapshots: Array<PoolSnapshot>;
    poolToken?: Maybe<PoolToken>;
    poolTokens: Array<PoolToken>;
    pools: Array<Pool>;
    rateProvider?: Maybe<RateProvider>;
    rateProviders: Array<RateProvider>;
    swap?: Maybe<Swap>;
    swaps: Array<Swap>;
    token?: Maybe<Token>;
    tokens: Array<Token>;
    user?: Maybe<User>;
    users: Array<User>;
    vault?: Maybe<Vault>;
    vaults: Array<Vault>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryAddRemoveArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryAddRemovesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<AddRemove_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<AddRemove_Filter>;
};

export type QueryBufferArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBufferShareArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBufferSharesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<BufferShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<BufferShare_Filter>;
};

export type QueryBuffersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Buffer_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Buffer_Filter>;
};

export type QueryHookArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryHookConfigArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryHookConfigsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<HookConfig_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<HookConfig_Filter>;
};

export type QueryHooksArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Hook_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Hook_Filter>;
};

export type QueryLiquidityManagementArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLiquidityManagementsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LiquidityManagement_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LiquidityManagement_Filter>;
};

export type QueryPoolArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
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

export type QueryPoolSnapshotArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolSnapshotsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolSnapshot_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolSnapshot_Filter>;
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

export type QueryRateProviderArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRateProvidersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RateProvider_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<RateProvider_Filter>;
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

export type QueryUserArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUsersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<User_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<User_Filter>;
};

export type QueryVaultArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryVaultsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Vault_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Vault_Filter>;
};

export type RateProvider = {
    address: Scalars['Bytes'];
    id: Scalars['Bytes'];
    pool: Pool;
    token: PoolToken;
};

export type RateProvider_Filter = {
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
    and?: InputMaybe<Array<InputMaybe<RateProvider_Filter>>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    or?: InputMaybe<Array<InputMaybe<RateProvider_Filter>>>;
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

export enum RateProvider_OrderBy {
    Address = 'address',
    Id = 'id',
    Pool = 'pool',
    PoolAddress = 'pool__address',
    PoolBlockNumber = 'pool__blockNumber',
    PoolBlockTimestamp = 'pool__blockTimestamp',
    PoolFactory = 'pool__factory',
    PoolHoldersCount = 'pool__holdersCount',
    PoolId = 'pool__id',
    PoolIsInitialized = 'pool__isInitialized',
    PoolName = 'pool__name',
    PoolPauseManager = 'pool__pauseManager',
    PoolPauseWindowEndTime = 'pool__pauseWindowEndTime',
    PoolSwapFee = 'pool__swapFee',
    PoolSwapsCount = 'pool__swapsCount',
    PoolSymbol = 'pool__symbol',
    PoolTotalShares = 'pool__totalShares',
    PoolTransactionHash = 'pool__transactionHash',
    Token = 'token',
    TokenAddress = 'token__address',
    TokenBalance = 'token__balance',
    TokenDecimals = 'token__decimals',
    TokenId = 'token__id',
    TokenIndex = 'token__index',
    TokenName = 'token__name',
    TokenPaysYieldFees = 'token__paysYieldFees',
    TokenPriceRate = 'token__priceRate',
    TokenSymbol = 'token__symbol',
    TokenTotalProtocolSwapFee = 'token__totalProtocolSwapFee',
    TokenTotalProtocolYieldFee = 'token__totalProtocolYieldFee',
    TokenVolume = 'token__volume',
}

export type Subscription = {
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    addRemove?: Maybe<AddRemove>;
    addRemoves: Array<AddRemove>;
    buffer?: Maybe<Buffer>;
    bufferShare?: Maybe<BufferShare>;
    bufferShares: Array<BufferShare>;
    buffers: Array<Buffer>;
    hook?: Maybe<Hook>;
    hookConfig?: Maybe<HookConfig>;
    hookConfigs: Array<HookConfig>;
    hooks: Array<Hook>;
    liquidityManagement?: Maybe<LiquidityManagement>;
    liquidityManagements: Array<LiquidityManagement>;
    pool?: Maybe<Pool>;
    poolShare?: Maybe<PoolShare>;
    poolShares: Array<PoolShare>;
    poolSnapshot?: Maybe<PoolSnapshot>;
    poolSnapshots: Array<PoolSnapshot>;
    poolToken?: Maybe<PoolToken>;
    poolTokens: Array<PoolToken>;
    pools: Array<Pool>;
    rateProvider?: Maybe<RateProvider>;
    rateProviders: Array<RateProvider>;
    swap?: Maybe<Swap>;
    swaps: Array<Swap>;
    token?: Maybe<Token>;
    tokens: Array<Token>;
    user?: Maybe<User>;
    users: Array<User>;
    vault?: Maybe<Vault>;
    vaults: Array<Vault>;
};

export type Subscription_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type SubscriptionAddRemoveArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionAddRemovesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<AddRemove_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<AddRemove_Filter>;
};

export type SubscriptionBufferArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionBufferShareArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionBufferSharesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<BufferShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<BufferShare_Filter>;
};

export type SubscriptionBuffersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Buffer_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Buffer_Filter>;
};

export type SubscriptionHookArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionHookConfigArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionHookConfigsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<HookConfig_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<HookConfig_Filter>;
};

export type SubscriptionHooksArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Hook_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Hook_Filter>;
};

export type SubscriptionLiquidityManagementArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionLiquidityManagementsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LiquidityManagement_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LiquidityManagement_Filter>;
};

export type SubscriptionPoolArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPoolShareArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPoolSharesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolShare_Filter>;
};

export type SubscriptionPoolSnapshotArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPoolSnapshotsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolSnapshot_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolSnapshot_Filter>;
};

export type SubscriptionPoolTokenArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPoolTokensArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolToken_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolToken_Filter>;
};

export type SubscriptionPoolsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Pool_Filter>;
};

export type SubscriptionRateProviderArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionRateProvidersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RateProvider_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<RateProvider_Filter>;
};

export type SubscriptionSwapArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionSwapsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Swap_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Swap_Filter>;
};

export type SubscriptionTokenArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTokensArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Token_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Token_Filter>;
};

export type SubscriptionUserArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUsersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<User_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<User_Filter>;
};

export type SubscriptionVaultArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionVaultsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Vault_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Vault_Filter>;
};

export type Swap = {
    blockNumber: Scalars['BigInt'];
    blockTimestamp: Scalars['BigInt'];
    id: Scalars['Bytes'];
    logIndex: Scalars['BigInt'];
    pool: Scalars['Bytes'];
    swapFeeAmount: Scalars['BigDecimal'];
    swapFeeToken: Scalars['Bytes'];
    tokenAmountIn: Scalars['BigDecimal'];
    tokenAmountOut: Scalars['BigDecimal'];
    tokenIn: Scalars['Bytes'];
    tokenInSymbol: Scalars['String'];
    tokenOut: Scalars['Bytes'];
    tokenOutSymbol: Scalars['String'];
    transactionHash: Scalars['Bytes'];
    user: User;
};

export type Swap_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<Swap_Filter>>>;
    blockNumber?: InputMaybe<Scalars['BigInt']>;
    blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
    blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
    blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
    blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
    blockNumber_not?: InputMaybe<Scalars['BigInt']>;
    blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockTimestamp?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    blockTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_not?: InputMaybe<Scalars['BigInt']>;
    blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    logIndex?: InputMaybe<Scalars['BigInt']>;
    logIndex_gt?: InputMaybe<Scalars['BigInt']>;
    logIndex_gte?: InputMaybe<Scalars['BigInt']>;
    logIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
    logIndex_lt?: InputMaybe<Scalars['BigInt']>;
    logIndex_lte?: InputMaybe<Scalars['BigInt']>;
    logIndex_not?: InputMaybe<Scalars['BigInt']>;
    logIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    or?: InputMaybe<Array<InputMaybe<Swap_Filter>>>;
    pool?: InputMaybe<Scalars['Bytes']>;
    pool_contains?: InputMaybe<Scalars['Bytes']>;
    pool_gt?: InputMaybe<Scalars['Bytes']>;
    pool_gte?: InputMaybe<Scalars['Bytes']>;
    pool_in?: InputMaybe<Array<Scalars['Bytes']>>;
    pool_lt?: InputMaybe<Scalars['Bytes']>;
    pool_lte?: InputMaybe<Scalars['Bytes']>;
    pool_not?: InputMaybe<Scalars['Bytes']>;
    pool_not_contains?: InputMaybe<Scalars['Bytes']>;
    pool_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    swapFeeAmount?: InputMaybe<Scalars['BigDecimal']>;
    swapFeeAmount_gt?: InputMaybe<Scalars['BigDecimal']>;
    swapFeeAmount_gte?: InputMaybe<Scalars['BigDecimal']>;
    swapFeeAmount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    swapFeeAmount_lt?: InputMaybe<Scalars['BigDecimal']>;
    swapFeeAmount_lte?: InputMaybe<Scalars['BigDecimal']>;
    swapFeeAmount_not?: InputMaybe<Scalars['BigDecimal']>;
    swapFeeAmount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    swapFeeToken?: InputMaybe<Scalars['Bytes']>;
    swapFeeToken_contains?: InputMaybe<Scalars['Bytes']>;
    swapFeeToken_gt?: InputMaybe<Scalars['Bytes']>;
    swapFeeToken_gte?: InputMaybe<Scalars['Bytes']>;
    swapFeeToken_in?: InputMaybe<Array<Scalars['Bytes']>>;
    swapFeeToken_lt?: InputMaybe<Scalars['Bytes']>;
    swapFeeToken_lte?: InputMaybe<Scalars['Bytes']>;
    swapFeeToken_not?: InputMaybe<Scalars['Bytes']>;
    swapFeeToken_not_contains?: InputMaybe<Scalars['Bytes']>;
    swapFeeToken_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
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
    tokenInSymbol?: InputMaybe<Scalars['String']>;
    tokenInSymbol_contains?: InputMaybe<Scalars['String']>;
    tokenInSymbol_contains_nocase?: InputMaybe<Scalars['String']>;
    tokenInSymbol_ends_with?: InputMaybe<Scalars['String']>;
    tokenInSymbol_ends_with_nocase?: InputMaybe<Scalars['String']>;
    tokenInSymbol_gt?: InputMaybe<Scalars['String']>;
    tokenInSymbol_gte?: InputMaybe<Scalars['String']>;
    tokenInSymbol_in?: InputMaybe<Array<Scalars['String']>>;
    tokenInSymbol_lt?: InputMaybe<Scalars['String']>;
    tokenInSymbol_lte?: InputMaybe<Scalars['String']>;
    tokenInSymbol_not?: InputMaybe<Scalars['String']>;
    tokenInSymbol_not_contains?: InputMaybe<Scalars['String']>;
    tokenInSymbol_not_contains_nocase?: InputMaybe<Scalars['String']>;
    tokenInSymbol_not_ends_with?: InputMaybe<Scalars['String']>;
    tokenInSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    tokenInSymbol_not_in?: InputMaybe<Array<Scalars['String']>>;
    tokenInSymbol_not_starts_with?: InputMaybe<Scalars['String']>;
    tokenInSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    tokenInSymbol_starts_with?: InputMaybe<Scalars['String']>;
    tokenInSymbol_starts_with_nocase?: InputMaybe<Scalars['String']>;
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
    tokenOutSymbol?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_contains?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_contains_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_ends_with?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_ends_with_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_gt?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_gte?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_in?: InputMaybe<Array<Scalars['String']>>;
    tokenOutSymbol_lt?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_lte?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_not?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_not_contains?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_not_contains_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_not_ends_with?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_not_in?: InputMaybe<Array<Scalars['String']>>;
    tokenOutSymbol_not_starts_with?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_starts_with?: InputMaybe<Scalars['String']>;
    tokenOutSymbol_starts_with_nocase?: InputMaybe<Scalars['String']>;
    tokenOut_contains?: InputMaybe<Scalars['Bytes']>;
    tokenOut_gt?: InputMaybe<Scalars['Bytes']>;
    tokenOut_gte?: InputMaybe<Scalars['Bytes']>;
    tokenOut_in?: InputMaybe<Array<Scalars['Bytes']>>;
    tokenOut_lt?: InputMaybe<Scalars['Bytes']>;
    tokenOut_lte?: InputMaybe<Scalars['Bytes']>;
    tokenOut_not?: InputMaybe<Scalars['Bytes']>;
    tokenOut_not_contains?: InputMaybe<Scalars['Bytes']>;
    tokenOut_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transactionHash?: InputMaybe<Scalars['Bytes']>;
    transactionHash_contains?: InputMaybe<Scalars['Bytes']>;
    transactionHash_gt?: InputMaybe<Scalars['Bytes']>;
    transactionHash_gte?: InputMaybe<Scalars['Bytes']>;
    transactionHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transactionHash_lt?: InputMaybe<Scalars['Bytes']>;
    transactionHash_lte?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not_contains?: InputMaybe<Scalars['Bytes']>;
    transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    user?: InputMaybe<Scalars['String']>;
    user_?: InputMaybe<User_Filter>;
    user_contains?: InputMaybe<Scalars['String']>;
    user_contains_nocase?: InputMaybe<Scalars['String']>;
    user_ends_with?: InputMaybe<Scalars['String']>;
    user_ends_with_nocase?: InputMaybe<Scalars['String']>;
    user_gt?: InputMaybe<Scalars['String']>;
    user_gte?: InputMaybe<Scalars['String']>;
    user_in?: InputMaybe<Array<Scalars['String']>>;
    user_lt?: InputMaybe<Scalars['String']>;
    user_lte?: InputMaybe<Scalars['String']>;
    user_not?: InputMaybe<Scalars['String']>;
    user_not_contains?: InputMaybe<Scalars['String']>;
    user_not_contains_nocase?: InputMaybe<Scalars['String']>;
    user_not_ends_with?: InputMaybe<Scalars['String']>;
    user_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    user_not_in?: InputMaybe<Array<Scalars['String']>>;
    user_not_starts_with?: InputMaybe<Scalars['String']>;
    user_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    user_starts_with?: InputMaybe<Scalars['String']>;
    user_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Swap_OrderBy {
    BlockNumber = 'blockNumber',
    BlockTimestamp = 'blockTimestamp',
    Id = 'id',
    LogIndex = 'logIndex',
    Pool = 'pool',
    SwapFeeAmount = 'swapFeeAmount',
    SwapFeeToken = 'swapFeeToken',
    TokenAmountIn = 'tokenAmountIn',
    TokenAmountOut = 'tokenAmountOut',
    TokenIn = 'tokenIn',
    TokenInSymbol = 'tokenInSymbol',
    TokenOut = 'tokenOut',
    TokenOutSymbol = 'tokenOutSymbol',
    TransactionHash = 'transactionHash',
    User = 'user',
    UserId = 'user__id',
}

export type Token = {
    address: Scalars['Bytes'];
    decimals: Scalars['Int'];
    id: Scalars['Bytes'];
    name: Scalars['String'];
    symbol: Scalars['String'];
};

export type Token_Filter = {
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
    and?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
    decimals?: InputMaybe<Scalars['Int']>;
    decimals_gt?: InputMaybe<Scalars['Int']>;
    decimals_gte?: InputMaybe<Scalars['Int']>;
    decimals_in?: InputMaybe<Array<Scalars['Int']>>;
    decimals_lt?: InputMaybe<Scalars['Int']>;
    decimals_lte?: InputMaybe<Scalars['Int']>;
    decimals_not?: InputMaybe<Scalars['Int']>;
    decimals_not_in?: InputMaybe<Array<Scalars['Int']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
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
};

export enum Token_OrderBy {
    Address = 'address',
    Decimals = 'decimals',
    Id = 'id',
    Name = 'name',
    Symbol = 'symbol',
}

export type User = {
    addRemoves?: Maybe<Array<AddRemove>>;
    id: Scalars['Bytes'];
    shares?: Maybe<Array<PoolShare>>;
    swaps?: Maybe<Array<Swap>>;
};

export type UserAddRemovesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<AddRemove_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<AddRemove_Filter>;
};

export type UserSharesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<PoolShare_Filter>;
};

export type UserSwapsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Swap_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<Swap_Filter>;
};

export type User_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    addRemoves_?: InputMaybe<AddRemove_Filter>;
    and?: InputMaybe<Array<InputMaybe<User_Filter>>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    or?: InputMaybe<Array<InputMaybe<User_Filter>>>;
    shares_?: InputMaybe<PoolShare_Filter>;
    swaps_?: InputMaybe<Swap_Filter>;
};

export enum User_OrderBy {
    AddRemoves = 'addRemoves',
    Id = 'id',
    Shares = 'shares',
    Swaps = 'swaps',
}

export type Vault = {
    authorizer: Scalars['Bytes'];
    id: Scalars['Bytes'];
    isPaused: Scalars['Boolean'];
    pools?: Maybe<Array<Pool>>;
    protocolSwapFee: Scalars['BigDecimal'];
    protocolYieldFee: Scalars['BigDecimal'];
};

export type VaultPoolsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<Pool_Filter>;
};

export type Vault_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<Vault_Filter>>>;
    authorizer?: InputMaybe<Scalars['Bytes']>;
    authorizer_contains?: InputMaybe<Scalars['Bytes']>;
    authorizer_gt?: InputMaybe<Scalars['Bytes']>;
    authorizer_gte?: InputMaybe<Scalars['Bytes']>;
    authorizer_in?: InputMaybe<Array<Scalars['Bytes']>>;
    authorizer_lt?: InputMaybe<Scalars['Bytes']>;
    authorizer_lte?: InputMaybe<Scalars['Bytes']>;
    authorizer_not?: InputMaybe<Scalars['Bytes']>;
    authorizer_not_contains?: InputMaybe<Scalars['Bytes']>;
    authorizer_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_gt?: InputMaybe<Scalars['Bytes']>;
    id_gte?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_lt?: InputMaybe<Scalars['Bytes']>;
    id_lte?: InputMaybe<Scalars['Bytes']>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    isPaused?: InputMaybe<Scalars['Boolean']>;
    isPaused_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isPaused_not?: InputMaybe<Scalars['Boolean']>;
    isPaused_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    or?: InputMaybe<Array<InputMaybe<Vault_Filter>>>;
    pools_?: InputMaybe<Pool_Filter>;
    protocolSwapFee?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFee_gt?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFee_gte?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFee_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    protocolSwapFee_lt?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFee_lte?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFee_not?: InputMaybe<Scalars['BigDecimal']>;
    protocolSwapFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    protocolYieldFee?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFee_gt?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFee_gte?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFee_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    protocolYieldFee_lt?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFee_lte?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFee_not?: InputMaybe<Scalars['BigDecimal']>;
    protocolYieldFee_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum Vault_OrderBy {
    Authorizer = 'authorizer',
    Id = 'id',
    IsPaused = 'isPaused',
    Pools = 'pools',
    ProtocolSwapFee = 'protocolSwapFee',
    ProtocolYieldFee = 'protocolYieldFee',
}

export type _Block_ = {
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

export type AddRemoveFragment = {
    id: string;
    type: InvestType;
    sender: string;
    amounts: Array<string>;
    blockNumber: string;
    logIndex: string;
    blockTimestamp: string;
    transactionHash: string;
    pool: { id: string; tokens: Array<{ index: number; address: string }> };
    user: { id: string };
};

export type AddRemoveQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<AddRemove_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<AddRemove_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type AddRemoveQuery = {
    addRemoves: Array<{
        id: string;
        type: InvestType;
        sender: string;
        amounts: Array<string>;
        blockNumber: string;
        logIndex: string;
        blockTimestamp: string;
        transactionHash: string;
        pool: { id: string; tokens: Array<{ index: number; address: string }> };
        user: { id: string };
    }>;
};

export type PoolBalancesFragment = {
    id: string;
    address: string;
    totalShares: string;
    tokens: Array<{ address: string; decimals: number; balance: string; priceRate: string }>;
};

export type PoolBalancesQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<Pool_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type PoolBalancesQuery = {
    pools: Array<{
        id: string;
        address: string;
        totalShares: string;
        tokens: Array<{ address: string; decimals: number; balance: string; priceRate: string }>;
    }>;
};

export type PoolShareFragment = { id: string; balance: string };

export type PoolSharesQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolShare_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<PoolShare_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type PoolSharesQuery = { poolShares: Array<{ id: string; balance: string }> };

export type PoolSnapshotFragment = {
    id: string;
    timestamp: number;
    balances: Array<string>;
    totalShares: string;
    swapsCount: string;
    holdersCount: string;
    totalSwapVolumes: Array<string>;
    totalProtocolSwapFees: Array<string>;
    totalProtocolYieldFees: Array<string>;
    pool: { id: string; swapFee: string; tokens: Array<{ index: number; address: string }> };
};

export type PoolSnapshotsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<PoolSnapshot_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type PoolSnapshotsQuery = {
    poolSnapshots: Array<{
        id: string;
        timestamp: number;
        balances: Array<string>;
        totalShares: string;
        swapsCount: string;
        holdersCount: string;
        totalSwapVolumes: Array<string>;
        totalProtocolSwapFees: Array<string>;
        totalProtocolYieldFees: Array<string>;
        pool: { id: string; swapFee: string; tokens: Array<{ index: number; address: string }> };
    }>;
};

export type VaultPoolFragment = {
    id: string;
    address: string;
    name: string;
    symbol: string;
    totalShares: string;
    pauseWindowEndTime: string;
    pauseManager: string;
    blockNumber: string;
    blockTimestamp: string;
    holdersCount: string;
    transactionHash: string;
    tokens: Array<{
        id: string;
        address: string;
        index: number;
        name: string;
        symbol: string;
        decimals: number;
        balance: string;
        totalProtocolSwapFee: string;
        totalProtocolYieldFee: string;
        paysYieldFees: boolean;
        nestedPool?: { id: string } | null | undefined;
    }>;
    rateProviders: Array<{ address: string; token: { address: string } }>;
    hookConfig: {
        __typename?: 'HookConfig';
        enableHookAdjustedAmounts: boolean;
        shouldCallAfterSwap: boolean;
        shouldCallBeforeSwap: boolean;
        shouldCallAfterInitialize: boolean;
        shouldCallBeforeInitialize: boolean;
        shouldCallAfterAddLiquidity: boolean;
        shouldCallBeforeAddLiquidity: boolean;
        shouldCallAfterRemoveLiquidity: boolean;
        shouldCallBeforeRemoveLiquidity: boolean;
        shouldCallComputeDynamicSwapFee: boolean;
        hook: { __typename?: 'Hook'; address: string };
    };
};

export type PoolsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<Pool_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type PoolsQuery = {
    pools: Array<{
        id: string;
        address: string;
        name: string;
        symbol: string;
        totalShares: string;
        pauseWindowEndTime: string;
        pauseManager: string;
        blockNumber: string;
        blockTimestamp: string;
        holdersCount: string;
        transactionHash: string;
        tokens: Array<{
            id: string;
            address: string;
            index: number;
            name: string;
            symbol: string;
            decimals: number;
            balance: string;
            totalProtocolSwapFee: string;
            totalProtocolYieldFee: string;
            paysYieldFees: boolean;
            nestedPool?: { id: string } | null | undefined;
        }>;
        rateProviders: Array<{ address: string; token: { address: string } }>;
        hookConfig: {
            __typename?: 'HookConfig';
            enableHookAdjustedAmounts: boolean;
            shouldCallAfterSwap: boolean;
            shouldCallBeforeSwap: boolean;
            shouldCallAfterInitialize: boolean;
            shouldCallBeforeInitialize: boolean;
            shouldCallAfterAddLiquidity: boolean;
            shouldCallBeforeAddLiquidity: boolean;
            shouldCallAfterRemoveLiquidity: boolean;
            shouldCallBeforeRemoveLiquidity: boolean;
            shouldCallComputeDynamicSwapFee: boolean;
            hook: { __typename?: 'Hook'; address: string };
        };
    }>;
};

export type SwapFragment = {
    id: string;
    pool: string;
    tokenIn: string;
    tokenInSymbol: string;
    tokenOut: string;
    tokenOutSymbol: string;
    tokenAmountIn: string;
    tokenAmountOut: string;
    swapFeeAmount: string;
    blockNumber: string;
    logIndex: string;
    blockTimestamp: string;
    transactionHash: string;
    user: { id: string };
};

export type SwapsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Swap_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<Swap_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type SwapsQuery = {
    swaps: Array<{
        id: string;
        pool: string;
        tokenIn: string;
        tokenInSymbol: string;
        tokenOut: string;
        tokenOutSymbol: string;
        tokenAmountIn: string;
        tokenAmountOut: string;
        swapFeeAmount: string;
        blockNumber: string;
        logIndex: string;
        blockTimestamp: string;
        transactionHash: string;
        user: { id: string };
    }>;
};

export type UserFragment = {
    id: string;
    swaps?:
        | Array<{
              id: string;
              pool: string;
              tokenIn: string;
              tokenOut: string;
              tokenAmountIn: string;
              tokenAmountOut: string;
              swapFeeAmount: string;
              blockNumber: string;
              blockTimestamp: string;
              transactionHash: string;
          }>
        | null
        | undefined;
    shares?: Array<{ id: string; balance: string; pool: { id: string } }> | null | undefined;
};

export type UsersQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<User_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type UsersQuery = {
    users: Array<{
        id: string;
        swaps?:
            | Array<{
                  id: string;
                  pool: string;
                  tokenIn: string;
                  tokenOut: string;
                  tokenAmountIn: string;
                  tokenAmountOut: string;
                  swapFeeAmount: string;
                  blockNumber: string;
                  blockTimestamp: string;
                  transactionHash: string;
              }>
            | null
            | undefined;
        shares?: Array<{ id: string; balance: string; pool: { id: string } }> | null | undefined;
    }>;
};

export const AddRemoveFragmentDoc = gql`
    fragment AddRemove on AddRemove {
        id
        type
        sender
        amounts
        pool {
            id
            tokens {
                index
                address
            }
        }
        user {
            id
        }
        blockNumber
        logIndex
        blockTimestamp
        transactionHash
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
export const PoolShareFragmentDoc = gql`
    fragment PoolShare on PoolShare {
        id
        balance
    }
`;
export const PoolSnapshotFragmentDoc = gql`
    fragment PoolSnapshot on PoolSnapshot {
        id
        pool {
            id
            swapFee
            tokens {
                index
                address
            }
        }
        timestamp
        balances
        totalShares
        swapsCount
        holdersCount
        totalSwapVolumes
        totalProtocolSwapFees
        totalProtocolYieldFees
    }
`;
export const VaultPoolFragmentDoc = gql`
    fragment VaultPool on Pool {
        id
        address
        name
        symbol
        totalShares
        pauseWindowEndTime
        pauseManager
        blockNumber
        blockTimestamp
        holdersCount
        transactionHash
        tokens {
            id
            address
            index
            name
            symbol
            decimals
            balance
            totalProtocolSwapFee
            totalProtocolYieldFee
            paysYieldFees
            nestedPool {
                id
            }
        }
        rateProviders {
            address
            token {
                address
            }
        }
        hookConfig {
            hook {
                address
            }
            enableHookAdjustedAmounts
            shouldCallAfterSwap
            shouldCallBeforeSwap
            shouldCallAfterInitialize
            shouldCallBeforeInitialize
            shouldCallAfterAddLiquidity
            shouldCallBeforeAddLiquidity
            shouldCallAfterRemoveLiquidity
            shouldCallBeforeRemoveLiquidity
            shouldCallComputeDynamicSwapFee
        }
    }
`;
export const SwapFragmentDoc = gql`
    fragment Swap on Swap {
        id
        pool
        tokenIn
        tokenInSymbol
        tokenOut
        tokenOutSymbol
        tokenAmountIn
        tokenAmountOut
        swapFeeAmount
        user {
            id
        }
        blockNumber
        logIndex
        blockTimestamp
        transactionHash
    }
`;
export const UserFragmentDoc = gql`
    fragment User on User {
        id
        swaps(first: 1000) {
            id
            pool
            tokenIn
            tokenOut
            tokenAmountIn
            tokenAmountOut
            swapFeeAmount
            blockNumber
            blockTimestamp
            transactionHash
        }
        shares(first: 1000) {
            id
            pool {
                id
            }
            balance
        }
    }
`;
export const AddRemoveDocument = gql`
    query AddRemove(
        $skip: Int
        $first: Int
        $orderBy: AddRemove_orderBy
        $orderDirection: OrderDirection
        $where: AddRemove_filter
        $block: Block_height
    ) {
        addRemoves(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...AddRemove
        }
    }
    ${AddRemoveFragmentDoc}
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
export const PoolSharesDocument = gql`
    query PoolShares(
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
            ...PoolShare
        }
    }
    ${PoolShareFragmentDoc}
`;
export const PoolSnapshotsDocument = gql`
    query PoolSnapshots(
        $skip: Int
        $first: Int
        $orderBy: PoolSnapshot_orderBy
        $orderDirection: OrderDirection
        $where: PoolSnapshot_filter
        $block: Block_height
    ) {
        poolSnapshots(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...PoolSnapshot
        }
    }
    ${PoolSnapshotFragmentDoc}
`;
export const PoolsDocument = gql`
    query Pools(
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
            ...VaultPool
        }
    }
    ${VaultPoolFragmentDoc}
`;
export const SwapsDocument = gql`
    query Swaps(
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
            ...Swap
        }
    }
    ${SwapFragmentDoc}
`;
export const UsersDocument = gql`
    query Users(
        $skip: Int
        $first: Int
        $orderBy: User_orderBy
        $orderDirection: OrderDirection
        $where: User_filter
        $block: Block_height
    ) {
        users(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...User
        }
    }
    ${UserFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        AddRemove(
            variables?: AddRemoveQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<AddRemoveQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<AddRemoveQuery>(AddRemoveDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'AddRemove',
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
            );
        },
        PoolShares(
            variables?: PoolSharesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<PoolSharesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<PoolSharesQuery>(PoolSharesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'PoolShares',
            );
        },
        PoolSnapshots(
            variables?: PoolSnapshotsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<PoolSnapshotsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<PoolSnapshotsQuery>(PoolSnapshotsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'PoolSnapshots',
            );
        },
        Pools(variables?: PoolsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<PoolsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<PoolsQuery>(PoolsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'Pools',
            );
        },
        Swaps(variables?: SwapsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SwapsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<SwapsQuery>(SwapsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'Swaps',
            );
        },
        Users(variables?: UsersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UsersQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<UsersQuery>(UsersDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'Users',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
