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

export type MasterChef = {
    __typename?: 'MasterChef';
    beetsPerBlock: Scalars['BigInt'];
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    poolCount: Scalars['BigInt'];
    pools?: Maybe<Array<Pool>>;
    timestamp: Scalars['BigInt'];
    totalAllocPoint: Scalars['BigInt'];
};

export type MasterChefPoolsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<Pool_Filter>;
};

export type MasterChef_Filter = {
    beetsPerBlock?: InputMaybe<Scalars['BigInt']>;
    beetsPerBlock_gt?: InputMaybe<Scalars['BigInt']>;
    beetsPerBlock_gte?: InputMaybe<Scalars['BigInt']>;
    beetsPerBlock_in?: InputMaybe<Array<Scalars['BigInt']>>;
    beetsPerBlock_lt?: InputMaybe<Scalars['BigInt']>;
    beetsPerBlock_lte?: InputMaybe<Scalars['BigInt']>;
    beetsPerBlock_not?: InputMaybe<Scalars['BigInt']>;
    beetsPerBlock_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    poolCount?: InputMaybe<Scalars['BigInt']>;
    poolCount_gt?: InputMaybe<Scalars['BigInt']>;
    poolCount_gte?: InputMaybe<Scalars['BigInt']>;
    poolCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
    poolCount_lt?: InputMaybe<Scalars['BigInt']>;
    poolCount_lte?: InputMaybe<Scalars['BigInt']>;
    poolCount_not?: InputMaybe<Scalars['BigInt']>;
    poolCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    totalAllocPoint?: InputMaybe<Scalars['BigInt']>;
    totalAllocPoint_gt?: InputMaybe<Scalars['BigInt']>;
    totalAllocPoint_gte?: InputMaybe<Scalars['BigInt']>;
    totalAllocPoint_in?: InputMaybe<Array<Scalars['BigInt']>>;
    totalAllocPoint_lt?: InputMaybe<Scalars['BigInt']>;
    totalAllocPoint_lte?: InputMaybe<Scalars['BigInt']>;
    totalAllocPoint_not?: InputMaybe<Scalars['BigInt']>;
    totalAllocPoint_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum MasterChef_OrderBy {
    BeetsPerBlock = 'beetsPerBlock',
    Block = 'block',
    Id = 'id',
    PoolCount = 'poolCount',
    Pools = 'pools',
    Timestamp = 'timestamp',
    TotalAllocPoint = 'totalAllocPoint',
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type Pool = {
    __typename?: 'Pool';
    accBeetsPerShare: Scalars['BigInt'];
    allocPoint: Scalars['BigInt'];
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    lastRewardBlock: Scalars['BigInt'];
    masterChef: MasterChef;
    pair: Scalars['Bytes'];
    rewarder?: Maybe<Rewarder>;
    slpBalance: Scalars['BigInt'];
    timestamp: Scalars['BigInt'];
    userCount: Scalars['BigInt'];
    users: Array<User>;
};

export type PoolUsersArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<User_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<User_Filter>;
};

export type Pool_Filter = {
    accBeetsPerShare?: InputMaybe<Scalars['BigInt']>;
    accBeetsPerShare_gt?: InputMaybe<Scalars['BigInt']>;
    accBeetsPerShare_gte?: InputMaybe<Scalars['BigInt']>;
    accBeetsPerShare_in?: InputMaybe<Array<Scalars['BigInt']>>;
    accBeetsPerShare_lt?: InputMaybe<Scalars['BigInt']>;
    accBeetsPerShare_lte?: InputMaybe<Scalars['BigInt']>;
    accBeetsPerShare_not?: InputMaybe<Scalars['BigInt']>;
    accBeetsPerShare_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    allocPoint?: InputMaybe<Scalars['BigInt']>;
    allocPoint_gt?: InputMaybe<Scalars['BigInt']>;
    allocPoint_gte?: InputMaybe<Scalars['BigInt']>;
    allocPoint_in?: InputMaybe<Array<Scalars['BigInt']>>;
    allocPoint_lt?: InputMaybe<Scalars['BigInt']>;
    allocPoint_lte?: InputMaybe<Scalars['BigInt']>;
    allocPoint_not?: InputMaybe<Scalars['BigInt']>;
    allocPoint_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    lastRewardBlock?: InputMaybe<Scalars['BigInt']>;
    lastRewardBlock_gt?: InputMaybe<Scalars['BigInt']>;
    lastRewardBlock_gte?: InputMaybe<Scalars['BigInt']>;
    lastRewardBlock_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lastRewardBlock_lt?: InputMaybe<Scalars['BigInt']>;
    lastRewardBlock_lte?: InputMaybe<Scalars['BigInt']>;
    lastRewardBlock_not?: InputMaybe<Scalars['BigInt']>;
    lastRewardBlock_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    masterChef?: InputMaybe<Scalars['String']>;
    masterChef_contains?: InputMaybe<Scalars['String']>;
    masterChef_contains_nocase?: InputMaybe<Scalars['String']>;
    masterChef_ends_with?: InputMaybe<Scalars['String']>;
    masterChef_ends_with_nocase?: InputMaybe<Scalars['String']>;
    masterChef_gt?: InputMaybe<Scalars['String']>;
    masterChef_gte?: InputMaybe<Scalars['String']>;
    masterChef_in?: InputMaybe<Array<Scalars['String']>>;
    masterChef_lt?: InputMaybe<Scalars['String']>;
    masterChef_lte?: InputMaybe<Scalars['String']>;
    masterChef_not?: InputMaybe<Scalars['String']>;
    masterChef_not_contains?: InputMaybe<Scalars['String']>;
    masterChef_not_contains_nocase?: InputMaybe<Scalars['String']>;
    masterChef_not_ends_with?: InputMaybe<Scalars['String']>;
    masterChef_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    masterChef_not_in?: InputMaybe<Array<Scalars['String']>>;
    masterChef_not_starts_with?: InputMaybe<Scalars['String']>;
    masterChef_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    masterChef_starts_with?: InputMaybe<Scalars['String']>;
    masterChef_starts_with_nocase?: InputMaybe<Scalars['String']>;
    pair?: InputMaybe<Scalars['Bytes']>;
    pair_contains?: InputMaybe<Scalars['Bytes']>;
    pair_in?: InputMaybe<Array<Scalars['Bytes']>>;
    pair_not?: InputMaybe<Scalars['Bytes']>;
    pair_not_contains?: InputMaybe<Scalars['Bytes']>;
    pair_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    rewarder?: InputMaybe<Scalars['String']>;
    rewarder_contains?: InputMaybe<Scalars['String']>;
    rewarder_contains_nocase?: InputMaybe<Scalars['String']>;
    rewarder_ends_with?: InputMaybe<Scalars['String']>;
    rewarder_ends_with_nocase?: InputMaybe<Scalars['String']>;
    rewarder_gt?: InputMaybe<Scalars['String']>;
    rewarder_gte?: InputMaybe<Scalars['String']>;
    rewarder_in?: InputMaybe<Array<Scalars['String']>>;
    rewarder_lt?: InputMaybe<Scalars['String']>;
    rewarder_lte?: InputMaybe<Scalars['String']>;
    rewarder_not?: InputMaybe<Scalars['String']>;
    rewarder_not_contains?: InputMaybe<Scalars['String']>;
    rewarder_not_contains_nocase?: InputMaybe<Scalars['String']>;
    rewarder_not_ends_with?: InputMaybe<Scalars['String']>;
    rewarder_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    rewarder_not_in?: InputMaybe<Array<Scalars['String']>>;
    rewarder_not_starts_with?: InputMaybe<Scalars['String']>;
    rewarder_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    rewarder_starts_with?: InputMaybe<Scalars['String']>;
    rewarder_starts_with_nocase?: InputMaybe<Scalars['String']>;
    slpBalance?: InputMaybe<Scalars['BigInt']>;
    slpBalance_gt?: InputMaybe<Scalars['BigInt']>;
    slpBalance_gte?: InputMaybe<Scalars['BigInt']>;
    slpBalance_in?: InputMaybe<Array<Scalars['BigInt']>>;
    slpBalance_lt?: InputMaybe<Scalars['BigInt']>;
    slpBalance_lte?: InputMaybe<Scalars['BigInt']>;
    slpBalance_not?: InputMaybe<Scalars['BigInt']>;
    slpBalance_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    userCount?: InputMaybe<Scalars['BigInt']>;
    userCount_gt?: InputMaybe<Scalars['BigInt']>;
    userCount_gte?: InputMaybe<Scalars['BigInt']>;
    userCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
    userCount_lt?: InputMaybe<Scalars['BigInt']>;
    userCount_lte?: InputMaybe<Scalars['BigInt']>;
    userCount_not?: InputMaybe<Scalars['BigInt']>;
    userCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Pool_OrderBy {
    AccBeetsPerShare = 'accBeetsPerShare',
    AllocPoint = 'allocPoint',
    Block = 'block',
    Id = 'id',
    LastRewardBlock = 'lastRewardBlock',
    MasterChef = 'masterChef',
    Pair = 'pair',
    Rewarder = 'rewarder',
    SlpBalance = 'slpBalance',
    Timestamp = 'timestamp',
    UserCount = 'userCount',
    Users = 'users',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    masterChef?: Maybe<MasterChef>;
    masterChefs: Array<MasterChef>;
    pool?: Maybe<Pool>;
    pools: Array<Pool>;
    rewarder?: Maybe<Rewarder>;
    rewarders: Array<Rewarder>;
    user?: Maybe<User>;
    users: Array<User>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryMasterChefArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMasterChefsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<MasterChef_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<MasterChef_Filter>;
};

export type QueryPoolArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
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

export type QueryRewarderArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRewardersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Rewarder_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Rewarder_Filter>;
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

export type Rewarder = {
    __typename?: 'Rewarder';
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    rewardPerSecond: Scalars['BigInt'];
    rewardToken: Scalars['Bytes'];
    timestamp: Scalars['BigInt'];
};

export type Rewarder_Filter = {
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
    rewardPerSecond?: InputMaybe<Scalars['BigInt']>;
    rewardPerSecond_gt?: InputMaybe<Scalars['BigInt']>;
    rewardPerSecond_gte?: InputMaybe<Scalars['BigInt']>;
    rewardPerSecond_in?: InputMaybe<Array<Scalars['BigInt']>>;
    rewardPerSecond_lt?: InputMaybe<Scalars['BigInt']>;
    rewardPerSecond_lte?: InputMaybe<Scalars['BigInt']>;
    rewardPerSecond_not?: InputMaybe<Scalars['BigInt']>;
    rewardPerSecond_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
};

export enum Rewarder_OrderBy {
    Block = 'block',
    Id = 'id',
    RewardPerSecond = 'rewardPerSecond',
    RewardToken = 'rewardToken',
    Timestamp = 'timestamp',
}

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    masterChef?: Maybe<MasterChef>;
    masterChefs: Array<MasterChef>;
    pool?: Maybe<Pool>;
    pools: Array<Pool>;
    rewarder?: Maybe<Rewarder>;
    rewarders: Array<Rewarder>;
    user?: Maybe<User>;
    users: Array<User>;
};

export type Subscription_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type SubscriptionMasterChefArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionMasterChefsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<MasterChef_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<MasterChef_Filter>;
};

