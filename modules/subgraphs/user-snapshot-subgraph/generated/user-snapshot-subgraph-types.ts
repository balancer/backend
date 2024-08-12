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

export type Gauge = {
    __typename?: 'Gauge';
    id: Scalars['ID'];
    symbol: Scalars['String'];
    /**  Token addess  */
    token: Token;
    userGaugeBalances?: Maybe<Array<UserGaugeBalance>>;
};

export type GaugeUserGaugeBalancesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserGaugeBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<UserGaugeBalance_Filter>;
};

export type Gauge_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<Gauge_Filter>>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<Gauge_Filter>>>;
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
    userGaugeBalances_?: InputMaybe<UserGaugeBalance_Filter>;
};

export enum Gauge_OrderBy {
    Id = 'id',
    Symbol = 'symbol',
    Token = 'token',
    TokenAddress = 'token__address',
    TokenDecimals = 'token__decimals',
    TokenId = 'token__id',
    TokenName = 'token__name',
    TokenSymbol = 'token__symbol',
    UserGaugeBalances = 'userGaugeBalances',
}

export type MasterChefFarm = {
    __typename?: 'MasterChefFarm';
    id: Scalars['ID'];
    token: Token;
    userFarmBalances?: Maybe<Array<UserMasterChefFarmBalance>>;
};

export type MasterChefFarmUserFarmBalancesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserMasterChefFarmBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<UserMasterChefFarmBalance_Filter>;
};

export type MasterChefFarm_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<MasterChefFarm_Filter>>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<MasterChefFarm_Filter>>>;
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
    userFarmBalances_?: InputMaybe<UserMasterChefFarmBalance_Filter>;
};

export enum MasterChefFarm_OrderBy {
    Id = 'id',
    Token = 'token',
    TokenAddress = 'token__address',
    TokenDecimals = 'token__decimals',
    TokenId = 'token__id',
    TokenName = 'token__name',
    TokenSymbol = 'token__symbol',
    UserFarmBalances = 'userFarmBalances',
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    gauge?: Maybe<Gauge>;
    gauges: Array<Gauge>;
    masterChefFarm?: Maybe<MasterChefFarm>;
    masterChefFarms: Array<MasterChefFarm>;
    token?: Maybe<Token>;
    tokenEvent?: Maybe<TokenEvent>;
    tokenEvents: Array<TokenEvent>;
    tokens: Array<Token>;
    transferEvent?: Maybe<TransferEvent>;
    transferEvents: Array<TransferEvent>;
    user?: Maybe<User>;
    userBalanceSnapshot?: Maybe<UserBalanceSnapshot>;
    userBalanceSnapshots: Array<UserBalanceSnapshot>;
    userGaugeBalance?: Maybe<UserGaugeBalance>;
    userGaugeBalances: Array<UserGaugeBalance>;
    userMasterChefFarmBalance?: Maybe<UserMasterChefFarmBalance>;
    userMasterChefFarmBalances: Array<UserMasterChefFarmBalance>;
    userWalletBalance?: Maybe<UserWalletBalance>;
    userWalletBalances: Array<UserWalletBalance>;
    users: Array<User>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGaugesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Gauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Gauge_Filter>;
};

export type QueryMasterChefFarmArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMasterChefFarmsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<MasterChefFarm_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<MasterChefFarm_Filter>;
};

export type QueryTokenArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTokenEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTokenEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<TokenEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<TokenEvent_Filter>;
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

export type QueryTransferEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTransferEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<TransferEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<TransferEvent_Filter>;
};

export type QueryUserArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUserBalanceSnapshotArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUserBalanceSnapshotsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserBalanceSnapshot_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<UserBalanceSnapshot_Filter>;
};

export type QueryUserGaugeBalanceArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUserGaugeBalancesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserGaugeBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<UserGaugeBalance_Filter>;
};

export type QueryUserMasterChefFarmBalanceArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUserMasterChefFarmBalancesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserMasterChefFarmBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<UserMasterChefFarmBalance_Filter>;
};

export type QueryUserWalletBalanceArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUserWalletBalancesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserWalletBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<UserWalletBalance_Filter>;
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

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    gauge?: Maybe<Gauge>;
    gauges: Array<Gauge>;
    masterChefFarm?: Maybe<MasterChefFarm>;
    masterChefFarms: Array<MasterChefFarm>;
    token?: Maybe<Token>;
    tokenEvent?: Maybe<TokenEvent>;
    tokenEvents: Array<TokenEvent>;
    tokens: Array<Token>;
    transferEvent?: Maybe<TransferEvent>;
    transferEvents: Array<TransferEvent>;
    user?: Maybe<User>;
    userBalanceSnapshot?: Maybe<UserBalanceSnapshot>;
    userBalanceSnapshots: Array<UserBalanceSnapshot>;
    userGaugeBalance?: Maybe<UserGaugeBalance>;
    userGaugeBalances: Array<UserGaugeBalance>;
    userMasterChefFarmBalance?: Maybe<UserMasterChefFarmBalance>;
    userMasterChefFarmBalances: Array<UserMasterChefFarmBalance>;
    userWalletBalance?: Maybe<UserWalletBalance>;
    userWalletBalances: Array<UserWalletBalance>;
    users: Array<User>;
};

export type Subscription_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type SubscriptionGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGaugesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Gauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Gauge_Filter>;
};

export type SubscriptionMasterChefFarmArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionMasterChefFarmsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<MasterChefFarm_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<MasterChefFarm_Filter>;
};

export type SubscriptionTokenArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTokenEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTokenEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<TokenEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<TokenEvent_Filter>;
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

export type SubscriptionTransferEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTransferEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<TransferEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<TransferEvent_Filter>;
};

export type SubscriptionUserArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUserBalanceSnapshotArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUserBalanceSnapshotsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserBalanceSnapshot_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<UserBalanceSnapshot_Filter>;
};

export type SubscriptionUserGaugeBalanceArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUserGaugeBalancesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserGaugeBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<UserGaugeBalance_Filter>;
};

export type SubscriptionUserMasterChefFarmBalanceArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUserMasterChefFarmBalancesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserMasterChefFarmBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<UserMasterChefFarmBalance_Filter>;
};

export type SubscriptionUserWalletBalanceArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUserWalletBalancesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserWalletBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<UserWalletBalance_Filter>;
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

export type Token = {
    __typename?: 'Token';
    /**  Token address  */
    address: Scalars['Bytes'];
    /**  Number of decimals the token uses  */
    decimals: Scalars['Int'];
    /**  List of token events  */
    events: Array<TokenEvent>;
    id: Scalars['ID'];
    /**  Human-readable name of the token  */
    name: Scalars['String'];
    /**  Symbol of the token  */
    symbol: Scalars['String'];
};

export type TokenEventsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<TokenEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<TokenEvent_Filter>;
};

export type TokenEvent = {
    amount: Scalars['BigDecimal'];
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    sender: Scalars['Bytes'];
    timestamp: Scalars['BigInt'];
    token: Token;
    transaction: Scalars['Bytes'];
};

export type TokenEvent_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    amount?: InputMaybe<Scalars['BigDecimal']>;
    amount_gt?: InputMaybe<Scalars['BigDecimal']>;
    amount_gte?: InputMaybe<Scalars['BigDecimal']>;
    amount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amount_lt?: InputMaybe<Scalars['BigDecimal']>;
    amount_lte?: InputMaybe<Scalars['BigDecimal']>;
    amount_not?: InputMaybe<Scalars['BigDecimal']>;
    amount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    and?: InputMaybe<Array<InputMaybe<TokenEvent_Filter>>>;
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
    or?: InputMaybe<Array<InputMaybe<TokenEvent_Filter>>>;
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
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    transaction?: InputMaybe<Scalars['Bytes']>;
    transaction_contains?: InputMaybe<Scalars['Bytes']>;
    transaction_gt?: InputMaybe<Scalars['Bytes']>;
    transaction_gte?: InputMaybe<Scalars['Bytes']>;
    transaction_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transaction_lt?: InputMaybe<Scalars['Bytes']>;
    transaction_lte?: InputMaybe<Scalars['Bytes']>;
    transaction_not?: InputMaybe<Scalars['Bytes']>;
    transaction_not_contains?: InputMaybe<Scalars['Bytes']>;
    transaction_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum TokenEvent_OrderBy {
    Amount = 'amount',
    Block = 'block',
    Id = 'id',
    Sender = 'sender',
    Timestamp = 'timestamp',
    Token = 'token',
    TokenAddress = 'token__address',
    TokenDecimals = 'token__decimals',
    TokenId = 'token__id',
    TokenName = 'token__name',
    TokenSymbol = 'token__symbol',
    Transaction = 'transaction',
}

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
    events_?: InputMaybe<TokenEvent_Filter>;
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
    Events = 'events',
    Id = 'id',
    Name = 'name',
    Symbol = 'symbol',
}

