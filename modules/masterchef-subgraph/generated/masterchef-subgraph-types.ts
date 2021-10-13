import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
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
    Binary: any;
    Bytes: string;
    Date: any;
    Datetime: any;
    JSON: any;
    UUID: any;
};

export type Block_Height = {
    hash?: Maybe<Scalars['Bytes']>;
    number?: Maybe<Scalars['Int']>;
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
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Pool_Filter>;
};

export type MasterChef_Filter = {
    beetsPerBlock?: Maybe<Scalars['BigInt']>;
    beetsPerBlock_gt?: Maybe<Scalars['BigInt']>;
    beetsPerBlock_gte?: Maybe<Scalars['BigInt']>;
    beetsPerBlock_in?: Maybe<Array<Scalars['BigInt']>>;
    beetsPerBlock_lt?: Maybe<Scalars['BigInt']>;
    beetsPerBlock_lte?: Maybe<Scalars['BigInt']>;
    beetsPerBlock_not?: Maybe<Scalars['BigInt']>;
    beetsPerBlock_not_in?: Maybe<Array<Scalars['BigInt']>>;
    block?: Maybe<Scalars['BigInt']>;
    block_gt?: Maybe<Scalars['BigInt']>;
    block_gte?: Maybe<Scalars['BigInt']>;
    block_in?: Maybe<Array<Scalars['BigInt']>>;
    block_lt?: Maybe<Scalars['BigInt']>;
    block_lte?: Maybe<Scalars['BigInt']>;
    block_not?: Maybe<Scalars['BigInt']>;
    block_not_in?: Maybe<Array<Scalars['BigInt']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    poolCount?: Maybe<Scalars['BigInt']>;
    poolCount_gt?: Maybe<Scalars['BigInt']>;
    poolCount_gte?: Maybe<Scalars['BigInt']>;
    poolCount_in?: Maybe<Array<Scalars['BigInt']>>;
    poolCount_lt?: Maybe<Scalars['BigInt']>;
    poolCount_lte?: Maybe<Scalars['BigInt']>;
    poolCount_not?: Maybe<Scalars['BigInt']>;
    poolCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp?: Maybe<Scalars['BigInt']>;
    timestamp_gt?: Maybe<Scalars['BigInt']>;
    timestamp_gte?: Maybe<Scalars['BigInt']>;
    timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: Maybe<Scalars['BigInt']>;
    timestamp_lte?: Maybe<Scalars['BigInt']>;
    timestamp_not?: Maybe<Scalars['BigInt']>;
    timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
    totalAllocPoint?: Maybe<Scalars['BigInt']>;
    totalAllocPoint_gt?: Maybe<Scalars['BigInt']>;
    totalAllocPoint_gte?: Maybe<Scalars['BigInt']>;
    totalAllocPoint_in?: Maybe<Array<Scalars['BigInt']>>;
    totalAllocPoint_lt?: Maybe<Scalars['BigInt']>;
    totalAllocPoint_lte?: Maybe<Scalars['BigInt']>;
    totalAllocPoint_not?: Maybe<Scalars['BigInt']>;
    totalAllocPoint_not_in?: Maybe<Array<Scalars['BigInt']>>;
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

export type Mutation = {
    __typename?: 'Mutation';
    someMutation: Scalars['Boolean'];
};

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
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<User_Filter>;
};

