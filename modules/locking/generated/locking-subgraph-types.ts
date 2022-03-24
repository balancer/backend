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
};

/** The block at which the query should be executed. */
export type Block_Height = {
    /** Value containing a block hash */
    hash?: InputMaybe<Scalars['Bytes']>;
    /** Value containing a block number */
    number?: InputMaybe<Scalars['Int']>;
    /**
     * Value containing the minimum block number.
     * In the case of `number_gte`, the query will be executed on the latest block only if
     * the subgraph has progressed to or past the minimum block number.
     * Defaults to the latest block when omitted.
     *
     */
    number_gte?: InputMaybe<Scalars['Int']>;
};

export type ClaimedReward = {
    __typename?: 'ClaimedReward';
    amount: Scalars['BigDecimal'];
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    timestamp: Scalars['BigInt'];
    token: Scalars['Bytes'];
    user: User;
};

export type ClaimedReward_Filter = {
    amount?: InputMaybe<Scalars['BigDecimal']>;
    amount_gt?: InputMaybe<Scalars['BigDecimal']>;
    amount_gte?: InputMaybe<Scalars['BigDecimal']>;
    amount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    amount_lt?: InputMaybe<Scalars['BigDecimal']>;
    amount_lte?: InputMaybe<Scalars['BigDecimal']>;
    amount_not?: InputMaybe<Scalars['BigDecimal']>;
    amount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
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
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    token?: InputMaybe<Scalars['Bytes']>;
    token_contains?: InputMaybe<Scalars['Bytes']>;
    token_in?: InputMaybe<Array<Scalars['Bytes']>>;
    token_not?: InputMaybe<Scalars['Bytes']>;
    token_not_contains?: InputMaybe<Scalars['Bytes']>;
    token_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    user?: InputMaybe<Scalars['String']>;
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

export enum ClaimedReward_OrderBy {
    Amount = 'amount',
    Block = 'block',
    Id = 'id',
    Timestamp = 'timestamp',
    Token = 'token',
    User = 'user',
}

export type Locker = {
    __typename?: 'Locker';
    address: Scalars['Bytes'];
    block: Scalars['BigInt'];
    decimals: Scalars['Int'];
    epochDuration: Scalars['BigInt'];
    id: Scalars['ID'];
    kickRewardEpochDelay: Scalars['BigInt'];
    kickRewardPerEpoch: Scalars['BigInt'];
    lockDuration: Scalars['BigInt'];
    name: Scalars['String'];
    rewardTokens?: Maybe<Array<RewardToken>>;
    symbol: Scalars['String'];
    timestamp: Scalars['BigInt'];
    totalLockedAmount: Scalars['BigDecimal'];
    users: Array<User>;
};

export type LockerRewardTokensArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RewardToken_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<RewardToken_Filter>;
};

export type LockerUsersArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<User_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<User_Filter>;
};