export type TransferEvent = TokenEvent & {
    __typename?: 'TransferEvent';
    /**  Quantity of tokens transferred  */
    amount: Scalars['BigDecimal'];
    /**  Block number  */
    block: Scalars['BigInt'];
    /**  Address of destination account  */
    destination: Scalars['Bytes'];
    id: Scalars['ID'];
    /**  Transaction sender address  */
    sender: Scalars['Bytes'];
    /**  Address of source account  */
    source: Scalars['Bytes'];
    /**  Event timestamp  */
    timestamp: Scalars['BigInt'];
    /**  Token address  */
    token: Token;
    /**  Transaction hash  */
    transaction: Scalars['Bytes'];
};

export type TransferEvent_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    amount?: InputMaybe<Scalars['BigDecimal']>;
    amount_gt?: InputMaybe<Scalars['BigDecimal']>;
    amount_gte?: InputMaybe<Scalars['BigDecimal']>;
    amount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amount_lt?: InputMaybe<Scalars['BigDecimal']>;
    amount_lte?: InputMaybe<Scalars['BigDecimal']>;
    amount_not?: InputMaybe<Scalars['BigDecimal']>;
    amount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    and?: InputMaybe<Array<InputMaybe<TransferEvent_Filter>>>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    destination?: InputMaybe<Scalars['Bytes']>;
    destination_contains?: InputMaybe<Scalars['Bytes']>;
    destination_gt?: InputMaybe<Scalars['Bytes']>;
    destination_gte?: InputMaybe<Scalars['Bytes']>;
    destination_in?: InputMaybe<Array<Scalars['Bytes']>>;
    destination_lt?: InputMaybe<Scalars['Bytes']>;
    destination_lte?: InputMaybe<Scalars['Bytes']>;
    destination_not?: InputMaybe<Scalars['Bytes']>;
    destination_not_contains?: InputMaybe<Scalars['Bytes']>;
    destination_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<TransferEvent_Filter>>>;
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
    source?: InputMaybe<Scalars['Bytes']>;
    source_contains?: InputMaybe<Scalars['Bytes']>;
    source_gt?: InputMaybe<Scalars['Bytes']>;
    source_gte?: InputMaybe<Scalars['Bytes']>;
    source_in?: InputMaybe<Array<Scalars['Bytes']>>;
    source_lt?: InputMaybe<Scalars['Bytes']>;
    source_lte?: InputMaybe<Scalars['Bytes']>;
    source_not?: InputMaybe<Scalars['Bytes']>;
    source_not_contains?: InputMaybe<Scalars['Bytes']>;
    source_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    transaction?: InputMaybe<Scalars['Bytes']>;
    transaction_contains?: InputMaybe<Scalars['Bytes']>;
    transaction_gt?: InputMaybe<Scalars['Bytes']>;
    transaction_gte?: InputMaybe<Scalars['Bytes']>;
    transaction_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transaction_lt?: InputMaybe<Scalars['Bytes']>;
    transaction_lte?: InputMaybe<Scalars['Bytes']>;
    transaction_not?: InputMaybe<Scalars['Bytes']>;
    transaction_not_contains?: InputMaybe<Scalars['Bytes']>;
    transaction_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum TransferEvent_OrderBy {
    Amount = 'amount',
    Block = 'block',
    Destination = 'destination',
    Id = 'id',
    Sender = 'sender',
    Source = 'source',
    Timestamp = 'timestamp',
    Token = 'token',
    TokenAddress = 'token__address',
    TokenDecimals = 'token__decimals',
    TokenId = 'token__id',
    TokenName = 'token__name',
    TokenSymbol = 'token__symbol',
    Transaction = 'transaction',
}