export type Pool_Filter = {
    accBeetsPerShare?: Maybe<Scalars['BigInt']>;
    accBeetsPerShare_gt?: Maybe<Scalars['BigInt']>;
    accBeetsPerShare_gte?: Maybe<Scalars['BigInt']>;
    accBeetsPerShare_in?: Maybe<Array<Scalars['BigInt']>>;
    accBeetsPerShare_lt?: Maybe<Scalars['BigInt']>;
    accBeetsPerShare_lte?: Maybe<Scalars['BigInt']>;
    accBeetsPerShare_not?: Maybe<Scalars['BigInt']>;
    accBeetsPerShare_not_in?: Maybe<Array<Scalars['BigInt']>>;
    allocPoint?: Maybe<Scalars['BigInt']>;
    allocPoint_gt?: Maybe<Scalars['BigInt']>;
    allocPoint_gte?: Maybe<Scalars['BigInt']>;
    allocPoint_in?: Maybe<Array<Scalars['BigInt']>>;
    allocPoint_lt?: Maybe<Scalars['BigInt']>;
    allocPoint_lte?: Maybe<Scalars['BigInt']>;
    allocPoint_not?: Maybe<Scalars['BigInt']>;
    allocPoint_not_in?: Maybe<Array<Scalars['BigInt']>>;
    block?: Maybe<Scalars['BigInt']>;
    block_gt?: Maybe<Scalars['BigInt']>;
    block_gte?: Maybe<Scalars['BigInt']>;
    block_in?: Maybe<Array<Scalars['BigInt']>>;
    block_lt?: Maybe<Scalars['BigInt']>;
    block_lte?: Maybe<Scalars['BigInt']>;
    block_not?: Maybe<Scalars['BigInt']>;
    block_not_in?: Maybe<Array<Scalars['BigInt']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    lastRewardBlock?: Maybe<Scalars['BigInt']>;
    lastRewardBlock_gt?: Maybe<Scalars['BigInt']>;
    lastRewardBlock_gte?: Maybe<Scalars['BigInt']>;
    lastRewardBlock_in?: Maybe<Array<Scalars['BigInt']>>;
    lastRewardBlock_lt?: Maybe<Scalars['BigInt']>;
    lastRewardBlock_lte?: Maybe<Scalars['BigInt']>;
    lastRewardBlock_not?: Maybe<Scalars['BigInt']>;
    lastRewardBlock_not_in?: Maybe<Array<Scalars['BigInt']>>;
    masterChef?: Maybe<Scalars['String']>;
    masterChef_contains?: Maybe<Scalars['String']>;
    masterChef_ends_with?: Maybe<Scalars['String']>;
    masterChef_gt?: Maybe<Scalars['String']>;
    masterChef_gte?: Maybe<Scalars['String']>;
    masterChef_in?: Maybe<Array<Scalars['String']>>;
    masterChef_lt?: Maybe<Scalars['String']>;
    masterChef_lte?: Maybe<Scalars['String']>;
    masterChef_not?: Maybe<Scalars['String']>;
    masterChef_not_contains?: Maybe<Scalars['String']>;
    masterChef_not_ends_with?: Maybe<Scalars['String']>;
    masterChef_not_in?: Maybe<Array<Scalars['String']>>;
    masterChef_not_starts_with?: Maybe<Scalars['String']>;
    masterChef_starts_with?: Maybe<Scalars['String']>;
    pair?: Maybe<Scalars['Bytes']>;
    pair_contains?: Maybe<Scalars['Bytes']>;
    pair_in?: Maybe<Array<Scalars['Bytes']>>;
    pair_not?: Maybe<Scalars['Bytes']>;
    pair_not_contains?: Maybe<Scalars['Bytes']>;
    pair_not_in?: Maybe<Array<Scalars['Bytes']>>;
    rewarder?: Maybe<Scalars['String']>;
    rewarder_contains?: Maybe<Scalars['String']>;
    rewarder_ends_with?: Maybe<Scalars['String']>;
    rewarder_gt?: Maybe<Scalars['String']>;
    rewarder_gte?: Maybe<Scalars['String']>;
    rewarder_in?: Maybe<Array<Scalars['String']>>;
    rewarder_lt?: Maybe<Scalars['String']>;
    rewarder_lte?: Maybe<Scalars['String']>;
    rewarder_not?: Maybe<Scalars['String']>;
    rewarder_not_contains?: Maybe<Scalars['String']>;
    rewarder_not_ends_with?: Maybe<Scalars['String']>;
    rewarder_not_in?: Maybe<Array<Scalars['String']>>;
    rewarder_not_starts_with?: Maybe<Scalars['String']>;
    rewarder_starts_with?: Maybe<Scalars['String']>;
    slpBalance?: Maybe<Scalars['BigInt']>;
    slpBalance_gt?: Maybe<Scalars['BigInt']>;
    slpBalance_gte?: Maybe<Scalars['BigInt']>;
    slpBalance_in?: Maybe<Array<Scalars['BigInt']>>;
    slpBalance_lt?: Maybe<Scalars['BigInt']>;
    slpBalance_lte?: Maybe<Scalars['BigInt']>;
    slpBalance_not?: Maybe<Scalars['BigInt']>;
    slpBalance_not_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp?: Maybe<Scalars['BigInt']>;
    timestamp_gt?: Maybe<Scalars['BigInt']>;
    timestamp_gte?: Maybe<Scalars['BigInt']>;
    timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: Maybe<Scalars['BigInt']>;
    timestamp_lte?: Maybe<Scalars['BigInt']>;
    timestamp_not?: Maybe<Scalars['BigInt']>;
    timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
    userCount?: Maybe<Scalars['BigInt']>;
    userCount_gt?: Maybe<Scalars['BigInt']>;
    userCount_gte?: Maybe<Scalars['BigInt']>;
    userCount_in?: Maybe<Array<Scalars['BigInt']>>;
    userCount_lt?: Maybe<Scalars['BigInt']>;
    userCount_lte?: Maybe<Scalars['BigInt']>;
    userCount_not?: Maybe<Scalars['BigInt']>;
    userCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
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

export type Portfolio = {
    __typename?: 'Portfolio';
    tokens: Array<PortfolioToken>;
};

export type PortfolioToken = {
    __typename?: 'PortfolioToken';
    balance: Scalars['String'];
    id: Scalars['String'];
    name: Scalars['String'];
    pricePerToken: Scalars['Float'];
    symbol: Scalars['String'];
    totalPrice: Scalars['Float'];
};

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    masterChef?: Maybe<MasterChef>;
    masterChefs: Array<MasterChef>;
    pool?: Maybe<Pool>;
    pools: Array<Pool>;
    portfolioGetPortfolio: Portfolio;
    rewarder?: Maybe<Rewarder>;
    rewarders: Array<Rewarder>;
    user?: Maybe<User>;
    users: Array<User>;
};