export type Locker_Filter = {
    address?: InputMaybe<Scalars['Bytes']>;
    address_contains?: InputMaybe<Scalars['Bytes']>;
    address_in?: InputMaybe<Array<Scalars['Bytes']>>;
    address_not?: InputMaybe<Scalars['Bytes']>;
    address_not_contains?: InputMaybe<Scalars['Bytes']>;
    address_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    decimals?: InputMaybe<Scalars['Int']>;
    decimals_gt?: InputMaybe<Scalars['Int']>;
    decimals_gte?: InputMaybe<Scalars['Int']>;
    decimals_in?: InputMaybe<Array<Scalars['Int']>>;
    decimals_lt?: InputMaybe<Scalars['Int']>;
    decimals_lte?: InputMaybe<Scalars['Int']>;
    decimals_not?: InputMaybe<Scalars['Int']>;
    decimals_not_in?: InputMaybe<Array<Scalars['Int']>>;
    epochDuration?: InputMaybe<Scalars['BigInt']>;
    epochDuration_gt?: InputMaybe<Scalars['BigInt']>;
    epochDuration_gte?: InputMaybe<Scalars['BigInt']>;
    epochDuration_in?: InputMaybe<Array<Scalars['BigInt']>>;
    epochDuration_lt?: InputMaybe<Scalars['BigInt']>;
    epochDuration_lte?: InputMaybe<Scalars['BigInt']>;
    epochDuration_not?: InputMaybe<Scalars['BigInt']>;
    epochDuration_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    kickRewardEpochDelay?: InputMaybe<Scalars['BigInt']>;
    kickRewardEpochDelay_gt?: InputMaybe<Scalars['BigInt']>;
    kickRewardEpochDelay_gte?: InputMaybe<Scalars['BigInt']>;
    kickRewardEpochDelay_in?: InputMaybe<Array<Scalars['BigInt']>>;
    kickRewardEpochDelay_lt?: InputMaybe<Scalars['BigInt']>;
    kickRewardEpochDelay_lte?: InputMaybe<Scalars['BigInt']>;
    kickRewardEpochDelay_not?: InputMaybe<Scalars['BigInt']>;
    kickRewardEpochDelay_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    kickRewardPerEpoch?: InputMaybe<Scalars['BigInt']>;
    kickRewardPerEpoch_gt?: InputMaybe<Scalars['BigInt']>;
    kickRewardPerEpoch_gte?: InputMaybe<Scalars['BigInt']>;
    kickRewardPerEpoch_in?: InputMaybe<Array<Scalars['BigInt']>>;
    kickRewardPerEpoch_lt?: InputMaybe<Scalars['BigInt']>;
    kickRewardPerEpoch_lte?: InputMaybe<Scalars['BigInt']>;
    kickRewardPerEpoch_not?: InputMaybe<Scalars['BigInt']>;
    kickRewardPerEpoch_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lockDuration?: InputMaybe<Scalars['BigInt']>;
    lockDuration_gt?: InputMaybe<Scalars['BigInt']>;
    lockDuration_gte?: InputMaybe<Scalars['BigInt']>;
    lockDuration_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lockDuration_lt?: InputMaybe<Scalars['BigInt']>;
    lockDuration_lte?: InputMaybe<Scalars['BigInt']>;
    lockDuration_not?: InputMaybe<Scalars['BigInt']>;
    lockDuration_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    totalLockedAmount?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalLockedAmount_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_not?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum Locker_OrderBy {
    Address = 'address',
    Block = 'block',
    Decimals = 'decimals',
    EpochDuration = 'epochDuration',
    Id = 'id',
    KickRewardEpochDelay = 'kickRewardEpochDelay',
    KickRewardPerEpoch = 'kickRewardPerEpoch',
    LockDuration = 'lockDuration',
    Name = 'name',
    RewardTokens = 'rewardTokens',
    Symbol = 'symbol',
    Timestamp = 'timestamp',
    TotalLockedAmount = 'totalLockedAmount',
    Users = 'users',
}

export type LockingPeriod = {
    __typename?: 'LockingPeriod';
    block: Scalars['BigInt'];
    epoch: Scalars['BigInt'];
    id: Scalars['ID'];
    lockAmount: Scalars['BigDecimal'];
    timestamp: Scalars['BigInt'];
    user: User;
};

export type LockingPeriod_Filter = {
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    epoch?: InputMaybe<Scalars['BigInt']>;
    epoch_gt?: InputMaybe<Scalars['BigInt']>;
    epoch_gte?: InputMaybe<Scalars['BigInt']>;
    epoch_in?: InputMaybe<Array<Scalars['BigInt']>>;
    epoch_lt?: InputMaybe<Scalars['BigInt']>;
    epoch_lte?: InputMaybe<Scalars['BigInt']>;
    epoch_not?: InputMaybe<Scalars['BigInt']>;
    epoch_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    lockAmount?: InputMaybe<Scalars['BigDecimal']>;
    lockAmount_gt?: InputMaybe<Scalars['BigDecimal']>;
    lockAmount_gte?: InputMaybe<Scalars['BigDecimal']>;
    lockAmount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    lockAmount_lt?: InputMaybe<Scalars['BigDecimal']>;
    lockAmount_lte?: InputMaybe<Scalars['BigDecimal']>;
    lockAmount_not?: InputMaybe<Scalars['BigDecimal']>;
    lockAmount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    user?: InputMaybe<Scalars['String']>;
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

export enum LockingPeriod_OrderBy {
    Block = 'block',
    Epoch = 'epoch',
    Id = 'id',
    LockAmount = 'lockAmount',
    Timestamp = 'timestamp',
    User = 'user',
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
    claimedReward?: Maybe<ClaimedReward>;
    claimedRewards: Array<ClaimedReward>;
    locker?: Maybe<Locker>;
    lockers: Array<Locker>;
    lockingPeriod?: Maybe<LockingPeriod>;
    lockingPeriods: Array<LockingPeriod>;
    rewardToken?: Maybe<RewardToken>;
    rewardTokens: Array<RewardToken>;
    user?: Maybe<User>;
    users: Array<User>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryClaimedRewardArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryClaimedRewardsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<ClaimedReward_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<ClaimedReward_Filter>;
};

export type QueryLockerArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLockersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Locker_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Locker_Filter>;
};

export type QueryLockingPeriodArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLockingPeriodsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LockingPeriod_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LockingPeriod_Filter>;
};