export type User = {
    __typename?: 'User';
    /**  User address  */
    address: Scalars['Bytes'];
    /**  Token balances that this user has staked in farms */
    farmBalances: Array<UserMasterChefFarmBalance>;
    farms: Array<Scalars['String']>;
    /**  Token balances that this user has staked in gauges */
    gaugeBalances: Array<UserGaugeBalance>;
    gauges: Array<Scalars['Bytes']>;
    /**  Equals to: <userAddress> */
    id: Scalars['ID'];
    /**  Token balances that this user holds in their wallet  */
    walletBalances: Array<UserWalletBalance>;
    walletTokens: Array<Scalars['Bytes']>;
};

export type UserFarmBalancesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserMasterChefFarmBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<UserMasterChefFarmBalance_Filter>;
};

export type UserGaugeBalancesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserGaugeBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<UserGaugeBalance_Filter>;
};

export type UserWalletBalancesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<UserWalletBalance_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<UserWalletBalance_Filter>;
};

export type UserBalanceSnapshot = {
    __typename?: 'UserBalanceSnapshot';
    farmBalances: Array<Scalars['BigDecimal']>;
    farms: Array<Scalars['String']>;
    gaugeBalances: Array<Scalars['BigDecimal']>;
    gauges: Array<Scalars['Bytes']>;
    /**  Equals to: <userAddress>-<dayTimestamp> */
    id: Scalars['ID'];
    /**  Timestamp in seconds, rounded down to the closest day  */
    timestamp: Scalars['Int'];
    /**  Account address  */
    user: User;
    walletBalances: Array<Scalars['BigDecimal']>;
    walletTokens: Array<Scalars['Bytes']>;
};

export type UserBalanceSnapshot_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<UserBalanceSnapshot_Filter>>>;
    farmBalances?: InputMaybe<Array<Scalars['BigDecimal']>>;
    farmBalances_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    farmBalances_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    farmBalances_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    farmBalances_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    farmBalances_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    farms?: InputMaybe<Array<Scalars['String']>>;
    farms_contains?: InputMaybe<Array<Scalars['String']>>;
    farms_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
    farms_not?: InputMaybe<Array<Scalars['String']>>;
    farms_not_contains?: InputMaybe<Array<Scalars['String']>>;
    farms_not_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
    gaugeBalances?: InputMaybe<Array<Scalars['BigDecimal']>>;
    gaugeBalances_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    gaugeBalances_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    gaugeBalances_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    gaugeBalances_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    gaugeBalances_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    gauges?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_not?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<UserBalanceSnapshot_Filter>>>;
    timestamp?: InputMaybe<Scalars['Int']>;
    timestamp_gt?: InputMaybe<Scalars['Int']>;
    timestamp_gte?: InputMaybe<Scalars['Int']>;
    timestamp_in?: InputMaybe<Array<Scalars['Int']>>;
    timestamp_lt?: InputMaybe<Scalars['Int']>;
    timestamp_lte?: InputMaybe<Scalars['Int']>;
    timestamp_not?: InputMaybe<Scalars['Int']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['Int']>>;
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
    walletBalances?: InputMaybe<Array<Scalars['BigDecimal']>>;
    walletBalances_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    walletBalances_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    walletBalances_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    walletBalances_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    walletBalances_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    walletTokens?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_not?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum UserBalanceSnapshot_OrderBy {
    FarmBalances = 'farmBalances',
    Farms = 'farms',
    GaugeBalances = 'gaugeBalances',
    Gauges = 'gauges',
    Id = 'id',
    Timestamp = 'timestamp',
    User = 'user',
    UserAddress = 'user__address',
    UserId = 'user__id',
    WalletBalances = 'walletBalances',
    WalletTokens = 'walletTokens',
}

export type UserGaugeBalance = {
    __typename?: 'UserGaugeBalance';
    balance: Scalars['BigDecimal'];
    /**  Block number in which the balance was last modified  */
    block?: Maybe<Scalars['BigInt']>;
    gauge: Gauge;
    id: Scalars['ID'];
    /**  Last modified timestamp in seconds  */
    modified?: Maybe<Scalars['BigInt']>;
    /**  Hash of the last transaction that modified the balance  */
    transaction?: Maybe<Scalars['Bytes']>;
    user: User;
};