export type SubscriptionPoolArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
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

export type SubscriptionRewarderArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionRewardersArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Rewarder_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Rewarder_Filter>;
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
    amount: Scalars['BigInt'];
    beetsHarvested: Scalars['BigInt'];
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    pool?: Maybe<Pool>;
    rewardDebt: Scalars['BigInt'];
    timestamp: Scalars['BigInt'];
};

export type User_Filter = {
    address?: InputMaybe<Scalars['Bytes']>;
    address_contains?: InputMaybe<Scalars['Bytes']>;
    address_in?: InputMaybe<Array<Scalars['Bytes']>>;
    address_not?: InputMaybe<Scalars['Bytes']>;
    address_not_contains?: InputMaybe<Scalars['Bytes']>;
    address_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    amount?: InputMaybe<Scalars['BigInt']>;
    amount_gt?: InputMaybe<Scalars['BigInt']>;
    amount_gte?: InputMaybe<Scalars['BigInt']>;
    amount_in?: InputMaybe<Array<Scalars['BigInt']>>;
    amount_lt?: InputMaybe<Scalars['BigInt']>;
    amount_lte?: InputMaybe<Scalars['BigInt']>;
    amount_not?: InputMaybe<Scalars['BigInt']>;
    amount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    beetsHarvested?: InputMaybe<Scalars['BigInt']>;
    beetsHarvested_gt?: InputMaybe<Scalars['BigInt']>;
    beetsHarvested_gte?: InputMaybe<Scalars['BigInt']>;
    beetsHarvested_in?: InputMaybe<Array<Scalars['BigInt']>>;
    beetsHarvested_lt?: InputMaybe<Scalars['BigInt']>;
    beetsHarvested_lte?: InputMaybe<Scalars['BigInt']>;
    beetsHarvested_not?: InputMaybe<Scalars['BigInt']>;
    beetsHarvested_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    pool?: InputMaybe<Scalars['String']>;
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
    rewardDebt?: InputMaybe<Scalars['BigInt']>;
    rewardDebt_gt?: InputMaybe<Scalars['BigInt']>;
    rewardDebt_gte?: InputMaybe<Scalars['BigInt']>;
    rewardDebt_in?: InputMaybe<Array<Scalars['BigInt']>>;
    rewardDebt_lt?: InputMaybe<Scalars['BigInt']>;
    rewardDebt_lte?: InputMaybe<Scalars['BigInt']>;
    rewardDebt_not?: InputMaybe<Scalars['BigInt']>;
    rewardDebt_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum User_OrderBy {
    Address = 'address',
    Amount = 'amount',
    BeetsHarvested = 'beetsHarvested',
    Block = 'block',
    Id = 'id',
    Pool = 'pool',
    RewardDebt = 'rewardDebt',
    Timestamp = 'timestamp',
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

export type MasterchefUsersQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<User_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type MasterchefUsersQuery = {
    __typename?: 'Query';
    farmUsers: Array<{
        __typename?: 'User';
        id: string;
        address: string;
        amount: string;
        rewardDebt: string;
        beetsHarvested: string;
        timestamp: string;
        pool?: { __typename?: 'Pool'; id: string; pair: string } | null | undefined;
    }>;
};

export type FarmUserFragment = {
    __typename?: 'User';
    id: string;
    address: string;
    amount: string;
    rewardDebt: string;
    beetsHarvested: string;
    timestamp: string;
    pool?: { __typename?: 'Pool'; id: string; pair: string } | null | undefined;
};

export type MasterchefsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<MasterChef_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<MasterChef_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type MasterchefsQuery = {
    __typename?: 'Query';
    masterChefs: Array<{
        __typename?: 'MasterChef';
        id: string;
        beetsPerBlock: string;
        totalAllocPoint: string;
        poolCount: string;
        timestamp: string;
        block: string;
    }>;
};

export type MasterchefFarmsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<Pool_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type MasterchefFarmsQuery = {
    __typename?: 'Query';
    farms: Array<{
        __typename?: 'Pool';
        id: string;
        pair: string;
        allocPoint: string;
        lastRewardBlock: string;
        accBeetsPerShare: string;
        slpBalance: string;
        userCount: string;
        timestamp: string;
        block: string;
        masterChef: { __typename?: 'MasterChef'; id: string; totalAllocPoint: string; beetsPerBlock: string };
        rewarder?:
            | { __typename?: 'Rewarder'; id: string; rewardToken: string; rewardPerSecond: string }
            | null
            | undefined;
    }>;
};

export type FarmFragment = {
    __typename?: 'Pool';
    id: string;
    pair: string;
    allocPoint: string;
    lastRewardBlock: string;
    accBeetsPerShare: string;
    slpBalance: string;
    userCount: string;
    timestamp: string;
    block: string;
    masterChef: { __typename?: 'MasterChef'; id: string; totalAllocPoint: string; beetsPerBlock: string };
    rewarder?: { __typename?: 'Rewarder'; id: string; rewardToken: string; rewardPerSecond: string } | null | undefined;
};

export type MasterchefPortfolioDataQueryVariables = Exact<{
    address: Scalars['Bytes'];
    previousBlockNumber: Scalars['Int'];
}>;

export type MasterchefPortfolioDataQuery = {
    __typename?: 'Query';
    farmUsers: Array<{
        __typename?: 'User';
        id: string;
        address: string;
        amount: string;
        rewardDebt: string;
        beetsHarvested: string;
        timestamp: string;
        pool?: { __typename?: 'Pool'; id: string; pair: string } | null | undefined;
    }>;
    previousFarmUsers: Array<{
        __typename?: 'User';
        id: string;
        address: string;
        amount: string;
        rewardDebt: string;
        beetsHarvested: string;
        timestamp: string;
        pool?: { __typename?: 'Pool'; id: string; pair: string } | null | undefined;
    }>;
};

export const FarmUserFragmentDoc = gql`
    fragment FarmUser on User {
        id
        address
        amount
        rewardDebt
        beetsHarvested
        timestamp
        pool {
            id
            pair
        }
    }
`;
export const FarmFragmentDoc = gql`
    fragment Farm on Pool {
        id
        pair
        allocPoint
        lastRewardBlock
        accBeetsPerShare
        slpBalance
        userCount
        timestamp
        block
        masterChef {
            id
            totalAllocPoint
            beetsPerBlock
        }
        rewarder {
            id
            rewardToken
            rewardPerSecond
        }
    }
`;
export const MasterchefUsersDocument = gql`
    query MasterchefUsers(
        $skip: Int
        $first: Int
        $orderBy: User_orderBy
        $orderDirection: OrderDirection
        $where: User_filter
        $block: Block_height
    ) {
        farmUsers: users(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...FarmUser
        }
    }
    ${FarmUserFragmentDoc}
`;
export const MasterchefsDocument = gql`
    query Masterchefs(
        $skip: Int
        $first: Int
        $orderBy: MasterChef_orderBy
        $orderDirection: OrderDirection
        $where: MasterChef_filter
        $block: Block_height
    ) {
        masterChefs(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            id
            beetsPerBlock
            totalAllocPoint
            poolCount
            timestamp
            block
        }
    }
`;
export const MasterchefFarmsDocument = gql`
    query MasterchefFarms(
        $skip: Int
        $first: Int
        $orderBy: Pool_orderBy
        $orderDirection: OrderDirection
        $where: Pool_filter
        $block: Block_height
    ) {
        farms: pools(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...Farm
        }
    }
    ${FarmFragmentDoc}
`;
export const MasterchefPortfolioDataDocument = gql`
    query MasterchefPortfolioData($address: Bytes!, $previousBlockNumber: Int!) {
        farmUsers: users(first: 1000, where: { address: $address }) {
            ...FarmUser
        }
        previousFarmUsers: users(first: 1000, where: { address: $address }, block: { number: $previousBlockNumber }) {
            ...FarmUser
        }
    }
    ${FarmUserFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        MasterchefUsers(
            variables?: MasterchefUsersQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<MasterchefUsersQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<MasterchefUsersQuery>(MasterchefUsersDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'MasterchefUsers',
            );
        },
        Masterchefs(
            variables?: MasterchefsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<MasterchefsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<MasterchefsQuery>(MasterchefsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'Masterchefs',
            );
        },
        MasterchefFarms(
            variables?: MasterchefFarmsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<MasterchefFarmsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<MasterchefFarmsQuery>(MasterchefFarmsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'MasterchefFarms',
            );
        },
        MasterchefPortfolioData(
            variables: MasterchefPortfolioDataQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<MasterchefPortfolioDataQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<MasterchefPortfolioDataQuery>(MasterchefPortfolioDataDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'MasterchefPortfolioData',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