export type Query_MetaArgs = {
    block?: Maybe<Block_Height>;
};

export type QueryMasterChefArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryMasterChefsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<MasterChef_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<MasterChef_Filter>;
};

export type QueryPoolArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryPoolsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Pool_Filter>;
};

export type QueryRewarderArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryRewardersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Rewarder_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Rewarder_Filter>;
};

export type QueryUserArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryUsersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<User_Filter>;
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
    block?: Maybe<Scalars['BigInt']>;
    block_gt?: Maybe<Scalars['BigInt']>;
    block_gte?: Maybe<Scalars['BigInt']>;
    block_in?: Maybe<Array<Scalars['BigInt']>>;
    block_lt?: Maybe<Scalars['BigInt']>;
    block_lte?: Maybe<Scalars['BigInt']>;
    block_not?: Maybe<Scalars['BigInt']>;
    block_not_in?: Maybe<Array<Scalars['BigInt']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    rewardPerSecond?: Maybe<Scalars['BigInt']>;
    rewardPerSecond_gt?: Maybe<Scalars['BigInt']>;
    rewardPerSecond_gte?: Maybe<Scalars['BigInt']>;
    rewardPerSecond_in?: Maybe<Array<Scalars['BigInt']>>;
    rewardPerSecond_lt?: Maybe<Scalars['BigInt']>;
    rewardPerSecond_lte?: Maybe<Scalars['BigInt']>;
    rewardPerSecond_not?: Maybe<Scalars['BigInt']>;
    rewardPerSecond_not_in?: Maybe<Array<Scalars['BigInt']>>;
    rewardToken?: Maybe<Scalars['Bytes']>;
    rewardToken_contains?: Maybe<Scalars['Bytes']>;
    rewardToken_in?: Maybe<Array<Scalars['Bytes']>>;
    rewardToken_not?: Maybe<Scalars['Bytes']>;
    rewardToken_not_contains?: Maybe<Scalars['Bytes']>;
    rewardToken_not_in?: Maybe<Array<Scalars['Bytes']>>;
    timestamp?: Maybe<Scalars['BigInt']>;
    timestamp_gt?: Maybe<Scalars['BigInt']>;
    timestamp_gte?: Maybe<Scalars['BigInt']>;
    timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: Maybe<Scalars['BigInt']>;
    timestamp_lte?: Maybe<Scalars['BigInt']>;
    timestamp_not?: Maybe<Scalars['BigInt']>;
    timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
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
    block?: Maybe<Block_Height>;
};

export type SubscriptionMasterChefArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionMasterChefsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<MasterChef_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<MasterChef_Filter>;
};