export type UserGaugeBalance_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<UserGaugeBalance_Filter>>>;
    balance?: InputMaybe<Scalars['BigDecimal']>;
    balance_gt?: InputMaybe<Scalars['BigDecimal']>;
    balance_gte?: InputMaybe<Scalars['BigDecimal']>;
    balance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: InputMaybe<Scalars['BigDecimal']>;
    balance_lte?: InputMaybe<Scalars['BigDecimal']>;
    balance_not?: InputMaybe<Scalars['BigDecimal']>;
    balance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    gauge?: InputMaybe<Scalars['String']>;
    gauge_?: InputMaybe<Gauge_Filter>;
    gauge_contains?: InputMaybe<Scalars['String']>;
    gauge_contains_nocase?: InputMaybe<Scalars['String']>;
    gauge_ends_with?: InputMaybe<Scalars['String']>;
    gauge_ends_with_nocase?: InputMaybe<Scalars['String']>;
    gauge_gt?: InputMaybe<Scalars['String']>;
    gauge_gte?: InputMaybe<Scalars['String']>;
    gauge_in?: InputMaybe<Array<Scalars['String']>>;
    gauge_lt?: InputMaybe<Scalars['String']>;
    gauge_lte?: InputMaybe<Scalars['String']>;
    gauge_not?: InputMaybe<Scalars['String']>;
    gauge_not_contains?: InputMaybe<Scalars['String']>;
    gauge_not_contains_nocase?: InputMaybe<Scalars['String']>;
    gauge_not_ends_with?: InputMaybe<Scalars['String']>;
    gauge_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    gauge_not_in?: InputMaybe<Array<Scalars['String']>>;
    gauge_not_starts_with?: InputMaybe<Scalars['String']>;
    gauge_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    gauge_starts_with?: InputMaybe<Scalars['String']>;
    gauge_starts_with_nocase?: InputMaybe<Scalars['String']>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    modified?: InputMaybe<Scalars['BigInt']>;
    modified_gt?: InputMaybe<Scalars['BigInt']>;
    modified_gte?: InputMaybe<Scalars['BigInt']>;
    modified_in?: InputMaybe<Array<Scalars['BigInt']>>;
    modified_lt?: InputMaybe<Scalars['BigInt']>;
    modified_lte?: InputMaybe<Scalars['BigInt']>;
    modified_not?: InputMaybe<Scalars['BigInt']>;
    modified_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    or?: InputMaybe<Array<InputMaybe<UserGaugeBalance_Filter>>>;
    transaction?: InputMaybe<Scalars['Bytes']>;
    transaction_contains?: InputMaybe<Scalars['Bytes']>;
    transaction_gt?: InputMaybe<Scalars['Bytes']>;
    transaction_gte?: InputMaybe<Scalars['Bytes']>;
    transaction_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transaction_lt?: InputMaybe<Scalars['Bytes']>;
    transaction_lte?: InputMaybe<Scalars['Bytes']>;
    transaction_not?: InputMaybe<Scalars['Bytes']>;
    transaction_not_contains?: InputMaybe<Scalars['Bytes']>;
    transaction_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
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

export enum UserGaugeBalance_OrderBy {
    Balance = 'balance',
    Block = 'block',
    Gauge = 'gauge',
    GaugeId = 'gauge__id',
    GaugeSymbol = 'gauge__symbol',
    Id = 'id',
    Modified = 'modified',
    Transaction = 'transaction',
    User = 'user',
    UserAddress = 'user__address',
    UserId = 'user__id',
}

export type UserMasterChefFarmBalance = {
    __typename?: 'UserMasterChefFarmBalance';
    balance: Scalars['BigDecimal'];
    farm: MasterChefFarm;
    id: Scalars['ID'];
    user: User;
};