export type QueryRewardTokenArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRewardTokensArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RewardToken_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<RewardToken_Filter>;
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

export type RewardToken = {
    __typename?: 'RewardToken';
    block: Scalars['BigInt'];
    decimals: Scalars['Int'];
    id: Scalars['ID'];
    locker: Locker;
    rewardPeriodFinish: Scalars['BigInt'];
    rewardRate: Scalars['BigDecimal'];
    rewardToken: Scalars['Bytes'];
    timestamp: Scalars['BigInt'];
    totalRewardAmount: Scalars['BigDecimal'];
};

export type RewardToken_Filter = {
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    locker?: InputMaybe<Scalars['String']>;
    locker_contains?: InputMaybe<Scalars['String']>;
    locker_contains_nocase?: InputMaybe<Scalars['String']>;
    locker_ends_with?: InputMaybe<Scalars['String']>;
    locker_ends_with_nocase?: InputMaybe<Scalars['String']>;
    locker_gt?: InputMaybe<Scalars['String']>;
    locker_gte?: InputMaybe<Scalars['String']>;
    locker_in?: InputMaybe<Array<Scalars['String']>>;
    locker_lt?: InputMaybe<Scalars['String']>;
    locker_lte?: InputMaybe<Scalars['String']>;
    locker_not?: InputMaybe<Scalars['String']>;
    locker_not_contains?: InputMaybe<Scalars['String']>;
    locker_not_contains_nocase?: InputMaybe<Scalars['String']>;
    locker_not_ends_with?: InputMaybe<Scalars['String']>;
    locker_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    locker_not_in?: InputMaybe<Array<Scalars['String']>>;
    locker_not_starts_with?: InputMaybe<Scalars['String']>;
    locker_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    locker_starts_with?: InputMaybe<Scalars['String']>;
    locker_starts_with_nocase?: InputMaybe<Scalars['String']>;
    rewardPeriodFinish?: InputMaybe<Scalars['BigInt']>;
    rewardPeriodFinish_gt?: InputMaybe<Scalars['BigInt']>;
    rewardPeriodFinish_gte?: InputMaybe<Scalars['BigInt']>;
    rewardPeriodFinish_in?: InputMaybe<Array<Scalars['BigInt']>>;
    rewardPeriodFinish_lt?: InputMaybe<Scalars['BigInt']>;
    rewardPeriodFinish_lte?: InputMaybe<Scalars['BigInt']>;
    rewardPeriodFinish_not?: InputMaybe<Scalars['BigInt']>;
    rewardPeriodFinish_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    rewardRate?: InputMaybe<Scalars['BigDecimal']>;
    rewardRate_gt?: InputMaybe<Scalars['BigDecimal']>;
    rewardRate_gte?: InputMaybe<Scalars['BigDecimal']>;
    rewardRate_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    rewardRate_lt?: InputMaybe<Scalars['BigDecimal']>;
    rewardRate_lte?: InputMaybe<Scalars['BigDecimal']>;
    rewardRate_not?: InputMaybe<Scalars['BigDecimal']>;
    rewardRate_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    rewardToken?: InputMaybe<Scalars['Bytes']>;
    rewardToken_contains?: InputMaybe<Scalars['Bytes']>;
    rewardToken_in?: InputMaybe<Array<Scalars['Bytes']>>;
    rewardToken_not?: InputMaybe<Scalars['Bytes']>;
    rewardToken_not_contains?: InputMaybe<Scalars['Bytes']>;
    rewardToken_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    totalRewardAmount?: InputMaybe<Scalars['BigDecimal']>;
    totalRewardAmount_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalRewardAmount_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalRewardAmount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalRewardAmount_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalRewardAmount_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalRewardAmount_not?: InputMaybe<Scalars['BigDecimal']>;
    totalRewardAmount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum RewardToken_OrderBy {
    Block = 'block',
    Decimals = 'decimals',
    Id = 'id',
    Locker = 'locker',
    RewardPeriodFinish = 'rewardPeriodFinish',
    RewardRate = 'rewardRate',
    RewardToken = 'rewardToken',
    Timestamp = 'timestamp',
    TotalRewardAmount = 'totalRewardAmount',
}

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    claimedReward?: Maybe<ClaimedReward>;
    claimedRewards: Array<ClaimedReward>;
    locker?: Maybe<Locker>;
    lockers: Array<Locker>;
    lockingPeriod?: Maybe<LockingPeriod>;
    lockingPeriods: Array<LockingPeriod>;
    rewardToken?: Maybe<RewardToken>;
    rewardTokens: Array<RewardToken>;
    user?: Maybe<User>;
    users: Array<User>;
};