export type SubscriptionPoolArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionPoolsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Pool_Filter>;
};

export type SubscriptionRewarderArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionRewardersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Rewarder_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Rewarder_Filter>;
};

export type SubscriptionUserArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionUsersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<User_Filter>;
};

export type TranslatedString = {
    __typename?: 'TranslatedString';
    de: Scalars['String'];
    en: Scalars['String'];
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
    address?: Maybe<Scalars['Bytes']>;
    address_contains?: Maybe<Scalars['Bytes']>;
    address_in?: Maybe<Array<Scalars['Bytes']>>;
    address_not?: Maybe<Scalars['Bytes']>;
    address_not_contains?: Maybe<Scalars['Bytes']>;
    address_not_in?: Maybe<Array<Scalars['Bytes']>>;
    amount?: Maybe<Scalars['BigInt']>;
    amount_gt?: Maybe<Scalars['BigInt']>;
    amount_gte?: Maybe<Scalars['BigInt']>;
    amount_in?: Maybe<Array<Scalars['BigInt']>>;
    amount_lt?: Maybe<Scalars['BigInt']>;
    amount_lte?: Maybe<Scalars['BigInt']>;
    amount_not?: Maybe<Scalars['BigInt']>;
    amount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    beetsHarvested?: Maybe<Scalars['BigInt']>;
    beetsHarvested_gt?: Maybe<Scalars['BigInt']>;
    beetsHarvested_gte?: Maybe<Scalars['BigInt']>;
    beetsHarvested_in?: Maybe<Array<Scalars['BigInt']>>;
    beetsHarvested_lt?: Maybe<Scalars['BigInt']>;
    beetsHarvested_lte?: Maybe<Scalars['BigInt']>;
    beetsHarvested_not?: Maybe<Scalars['BigInt']>;
    beetsHarvested_not_in?: Maybe<Array<Scalars['BigInt']>>;
    block?: Maybe<Scalars['BigInt']>;
    block_gt?: Maybe<Scalars['BigInt']>;
    block_gte?: Maybe<Scalars['BigInt']>;
    block_in?: Maybe<Array<Scalars['BigInt']>>;
    block_lt?: Maybe<Scalars['BigInt']>;
    block_lte?: Maybe<Scalars['BigInt']>;
    block_not?: Maybe<Scalars['BigInt']>;
    block_not_in?: Maybe<Array<Scalars['BigInt']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    pool?: Maybe<Scalars['String']>;
    pool_contains?: Maybe<Scalars['String']>;
    pool_ends_with?: Maybe<Scalars['String']>;
    pool_gt?: Maybe<Scalars['String']>;
    pool_gte?: Maybe<Scalars['String']>;
    pool_in?: Maybe<Array<Scalars['String']>>;
    pool_lt?: Maybe<Scalars['String']>;
    pool_lte?: Maybe<Scalars['String']>;
    pool_not?: Maybe<Scalars['String']>;
    pool_not_contains?: Maybe<Scalars['String']>;
    pool_not_ends_with?: Maybe<Scalars['String']>;
    pool_not_in?: Maybe<Array<Scalars['String']>>;
    pool_not_starts_with?: Maybe<Scalars['String']>;
    pool_starts_with?: Maybe<Scalars['String']>;
    rewardDebt?: Maybe<Scalars['BigInt']>;
    rewardDebt_gt?: Maybe<Scalars['BigInt']>;
    rewardDebt_gte?: Maybe<Scalars['BigInt']>;
    rewardDebt_in?: Maybe<Array<Scalars['BigInt']>>;
    rewardDebt_lt?: Maybe<Scalars['BigInt']>;
    rewardDebt_lte?: Maybe<Scalars['BigInt']>;
    rewardDebt_not?: Maybe<Scalars['BigInt']>;
    rewardDebt_not_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp?: Maybe<Scalars['BigInt']>;
    timestamp_gt?: Maybe<Scalars['BigInt']>;
    timestamp_gte?: Maybe<Scalars['BigInt']>;
    timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: Maybe<Scalars['BigInt']>;
    timestamp_lte?: Maybe<Scalars['BigInt']>;
    timestamp_not?: Maybe<Scalars['BigInt']>;
    timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
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
    };
}
export type Sdk = ReturnType<typeof getSdk>;