export type UserMasterChefFarmBalance_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<UserMasterChefFarmBalance_Filter>>>;
    balance?: InputMaybe<Scalars['BigDecimal']>;
    balance_gt?: InputMaybe<Scalars['BigDecimal']>;
    balance_gte?: InputMaybe<Scalars['BigDecimal']>;
    balance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: InputMaybe<Scalars['BigDecimal']>;
    balance_lte?: InputMaybe<Scalars['BigDecimal']>;
    balance_not?: InputMaybe<Scalars['BigDecimal']>;
    balance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    farm?: InputMaybe<Scalars['String']>;
    farm_?: InputMaybe<MasterChefFarm_Filter>;
    farm_contains?: InputMaybe<Scalars['String']>;
    farm_contains_nocase?: InputMaybe<Scalars['String']>;
    farm_ends_with?: InputMaybe<Scalars['String']>;
    farm_ends_with_nocase?: InputMaybe<Scalars['String']>;
    farm_gt?: InputMaybe<Scalars['String']>;
    farm_gte?: InputMaybe<Scalars['String']>;
    farm_in?: InputMaybe<Array<Scalars['String']>>;
    farm_lt?: InputMaybe<Scalars['String']>;
    farm_lte?: InputMaybe<Scalars['String']>;
    farm_not?: InputMaybe<Scalars['String']>;
    farm_not_contains?: InputMaybe<Scalars['String']>;
    farm_not_contains_nocase?: InputMaybe<Scalars['String']>;
    farm_not_ends_with?: InputMaybe<Scalars['String']>;
    farm_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    farm_not_in?: InputMaybe<Array<Scalars['String']>>;
    farm_not_starts_with?: InputMaybe<Scalars['String']>;
    farm_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    farm_starts_with?: InputMaybe<Scalars['String']>;
    farm_starts_with_nocase?: InputMaybe<Scalars['String']>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<UserMasterChefFarmBalance_Filter>>>;
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

export enum UserMasterChefFarmBalance_OrderBy {
    Balance = 'balance',
    Farm = 'farm',
    FarmId = 'farm__id',
    Id = 'id',
    User = 'user',
    UserAddress = 'user__address',
    UserId = 'user__id',
}

export type UserWalletBalance = {
    __typename?: 'UserWalletBalance';
    /**  Current account balance  */
    balance: Scalars['BigDecimal'];
    /**  Block number in which the balance was last modified  */
    block?: Maybe<Scalars['BigInt']>;
    /**  Equals to: <accountAddress>-<tokenAddress> */
    id: Scalars['ID'];
    /**  Last modified timestamp in seconds  */
    modified?: Maybe<Scalars['BigInt']>;
    /**  Token address  */
    token: Token;
    /**  Hash of the last transaction that modified the balance  */
    transaction?: Maybe<Scalars['Bytes']>;
    /**  Account address  */
    user: User;
};

export type UserWalletBalance_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<UserWalletBalance_Filter>>>;
    balance?: InputMaybe<Scalars['BigDecimal']>;
    balance_gt?: InputMaybe<Scalars['BigDecimal']>;
    balance_gte?: InputMaybe<Scalars['BigDecimal']>;
    balance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: InputMaybe<Scalars['BigDecimal']>;
    balance_lte?: InputMaybe<Scalars['BigDecimal']>;
    balance_not?: InputMaybe<Scalars['BigDecimal']>;
    balance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
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
    modified?: InputMaybe<Scalars['BigInt']>;
    modified_gt?: InputMaybe<Scalars['BigInt']>;
    modified_gte?: InputMaybe<Scalars['BigInt']>;
    modified_in?: InputMaybe<Array<Scalars['BigInt']>>;
    modified_lt?: InputMaybe<Scalars['BigInt']>;
    modified_lte?: InputMaybe<Scalars['BigInt']>;
    modified_not?: InputMaybe<Scalars['BigInt']>;
    modified_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    or?: InputMaybe<Array<InputMaybe<UserWalletBalance_Filter>>>;
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
    transaction?: InputMaybe<Scalars['Bytes']>;
    transaction_contains?: InputMaybe<Scalars['Bytes']>;
    transaction_gt?: InputMaybe<Scalars['Bytes']>;
    transaction_gte?: InputMaybe<Scalars['Bytes']>;
    transaction_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transaction_lt?: InputMaybe<Scalars['Bytes']>;
    transaction_lte?: InputMaybe<Scalars['Bytes']>;
    transaction_not?: InputMaybe<Scalars['Bytes']>;
    transaction_not_contains?: InputMaybe<Scalars['Bytes']>;
    transaction_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
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