export type Subscription_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type SubscriptionClaimedRewardArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionClaimedRewardsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<ClaimedReward_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<ClaimedReward_Filter>;
};

export type SubscriptionLockerArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionLockersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Locker_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Locker_Filter>;
};

export type SubscriptionLockingPeriodArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionLockingPeriodsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LockingPeriod_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LockingPeriod_Filter>;
};

export type SubscriptionRewardTokenArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionRewardTokensArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RewardToken_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<RewardToken_Filter>;
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

export type User = {
    __typename?: 'User';
    address: Scalars['Bytes'];
    block: Scalars['BigInt'];
    claimedRewards: Array<ClaimedReward>;
    collectedKickRewardAmount: Scalars['BigDecimal'];
    id: Scalars['ID'];
    locker: Locker;
    lockingPeriods: Array<LockingPeriod>;
    timestamp: Scalars['BigInt'];
    totalLockedAmount: Scalars['BigDecimal'];
    totalLostThroughKick: Scalars['BigDecimal'];
};

export type UserClaimedRewardsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<ClaimedReward_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<ClaimedReward_Filter>;
};

export type UserLockingPeriodsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LockingPeriod_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<LockingPeriod_Filter>;
};

export type User_Filter = {
    address?: InputMaybe<Scalars['Bytes']>;
    address_contains?: InputMaybe<Scalars['Bytes']>;
    address_in?: InputMaybe<Array<Scalars['Bytes']>>;
    address_not?: InputMaybe<Scalars['Bytes']>;
    address_not_contains?: InputMaybe<Scalars['Bytes']>;
    address_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    collectedKickRewardAmount?: InputMaybe<Scalars['BigDecimal']>;
    collectedKickRewardAmount_gt?: InputMaybe<Scalars['BigDecimal']>;
    collectedKickRewardAmount_gte?: InputMaybe<Scalars['BigDecimal']>;
    collectedKickRewardAmount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    collectedKickRewardAmount_lt?: InputMaybe<Scalars['BigDecimal']>;
    collectedKickRewardAmount_lte?: InputMaybe<Scalars['BigDecimal']>;
    collectedKickRewardAmount_not?: InputMaybe<Scalars['BigDecimal']>;
    collectedKickRewardAmount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    locker?: InputMaybe<Scalars['String']>;
    locker_contains?: InputMaybe<Scalars['String']>;
    locker_contains_nocase?: InputMaybe<Scalars['String']>;
    locker_ends_with?: InputMaybe<Scalars['String']>;
    locker_ends_with_nocase?: InputMaybe<Scalars['String']>;
    locker_gt?: InputMaybe<Scalars['String']>;
    locker_gte?: InputMaybe<Scalars['String']>;
    locker_in?: InputMaybe<Array<Scalars['String']>>;
    locker_lt?: InputMaybe<Scalars['String']>;
    locker_lte?: InputMaybe<Scalars['String']>;
    locker_not?: InputMaybe<Scalars['String']>;
    locker_not_contains?: InputMaybe<Scalars['String']>;
    locker_not_contains_nocase?: InputMaybe<Scalars['String']>;
    locker_not_ends_with?: InputMaybe<Scalars['String']>;
    locker_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    locker_not_in?: InputMaybe<Array<Scalars['String']>>;
    locker_not_starts_with?: InputMaybe<Scalars['String']>;
    locker_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    locker_starts_with?: InputMaybe<Scalars['String']>;
    locker_starts_with_nocase?: InputMaybe<Scalars['String']>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    totalLockedAmount?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalLockedAmount_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_not?: InputMaybe<Scalars['BigDecimal']>;
    totalLockedAmount_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalLostThroughKick?: InputMaybe<Scalars['BigDecimal']>;
    totalLostThroughKick_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalLostThroughKick_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalLostThroughKick_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalLostThroughKick_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalLostThroughKick_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalLostThroughKick_not?: InputMaybe<Scalars['BigDecimal']>;
    totalLostThroughKick_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum User_OrderBy {
    Address = 'address',
    Block = 'block',
    ClaimedRewards = 'claimedRewards',
    CollectedKickRewardAmount = 'collectedKickRewardAmount',
    Id = 'id',
    Locker = 'locker',
    LockingPeriods = 'lockingPeriods',
    Timestamp = 'timestamp',
    TotalLockedAmount = 'totalLockedAmount',
    TotalLostThroughKick = 'totalLostThroughKick',
}

export type _Block_ = {
    __typename?: '_Block_';
    /** The hash of the block */
    hash?: Maybe<Scalars['Bytes']>;
    /** The block number */
    number: Scalars['Int'];
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

export type LockerPartialFragment = {
    __typename?: 'Locker';
    totalLockedAmount: string;
    timestamp: string;
    block: string;
};

export type LockersQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Locker_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<Locker_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type LockersQuery = {
    __typename?: 'Query';
    lockers: Array<{ __typename?: 'Locker'; totalLockedAmount: string; timestamp: string; block: string }>;
};

export type UserPartialFragment = {
    __typename?: 'User';
    id: string;
    address: string;
    totalLockedAmount: string;
    collectedKickRewardAmount: string;
    totalLostThroughKick: string;
    block: string;
    timestamp: string;
    lockingPeriods: Array<{ __typename?: 'LockingPeriod'; lockAmount: string; epoch: string }>;
    claimedRewards: Array<{ __typename?: 'ClaimedReward'; amount: string; token: string }>;
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
    __typename?: 'Query';
    users: Array<{
        __typename?: 'User';
        id: string;
        address: string;
        totalLockedAmount: string;
        collectedKickRewardAmount: string;
        totalLostThroughKick: string;
        block: string;
        timestamp: string;
        lockingPeriods: Array<{ __typename?: 'LockingPeriod'; lockAmount: string; epoch: string }>;
        claimedRewards: Array<{ __typename?: 'ClaimedReward'; amount: string; token: string }>;
    }>;
};

export type UserQueryVariables = Exact<{
    id: Scalars['ID'];
    block?: Maybe<Block_Height>;
}>;

export type UserQuery = {
    __typename?: 'Query';
    user?:
        | {
              __typename?: 'User';
              id: string;
              address: string;
              totalLockedAmount: string;
              collectedKickRewardAmount: string;
              totalLostThroughKick: string;
              block: string;
              timestamp: string;
              lockingPeriods: Array<{ __typename?: 'LockingPeriod'; lockAmount: string; epoch: string }>;
              claimedRewards: Array<{ __typename?: 'ClaimedReward'; amount: string; token: string }>;
          }
        | null
        | undefined;
};

export type RewardTokenPartialFragment = {
    __typename?: 'RewardToken';
    rewardToken: string;
    rewardRate: string;
    rewardPeriodFinish: string;
    totalRewardAmount: string;
    block: string;
    timestamp: string;
};

export type RewardTokensQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<RewardToken_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<RewardToken_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type RewardTokensQuery = {
    __typename?: 'Query';
    rewardTokens: Array<{
        __typename?: 'RewardToken';
        rewardToken: string;
        rewardRate: string;
        rewardPeriodFinish: string;
        totalRewardAmount: string;
        block: string;
        timestamp: string;
    }>;
};

export const LockerPartialFragmentDoc = gql`
    fragment LockerPartial on Locker {
        totalLockedAmount
        timestamp
        block
    }
`;
export const UserPartialFragmentDoc = gql`
    fragment UserPartial on User {
        id
        address
        totalLockedAmount
        lockingPeriods {
            lockAmount
            epoch
        }
        claimedRewards {
            amount
            token
        }
        collectedKickRewardAmount
        totalLostThroughKick
        block
        timestamp
    }
`;
export const RewardTokenPartialFragmentDoc = gql`
    fragment RewardTokenPartial on RewardToken {
        rewardToken
        rewardRate
        rewardPeriodFinish
        totalRewardAmount
        block
        timestamp
    }
`;
export const LockersDocument = gql`
    query Lockers(
        $skip: Int
        $first: Int
        $orderBy: Locker_orderBy
        $orderDirection: OrderDirection
        $where: Locker_filter
        $block: Block_height
    ) {
        lockers(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...LockerPartial
        }
    }
    ${LockerPartialFragmentDoc}
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
            ...UserPartial
        }
    }
    ${UserPartialFragmentDoc}
`;
export const UserDocument = gql`
    query User($id: ID!, $block: Block_height) {
        user(id: $id, block: $block) {
            ...UserPartial
        }
    }
    ${UserPartialFragmentDoc}
`;
export const RewardTokensDocument = gql`
    query RewardTokens(
        $skip: Int
        $first: Int
        $orderBy: RewardToken_orderBy
        $orderDirection: OrderDirection
        $where: RewardToken_filter
        $block: Block_height
    ) {
        rewardTokens(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...RewardTokenPartial
        }
    }
    ${RewardTokenPartialFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        Lockers(variables?: LockersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<LockersQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<LockersQuery>(LockersDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'Lockers',
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
        User(variables: UserQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UserQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<UserQuery>(UserDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }),
                'User',
            );
        },
        RewardTokens(
            variables?: RewardTokensQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<RewardTokensQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<RewardTokensQuery>(RewardTokensDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'RewardTokens',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