export enum UserWalletBalance_OrderBy {
    Balance = 'balance',
    Block = 'block',
    Id = 'id',
    Modified = 'modified',
    Token = 'token',
    TokenAddress = 'token__address',
    TokenDecimals = 'token__decimals',
    TokenId = 'token__id',
    TokenName = 'token__name',
    TokenSymbol = 'token__symbol',
    Transaction = 'transaction',
    User = 'user',
    UserAddress = 'user__address',
    UserId = 'user__id',
}

export type User_Filter = {
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
    and?: InputMaybe<Array<InputMaybe<User_Filter>>>;
    farmBalances_?: InputMaybe<UserMasterChefFarmBalance_Filter>;
    farms?: InputMaybe<Array<Scalars['String']>>;
    farms_contains?: InputMaybe<Array<Scalars['String']>>;
    farms_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
    farms_not?: InputMaybe<Array<Scalars['String']>>;
    farms_not_contains?: InputMaybe<Array<Scalars['String']>>;
    farms_not_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
    gaugeBalances_?: InputMaybe<UserGaugeBalance_Filter>;
    gauges?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_not?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<User_Filter>>>;
    walletBalances_?: InputMaybe<UserWalletBalance_Filter>;
    walletTokens?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_not?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    walletTokens_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum User_OrderBy {
    Address = 'address',
    FarmBalances = 'farmBalances',
    Farms = 'farms',
    GaugeBalances = 'gaugeBalances',
    Gauges = 'gauges',
    Id = 'id',
    WalletBalances = 'walletBalances',
    WalletTokens = 'walletTokens',
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

export type UserSnapshotGetMetaQueryVariables = Exact<{ [key: string]: never }>;

export type UserSnapshotGetMetaQuery = {
    __typename?: 'Query';
    meta?:
        | {
              __typename?: '_Meta_';
              deployment: string;
              hasIndexingErrors: boolean;
              block: { __typename?: '_Block_'; number: number };
          }
        | null
        | undefined;
};

export type UserBalanceSnapshotsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<UserBalanceSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<UserBalanceSnapshot_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type UserBalanceSnapshotsQuery = {
    __typename?: 'Query';
    snapshots: Array<{
        __typename?: 'UserBalanceSnapshot';
        id: string;
        timestamp: number;
        farmBalances: Array<string>;
        farms: Array<string>;
        gaugeBalances: Array<string>;
        gauges: Array<string>;
        walletBalances: Array<string>;
        walletTokens: Array<string>;
        user: { __typename?: 'User'; id: string };
    }>;
};

export type UserBalanceSnapshotFragment = {
    __typename?: 'UserBalanceSnapshot';
    id: string;
    timestamp: number;
    farmBalances: Array<string>;
    farms: Array<string>;
    gaugeBalances: Array<string>;
    gauges: Array<string>;
    walletBalances: Array<string>;
    walletTokens: Array<string>;
    user: { __typename?: 'User'; id: string };
};

export const UserBalanceSnapshotFragmentDoc = gql`
    fragment UserBalanceSnapshot on UserBalanceSnapshot {
        id
        timestamp
        farmBalances
        farms
        gaugeBalances
        gauges
        walletBalances
        walletTokens
        user {
            id
        }
    }
`;
export const UserSnapshotGetMetaDocument = gql`
    query UserSnapshotGetMeta {
        meta: _meta {
            block {
                number
            }
            deployment
            hasIndexingErrors
        }
    }
`;
export const UserBalanceSnapshotsDocument = gql`
    query UserBalanceSnapshots(
        $skip: Int
        $first: Int
        $orderBy: UserBalanceSnapshot_orderBy
        $orderDirection: OrderDirection
        $where: UserBalanceSnapshot_filter
        $block: Block_height
    ) {
        snapshots: userBalanceSnapshots(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...UserBalanceSnapshot
        }
    }
    ${UserBalanceSnapshotFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        UserSnapshotGetMeta(
            variables?: UserSnapshotGetMetaQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<UserSnapshotGetMetaQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<UserSnapshotGetMetaQuery>(UserSnapshotGetMetaDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'UserSnapshotGetMeta',
            );
        },
        UserBalanceSnapshots(
            variables?: UserBalanceSnapshotsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<UserBalanceSnapshotsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<UserBalanceSnapshotsQuery>(UserBalanceSnapshotsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'UserBalanceSnapshots',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
