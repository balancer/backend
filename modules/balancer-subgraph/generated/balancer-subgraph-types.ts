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
    Bytes: string;
};

export type AmpUpdate = {
    __typename?: 'AmpUpdate';
    endAmp: Scalars['BigInt'];
    endTimestamp: Scalars['Int'];
    id: Scalars['ID'];
    poolId: Pool;
    scheduledTimestamp: Scalars['Int'];
    startAmp: Scalars['BigInt'];
    startTimestamp: Scalars['Int'];
};

export type AmpUpdate_Filter = {
    endAmp?: Maybe<Scalars['BigInt']>;
    endAmp_gt?: Maybe<Scalars['BigInt']>;
    endAmp_gte?: Maybe<Scalars['BigInt']>;
    endAmp_in?: Maybe<Array<Scalars['BigInt']>>;
    endAmp_lt?: Maybe<Scalars['BigInt']>;
    endAmp_lte?: Maybe<Scalars['BigInt']>;
    endAmp_not?: Maybe<Scalars['BigInt']>;
    endAmp_not_in?: Maybe<Array<Scalars['BigInt']>>;
    endTimestamp?: Maybe<Scalars['Int']>;
    endTimestamp_gt?: Maybe<Scalars['Int']>;
    endTimestamp_gte?: Maybe<Scalars['Int']>;
    endTimestamp_in?: Maybe<Array<Scalars['Int']>>;
    endTimestamp_lt?: Maybe<Scalars['Int']>;
    endTimestamp_lte?: Maybe<Scalars['Int']>;
    endTimestamp_not?: Maybe<Scalars['Int']>;
    endTimestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    scheduledTimestamp?: Maybe<Scalars['Int']>;
    scheduledTimestamp_gt?: Maybe<Scalars['Int']>;
    scheduledTimestamp_gte?: Maybe<Scalars['Int']>;
    scheduledTimestamp_in?: Maybe<Array<Scalars['Int']>>;
    scheduledTimestamp_lt?: Maybe<Scalars['Int']>;
    scheduledTimestamp_lte?: Maybe<Scalars['Int']>;
    scheduledTimestamp_not?: Maybe<Scalars['Int']>;
    scheduledTimestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    startAmp?: Maybe<Scalars['BigInt']>;
    startAmp_gt?: Maybe<Scalars['BigInt']>;
    startAmp_gte?: Maybe<Scalars['BigInt']>;
    startAmp_in?: Maybe<Array<Scalars['BigInt']>>;
    startAmp_lt?: Maybe<Scalars['BigInt']>;
    startAmp_lte?: Maybe<Scalars['BigInt']>;
    startAmp_not?: Maybe<Scalars['BigInt']>;
    startAmp_not_in?: Maybe<Array<Scalars['BigInt']>>;
    startTimestamp?: Maybe<Scalars['Int']>;
    startTimestamp_gt?: Maybe<Scalars['Int']>;
    startTimestamp_gte?: Maybe<Scalars['Int']>;
    startTimestamp_in?: Maybe<Array<Scalars['Int']>>;
    startTimestamp_lt?: Maybe<Scalars['Int']>;
    startTimestamp_lte?: Maybe<Scalars['Int']>;
    startTimestamp_not?: Maybe<Scalars['Int']>;
    startTimestamp_not_in?: Maybe<Array<Scalars['Int']>>;
};

export enum AmpUpdate_OrderBy {
    EndAmp = 'endAmp',
    EndTimestamp = 'endTimestamp',
    Id = 'id',
    PoolId = 'poolId',
    ScheduledTimestamp = 'scheduledTimestamp',
    StartAmp = 'startAmp',
    StartTimestamp = 'startTimestamp',
}

export type Balancer = {
    __typename?: 'Balancer';
    id: Scalars['ID'];
    poolCount: Scalars['Int'];
    pools?: Maybe<Array<Pool>>;
    totalLiquidity: Scalars['BigDecimal'];
    totalSwapCount: Scalars['BigInt'];
    totalSwapFee: Scalars['BigDecimal'];
    totalSwapVolume: Scalars['BigDecimal'];
};

export type BalancerPoolsArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Pool_Filter>;
};

export type BalancerSnapshot = {
    __typename?: 'BalancerSnapshot';
    id: Scalars['ID'];
    poolCount: Scalars['Int'];
    timestamp: Scalars['Int'];
    totalLiquidity: Scalars['BigDecimal'];
    totalSwapCount: Scalars['BigInt'];
    totalSwapFee: Scalars['BigDecimal'];
    totalSwapVolume: Scalars['BigDecimal'];
    vault: Balancer;
};

export type BalancerSnapshot_Filter = {
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    poolCount?: Maybe<Scalars['Int']>;
    poolCount_gt?: Maybe<Scalars['Int']>;
    poolCount_gte?: Maybe<Scalars['Int']>;
    poolCount_in?: Maybe<Array<Scalars['Int']>>;
    poolCount_lt?: Maybe<Scalars['Int']>;
    poolCount_lte?: Maybe<Scalars['Int']>;
    poolCount_not?: Maybe<Scalars['Int']>;
    poolCount_not_in?: Maybe<Array<Scalars['Int']>>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    totalLiquidity?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_gt?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_gte?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalLiquidity_lt?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_lte?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_not?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapCount?: Maybe<Scalars['BigInt']>;
    totalSwapCount_gt?: Maybe<Scalars['BigInt']>;
    totalSwapCount_gte?: Maybe<Scalars['BigInt']>;
    totalSwapCount_in?: Maybe<Array<Scalars['BigInt']>>;
    totalSwapCount_lt?: Maybe<Scalars['BigInt']>;
    totalSwapCount_lte?: Maybe<Scalars['BigInt']>;
    totalSwapCount_not?: Maybe<Scalars['BigInt']>;
    totalSwapCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    totalSwapFee?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapFee_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vault?: Maybe<Scalars['String']>;
    vault_contains?: Maybe<Scalars['String']>;
    vault_ends_with?: Maybe<Scalars['String']>;
    vault_gt?: Maybe<Scalars['String']>;
    vault_gte?: Maybe<Scalars['String']>;
    vault_in?: Maybe<Array<Scalars['String']>>;
    vault_lt?: Maybe<Scalars['String']>;
    vault_lte?: Maybe<Scalars['String']>;
    vault_not?: Maybe<Scalars['String']>;
    vault_not_contains?: Maybe<Scalars['String']>;
    vault_not_ends_with?: Maybe<Scalars['String']>;
    vault_not_in?: Maybe<Array<Scalars['String']>>;
    vault_not_starts_with?: Maybe<Scalars['String']>;
    vault_starts_with?: Maybe<Scalars['String']>;
};

export enum BalancerSnapshot_OrderBy {
    Id = 'id',
    PoolCount = 'poolCount',
    Timestamp = 'timestamp',
    TotalLiquidity = 'totalLiquidity',
    TotalSwapCount = 'totalSwapCount',
    TotalSwapFee = 'totalSwapFee',
    TotalSwapVolume = 'totalSwapVolume',
    Vault = 'vault',
}

export type Balancer_Filter = {
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    poolCount?: Maybe<Scalars['Int']>;
    poolCount_gt?: Maybe<Scalars['Int']>;
    poolCount_gte?: Maybe<Scalars['Int']>;
    poolCount_in?: Maybe<Array<Scalars['Int']>>;
    poolCount_lt?: Maybe<Scalars['Int']>;
    poolCount_lte?: Maybe<Scalars['Int']>;
    poolCount_not?: Maybe<Scalars['Int']>;
    poolCount_not_in?: Maybe<Array<Scalars['Int']>>;
    totalLiquidity?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_gt?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_gte?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalLiquidity_lt?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_lte?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_not?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapCount?: Maybe<Scalars['BigInt']>;
    totalSwapCount_gt?: Maybe<Scalars['BigInt']>;
    totalSwapCount_gte?: Maybe<Scalars['BigInt']>;
    totalSwapCount_in?: Maybe<Array<Scalars['BigInt']>>;
    totalSwapCount_lt?: Maybe<Scalars['BigInt']>;
    totalSwapCount_lte?: Maybe<Scalars['BigInt']>;
    totalSwapCount_not?: Maybe<Scalars['BigInt']>;
    totalSwapCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    totalSwapFee?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapFee_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum Balancer_OrderBy {
    Id = 'id',
    PoolCount = 'poolCount',
    Pools = 'pools',
    TotalLiquidity = 'totalLiquidity',
    TotalSwapCount = 'totalSwapCount',
    TotalSwapFee = 'totalSwapFee',
    TotalSwapVolume = 'totalSwapVolume',
}

export type Block_Height = {
    hash?: Maybe<Scalars['Bytes']>;
    number?: Maybe<Scalars['Int']>;
};

export type GradualWeightUpdate = {
    __typename?: 'GradualWeightUpdate';
    endTimestamp: Scalars['Int'];
    endWeights: Array<Scalars['BigInt']>;
    id: Scalars['ID'];
    poolId: Pool;
    scheduledTimestamp: Scalars['Int'];
    startTimestamp: Scalars['Int'];
    startWeights: Array<Scalars['BigInt']>;
};

export type GradualWeightUpdate_Filter = {
    endTimestamp?: Maybe<Scalars['Int']>;
    endTimestamp_gt?: Maybe<Scalars['Int']>;
    endTimestamp_gte?: Maybe<Scalars['Int']>;
    endTimestamp_in?: Maybe<Array<Scalars['Int']>>;
    endTimestamp_lt?: Maybe<Scalars['Int']>;
    endTimestamp_lte?: Maybe<Scalars['Int']>;
    endTimestamp_not?: Maybe<Scalars['Int']>;
    endTimestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    endWeights?: Maybe<Array<Scalars['BigInt']>>;
    endWeights_contains?: Maybe<Array<Scalars['BigInt']>>;
    endWeights_not?: Maybe<Array<Scalars['BigInt']>>;
    endWeights_not_contains?: Maybe<Array<Scalars['BigInt']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    scheduledTimestamp?: Maybe<Scalars['Int']>;
    scheduledTimestamp_gt?: Maybe<Scalars['Int']>;
    scheduledTimestamp_gte?: Maybe<Scalars['Int']>;
    scheduledTimestamp_in?: Maybe<Array<Scalars['Int']>>;
    scheduledTimestamp_lt?: Maybe<Scalars['Int']>;
    scheduledTimestamp_lte?: Maybe<Scalars['Int']>;
    scheduledTimestamp_not?: Maybe<Scalars['Int']>;
    scheduledTimestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    startTimestamp?: Maybe<Scalars['Int']>;
    startTimestamp_gt?: Maybe<Scalars['Int']>;
    startTimestamp_gte?: Maybe<Scalars['Int']>;
    startTimestamp_in?: Maybe<Array<Scalars['Int']>>;
    startTimestamp_lt?: Maybe<Scalars['Int']>;
    startTimestamp_lte?: Maybe<Scalars['Int']>;
    startTimestamp_not?: Maybe<Scalars['Int']>;
    startTimestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    startWeights?: Maybe<Array<Scalars['BigInt']>>;
    startWeights_contains?: Maybe<Array<Scalars['BigInt']>>;
    startWeights_not?: Maybe<Array<Scalars['BigInt']>>;
    startWeights_not_contains?: Maybe<Array<Scalars['BigInt']>>;
};

export enum GradualWeightUpdate_OrderBy {
    EndTimestamp = 'endTimestamp',
    EndWeights = 'endWeights',
    Id = 'id',
    PoolId = 'poolId',
    ScheduledTimestamp = 'scheduledTimestamp',
    StartTimestamp = 'startTimestamp',
    StartWeights = 'startWeights',
}

export enum InvestType {
    Exit = 'Exit',
    Join = 'Join',
}

export type Investment = {
    __typename?: 'Investment';
    amount: Scalars['BigDecimal'];
    assetManagerAddress: Scalars['Bytes'];
    id: Scalars['ID'];
    poolTokenId: PoolToken;
    timestamp: Scalars['Int'];
};

export type Investment_Filter = {
    amount?: Maybe<Scalars['BigDecimal']>;
    amount_gt?: Maybe<Scalars['BigDecimal']>;
    amount_gte?: Maybe<Scalars['BigDecimal']>;
    amount_in?: Maybe<Array<Scalars['BigDecimal']>>;
    amount_lt?: Maybe<Scalars['BigDecimal']>;
    amount_lte?: Maybe<Scalars['BigDecimal']>;
    amount_not?: Maybe<Scalars['BigDecimal']>;
    amount_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    assetManagerAddress?: Maybe<Scalars['Bytes']>;
    assetManagerAddress_contains?: Maybe<Scalars['Bytes']>;
    assetManagerAddress_in?: Maybe<Array<Scalars['Bytes']>>;
    assetManagerAddress_not?: Maybe<Scalars['Bytes']>;
    assetManagerAddress_not_contains?: Maybe<Scalars['Bytes']>;
    assetManagerAddress_not_in?: Maybe<Array<Scalars['Bytes']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    poolTokenId?: Maybe<Scalars['String']>;
    poolTokenId_contains?: Maybe<Scalars['String']>;
    poolTokenId_ends_with?: Maybe<Scalars['String']>;
    poolTokenId_gt?: Maybe<Scalars['String']>;
    poolTokenId_gte?: Maybe<Scalars['String']>;
    poolTokenId_in?: Maybe<Array<Scalars['String']>>;
    poolTokenId_lt?: Maybe<Scalars['String']>;
    poolTokenId_lte?: Maybe<Scalars['String']>;
    poolTokenId_not?: Maybe<Scalars['String']>;
    poolTokenId_not_contains?: Maybe<Scalars['String']>;
    poolTokenId_not_ends_with?: Maybe<Scalars['String']>;
    poolTokenId_not_in?: Maybe<Array<Scalars['String']>>;
    poolTokenId_not_starts_with?: Maybe<Scalars['String']>;
    poolTokenId_starts_with?: Maybe<Scalars['String']>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
};

export enum Investment_OrderBy {
    Amount = 'amount',
    AssetManagerAddress = 'assetManagerAddress',
    Id = 'id',
    PoolTokenId = 'poolTokenId',
    Timestamp = 'timestamp',
}

export type JoinExit = {
    __typename?: 'JoinExit';
    amounts: Array<Scalars['BigDecimal']>;
    id: Scalars['ID'];
    pool: Pool;
    sender: Scalars['Bytes'];
    timestamp: Scalars['Int'];
    tx: Scalars['Bytes'];
    type: InvestType;
    user: User;
};

export type JoinExit_Filter = {
    amounts?: Maybe<Array<Scalars['BigDecimal']>>;
    amounts_contains?: Maybe<Array<Scalars['BigDecimal']>>;
    amounts_not?: Maybe<Array<Scalars['BigDecimal']>>;
    amounts_not_contains?: Maybe<Array<Scalars['BigDecimal']>>;
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
    sender?: Maybe<Scalars['Bytes']>;
    sender_contains?: Maybe<Scalars['Bytes']>;
    sender_in?: Maybe<Array<Scalars['Bytes']>>;
    sender_not?: Maybe<Scalars['Bytes']>;
    sender_not_contains?: Maybe<Scalars['Bytes']>;
    sender_not_in?: Maybe<Array<Scalars['Bytes']>>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    tx?: Maybe<Scalars['Bytes']>;
    tx_contains?: Maybe<Scalars['Bytes']>;
    tx_in?: Maybe<Array<Scalars['Bytes']>>;
    tx_not?: Maybe<Scalars['Bytes']>;
    tx_not_contains?: Maybe<Scalars['Bytes']>;
    tx_not_in?: Maybe<Array<Scalars['Bytes']>>;
    type?: Maybe<InvestType>;
    type_in?: Maybe<Array<InvestType>>;
    type_not?: Maybe<InvestType>;
    type_not_in?: Maybe<Array<InvestType>>;
    user?: Maybe<Scalars['String']>;
    user_contains?: Maybe<Scalars['String']>;
    user_ends_with?: Maybe<Scalars['String']>;
    user_gt?: Maybe<Scalars['String']>;
    user_gte?: Maybe<Scalars['String']>;
    user_in?: Maybe<Array<Scalars['String']>>;
    user_lt?: Maybe<Scalars['String']>;
    user_lte?: Maybe<Scalars['String']>;
    user_not?: Maybe<Scalars['String']>;
    user_not_contains?: Maybe<Scalars['String']>;
    user_not_ends_with?: Maybe<Scalars['String']>;
    user_not_in?: Maybe<Array<Scalars['String']>>;
    user_not_starts_with?: Maybe<Scalars['String']>;
    user_starts_with?: Maybe<Scalars['String']>;
};

export enum JoinExit_OrderBy {
    Amounts = 'amounts',
    Id = 'id',
    Pool = 'pool',
    Sender = 'sender',
    Timestamp = 'timestamp',
    Tx = 'tx',
    Type = 'type',
    User = 'user',
}

export type LatestPrice = {
    __typename?: 'LatestPrice';
    asset: Scalars['Bytes'];
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    poolId: Pool;
    price: Scalars['BigDecimal'];
    priceUsd: Scalars['BigDecimal'];
    pricingAsset: Scalars['Bytes'];
};

export type LatestPrice_Filter = {
    asset?: Maybe<Scalars['Bytes']>;
    asset_contains?: Maybe<Scalars['Bytes']>;
    asset_in?: Maybe<Array<Scalars['Bytes']>>;
    asset_not?: Maybe<Scalars['Bytes']>;
    asset_not_contains?: Maybe<Scalars['Bytes']>;
    asset_not_in?: Maybe<Array<Scalars['Bytes']>>;
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
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    price?: Maybe<Scalars['BigDecimal']>;
    priceUsd?: Maybe<Scalars['BigDecimal']>;
    priceUsd_gt?: Maybe<Scalars['BigDecimal']>;
    priceUsd_gte?: Maybe<Scalars['BigDecimal']>;
    priceUsd_in?: Maybe<Array<Scalars['BigDecimal']>>;
    priceUsd_lt?: Maybe<Scalars['BigDecimal']>;
    priceUsd_lte?: Maybe<Scalars['BigDecimal']>;
    priceUsd_not?: Maybe<Scalars['BigDecimal']>;
    priceUsd_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    price_gt?: Maybe<Scalars['BigDecimal']>;
    price_gte?: Maybe<Scalars['BigDecimal']>;
    price_in?: Maybe<Array<Scalars['BigDecimal']>>;
    price_lt?: Maybe<Scalars['BigDecimal']>;
    price_lte?: Maybe<Scalars['BigDecimal']>;
    price_not?: Maybe<Scalars['BigDecimal']>;
    price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    pricingAsset?: Maybe<Scalars['Bytes']>;
    pricingAsset_contains?: Maybe<Scalars['Bytes']>;
    pricingAsset_in?: Maybe<Array<Scalars['Bytes']>>;
    pricingAsset_not?: Maybe<Scalars['Bytes']>;
    pricingAsset_not_contains?: Maybe<Scalars['Bytes']>;
    pricingAsset_not_in?: Maybe<Array<Scalars['Bytes']>>;
};

export enum LatestPrice_OrderBy {
    Asset = 'asset',
    Block = 'block',
    Id = 'id',
    PoolId = 'poolId',
    Price = 'price',
    PriceUsd = 'priceUsd',
    PricingAsset = 'pricingAsset',
}

export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type Pool = {
    __typename?: 'Pool';
    address: Scalars['Bytes'];
    amp?: Maybe<Scalars['BigInt']>;
    baseToken?: Maybe<Scalars['Bytes']>;
    createTime: Scalars['Int'];
    expiryTime?: Maybe<Scalars['BigInt']>;
    factory?: Maybe<Scalars['Bytes']>;
    historicalValues?: Maybe<Array<PoolHistoricalLiquidity>>;
    holdersCount: Scalars['BigInt'];
    id: Scalars['ID'];
    managementFee?: Maybe<Scalars['BigDecimal']>;
    name?: Maybe<Scalars['String']>;
    owner?: Maybe<Scalars['Bytes']>;
    poolType?: Maybe<Scalars['String']>;
    priceRateProviders?: Maybe<Array<PriceRateProvider>>;
    principalToken?: Maybe<Scalars['Bytes']>;
    shares?: Maybe<Array<PoolShare>>;
    strategyType: Scalars['Int'];
    swapEnabled: Scalars['Boolean'];
    swapFee: Scalars['BigDecimal'];
    swaps?: Maybe<Array<Swap>>;
    swapsCount: Scalars['BigInt'];
    symbol?: Maybe<Scalars['String']>;
    tokens?: Maybe<Array<PoolToken>>;
    tokensList: Array<Scalars['Bytes']>;
    totalLiquidity: Scalars['BigDecimal'];
    totalShares: Scalars['BigDecimal'];
    totalSwapFee: Scalars['BigDecimal'];
    totalSwapVolume: Scalars['BigDecimal'];
    totalWeight?: Maybe<Scalars['BigDecimal']>;
    tx?: Maybe<Scalars['Bytes']>;
    unitSeconds?: Maybe<Scalars['BigInt']>;
    vaultID: Balancer;
    weightUpdates?: Maybe<Array<GradualWeightUpdate>>;
};

export type PoolHistoricalValuesArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolHistoricalLiquidity_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolHistoricalLiquidity_Filter>;
};

export type PoolPriceRateProvidersArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PriceRateProvider_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PriceRateProvider_Filter>;
};

export type PoolSharesArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolShare_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolShare_Filter>;
};

export type PoolSwapsArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Swap_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Swap_Filter>;
};

export type PoolTokensArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolToken_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolToken_Filter>;
};

export type PoolWeightUpdatesArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<GradualWeightUpdate_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<GradualWeightUpdate_Filter>;
};

export type PoolHistoricalLiquidity = {
    __typename?: 'PoolHistoricalLiquidity';
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    poolId: Pool;
    poolLiquidity: Scalars['BigDecimal'];
    poolLiquidityUSD: Scalars['BigDecimal'];
    poolShareValue: Scalars['BigDecimal'];
    poolTotalShares: Scalars['BigDecimal'];
    pricingAsset: Scalars['Bytes'];
    timestamp: Scalars['Int'];
};

export type PoolHistoricalLiquidity_Filter = {
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
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    poolLiquidity?: Maybe<Scalars['BigDecimal']>;
    poolLiquidityUSD?: Maybe<Scalars['BigDecimal']>;
    poolLiquidityUSD_gt?: Maybe<Scalars['BigDecimal']>;
    poolLiquidityUSD_gte?: Maybe<Scalars['BigDecimal']>;
    poolLiquidityUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
    poolLiquidityUSD_lt?: Maybe<Scalars['BigDecimal']>;
    poolLiquidityUSD_lte?: Maybe<Scalars['BigDecimal']>;
    poolLiquidityUSD_not?: Maybe<Scalars['BigDecimal']>;
    poolLiquidityUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    poolLiquidity_gt?: Maybe<Scalars['BigDecimal']>;
    poolLiquidity_gte?: Maybe<Scalars['BigDecimal']>;
    poolLiquidity_in?: Maybe<Array<Scalars['BigDecimal']>>;
    poolLiquidity_lt?: Maybe<Scalars['BigDecimal']>;
    poolLiquidity_lte?: Maybe<Scalars['BigDecimal']>;
    poolLiquidity_not?: Maybe<Scalars['BigDecimal']>;
    poolLiquidity_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    poolShareValue?: Maybe<Scalars['BigDecimal']>;
    poolShareValue_gt?: Maybe<Scalars['BigDecimal']>;
    poolShareValue_gte?: Maybe<Scalars['BigDecimal']>;
    poolShareValue_in?: Maybe<Array<Scalars['BigDecimal']>>;
    poolShareValue_lt?: Maybe<Scalars['BigDecimal']>;
    poolShareValue_lte?: Maybe<Scalars['BigDecimal']>;
    poolShareValue_not?: Maybe<Scalars['BigDecimal']>;
    poolShareValue_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    poolTotalShares?: Maybe<Scalars['BigDecimal']>;
    poolTotalShares_gt?: Maybe<Scalars['BigDecimal']>;
    poolTotalShares_gte?: Maybe<Scalars['BigDecimal']>;
    poolTotalShares_in?: Maybe<Array<Scalars['BigDecimal']>>;
    poolTotalShares_lt?: Maybe<Scalars['BigDecimal']>;
    poolTotalShares_lte?: Maybe<Scalars['BigDecimal']>;
    poolTotalShares_not?: Maybe<Scalars['BigDecimal']>;
    poolTotalShares_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    pricingAsset?: Maybe<Scalars['Bytes']>;
    pricingAsset_contains?: Maybe<Scalars['Bytes']>;
    pricingAsset_in?: Maybe<Array<Scalars['Bytes']>>;
    pricingAsset_not?: Maybe<Scalars['Bytes']>;
    pricingAsset_not_contains?: Maybe<Scalars['Bytes']>;
    pricingAsset_not_in?: Maybe<Array<Scalars['Bytes']>>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
};

export enum PoolHistoricalLiquidity_OrderBy {
    Block = 'block',
    Id = 'id',
    PoolId = 'poolId',
    PoolLiquidity = 'poolLiquidity',
    PoolLiquidityUsd = 'poolLiquidityUSD',
    PoolShareValue = 'poolShareValue',
    PoolTotalShares = 'poolTotalShares',
    PricingAsset = 'pricingAsset',
    Timestamp = 'timestamp',
}

export type PoolShare = {
    __typename?: 'PoolShare';
    balance: Scalars['BigDecimal'];
    id: Scalars['ID'];
    poolId: Pool;
    userAddress: User;
};

export type PoolShare_Filter = {
    balance?: Maybe<Scalars['BigDecimal']>;
    balance_gt?: Maybe<Scalars['BigDecimal']>;
    balance_gte?: Maybe<Scalars['BigDecimal']>;
    balance_in?: Maybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: Maybe<Scalars['BigDecimal']>;
    balance_lte?: Maybe<Scalars['BigDecimal']>;
    balance_not?: Maybe<Scalars['BigDecimal']>;
    balance_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    userAddress?: Maybe<Scalars['String']>;
    userAddress_contains?: Maybe<Scalars['String']>;
    userAddress_ends_with?: Maybe<Scalars['String']>;
    userAddress_gt?: Maybe<Scalars['String']>;
    userAddress_gte?: Maybe<Scalars['String']>;
    userAddress_in?: Maybe<Array<Scalars['String']>>;
    userAddress_lt?: Maybe<Scalars['String']>;
    userAddress_lte?: Maybe<Scalars['String']>;
    userAddress_not?: Maybe<Scalars['String']>;
    userAddress_not_contains?: Maybe<Scalars['String']>;
    userAddress_not_ends_with?: Maybe<Scalars['String']>;
    userAddress_not_in?: Maybe<Array<Scalars['String']>>;
    userAddress_not_starts_with?: Maybe<Scalars['String']>;
    userAddress_starts_with?: Maybe<Scalars['String']>;
};

export enum PoolShare_OrderBy {
    Balance = 'balance',
    Id = 'id',
    PoolId = 'poolId',
    UserAddress = 'userAddress',
}

export type PoolSnapshot = {
    __typename?: 'PoolSnapshot';
    amounts: Array<Scalars['BigDecimal']>;
    holdersCount: Scalars['BigInt'];
    id: Scalars['ID'];
    pool: Pool;
    swapFees: Scalars['BigDecimal'];
    swapVolume: Scalars['BigDecimal'];
    swapsCount: Scalars['BigInt'];
    timestamp: Scalars['Int'];
    totalLiquidity: Scalars['BigDecimal'];
    totalShares: Scalars['BigDecimal'];
    totalSwapFee: Scalars['BigDecimal'];
    totalSwapVolume: Scalars['BigDecimal'];
};

export type PoolSnapshot_Filter = {
    amounts?: Maybe<Array<Scalars['BigDecimal']>>;
    amounts_contains?: Maybe<Array<Scalars['BigDecimal']>>;
    amounts_not?: Maybe<Array<Scalars['BigDecimal']>>;
    amounts_not_contains?: Maybe<Array<Scalars['BigDecimal']>>;
    holdersCount?: Maybe<Scalars['BigInt']>;
    holdersCount_gt?: Maybe<Scalars['BigInt']>;
    holdersCount_gte?: Maybe<Scalars['BigInt']>;
    holdersCount_in?: Maybe<Array<Scalars['BigInt']>>;
    holdersCount_lt?: Maybe<Scalars['BigInt']>;
    holdersCount_lte?: Maybe<Scalars['BigInt']>;
    holdersCount_not?: Maybe<Scalars['BigInt']>;
    holdersCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
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
    swapFees?: Maybe<Scalars['BigDecimal']>;
    swapFees_gt?: Maybe<Scalars['BigDecimal']>;
    swapFees_gte?: Maybe<Scalars['BigDecimal']>;
    swapFees_in?: Maybe<Array<Scalars['BigDecimal']>>;
    swapFees_lt?: Maybe<Scalars['BigDecimal']>;
    swapFees_lte?: Maybe<Scalars['BigDecimal']>;
    swapFees_not?: Maybe<Scalars['BigDecimal']>;
    swapFees_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    swapVolume?: Maybe<Scalars['BigDecimal']>;
    swapVolume_gt?: Maybe<Scalars['BigDecimal']>;
    swapVolume_gte?: Maybe<Scalars['BigDecimal']>;
    swapVolume_in?: Maybe<Array<Scalars['BigDecimal']>>;
    swapVolume_lt?: Maybe<Scalars['BigDecimal']>;
    swapVolume_lte?: Maybe<Scalars['BigDecimal']>;
    swapVolume_not?: Maybe<Scalars['BigDecimal']>;
    swapVolume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    swapsCount?: Maybe<Scalars['BigInt']>;
    swapsCount_gt?: Maybe<Scalars['BigInt']>;
    swapsCount_gte?: Maybe<Scalars['BigInt']>;
    swapsCount_in?: Maybe<Array<Scalars['BigInt']>>;
    swapsCount_lt?: Maybe<Scalars['BigInt']>;
    swapsCount_lte?: Maybe<Scalars['BigInt']>;
    swapsCount_not?: Maybe<Scalars['BigInt']>;
    swapsCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    totalLiquidity?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_gt?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_gte?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalLiquidity_lt?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_lte?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_not?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalShares?: Maybe<Scalars['BigDecimal']>;
    totalShares_gt?: Maybe<Scalars['BigDecimal']>;
    totalShares_gte?: Maybe<Scalars['BigDecimal']>;
    totalShares_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalShares_lt?: Maybe<Scalars['BigDecimal']>;
    totalShares_lte?: Maybe<Scalars['BigDecimal']>;
    totalShares_not?: Maybe<Scalars['BigDecimal']>;
    totalShares_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapFee?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapFee_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolSnapshot_OrderBy {
    Amounts = 'amounts',
    HoldersCount = 'holdersCount',
    Id = 'id',
    Pool = 'pool',
    SwapFees = 'swapFees',
    SwapVolume = 'swapVolume',
    SwapsCount = 'swapsCount',
    Timestamp = 'timestamp',
    TotalLiquidity = 'totalLiquidity',
    TotalShares = 'totalShares',
    TotalSwapFee = 'totalSwapFee',
    TotalSwapVolume = 'totalSwapVolume',
}

export type PoolToken = {
    __typename?: 'PoolToken';
    address: Scalars['String'];
    balance: Scalars['BigDecimal'];
    decimals: Scalars['Int'];
    id: Scalars['ID'];
    invested: Scalars['BigDecimal'];
    investments?: Maybe<Array<Investment>>;
    name: Scalars['String'];
    poolId: Pool;
    priceRate: Scalars['BigDecimal'];
    symbol: Scalars['String'];
    token: Token;
    weight?: Maybe<Scalars['BigDecimal']>;
};

export type PoolTokenInvestmentsArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Investment_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Investment_Filter>;
};

export type PoolToken_Filter = {
    address?: Maybe<Scalars['String']>;
    address_contains?: Maybe<Scalars['String']>;
    address_ends_with?: Maybe<Scalars['String']>;
    address_gt?: Maybe<Scalars['String']>;
    address_gte?: Maybe<Scalars['String']>;
    address_in?: Maybe<Array<Scalars['String']>>;
    address_lt?: Maybe<Scalars['String']>;
    address_lte?: Maybe<Scalars['String']>;
    address_not?: Maybe<Scalars['String']>;
    address_not_contains?: Maybe<Scalars['String']>;
    address_not_ends_with?: Maybe<Scalars['String']>;
    address_not_in?: Maybe<Array<Scalars['String']>>;
    address_not_starts_with?: Maybe<Scalars['String']>;
    address_starts_with?: Maybe<Scalars['String']>;
    balance?: Maybe<Scalars['BigDecimal']>;
    balance_gt?: Maybe<Scalars['BigDecimal']>;
    balance_gte?: Maybe<Scalars['BigDecimal']>;
    balance_in?: Maybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: Maybe<Scalars['BigDecimal']>;
    balance_lte?: Maybe<Scalars['BigDecimal']>;
    balance_not?: Maybe<Scalars['BigDecimal']>;
    balance_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    decimals?: Maybe<Scalars['Int']>;
    decimals_gt?: Maybe<Scalars['Int']>;
    decimals_gte?: Maybe<Scalars['Int']>;
    decimals_in?: Maybe<Array<Scalars['Int']>>;
    decimals_lt?: Maybe<Scalars['Int']>;
    decimals_lte?: Maybe<Scalars['Int']>;
    decimals_not?: Maybe<Scalars['Int']>;
    decimals_not_in?: Maybe<Array<Scalars['Int']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    invested?: Maybe<Scalars['BigDecimal']>;
    invested_gt?: Maybe<Scalars['BigDecimal']>;
    invested_gte?: Maybe<Scalars['BigDecimal']>;
    invested_in?: Maybe<Array<Scalars['BigDecimal']>>;
    invested_lt?: Maybe<Scalars['BigDecimal']>;
    invested_lte?: Maybe<Scalars['BigDecimal']>;
    invested_not?: Maybe<Scalars['BigDecimal']>;
    invested_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    name?: Maybe<Scalars['String']>;
    name_contains?: Maybe<Scalars['String']>;
    name_ends_with?: Maybe<Scalars['String']>;
    name_gt?: Maybe<Scalars['String']>;
    name_gte?: Maybe<Scalars['String']>;
    name_in?: Maybe<Array<Scalars['String']>>;
    name_lt?: Maybe<Scalars['String']>;
    name_lte?: Maybe<Scalars['String']>;
    name_not?: Maybe<Scalars['String']>;
    name_not_contains?: Maybe<Scalars['String']>;
    name_not_ends_with?: Maybe<Scalars['String']>;
    name_not_in?: Maybe<Array<Scalars['String']>>;
    name_not_starts_with?: Maybe<Scalars['String']>;
    name_starts_with?: Maybe<Scalars['String']>;
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    priceRate?: Maybe<Scalars['BigDecimal']>;
    priceRate_gt?: Maybe<Scalars['BigDecimal']>;
    priceRate_gte?: Maybe<Scalars['BigDecimal']>;
    priceRate_in?: Maybe<Array<Scalars['BigDecimal']>>;
    priceRate_lt?: Maybe<Scalars['BigDecimal']>;
    priceRate_lte?: Maybe<Scalars['BigDecimal']>;
    priceRate_not?: Maybe<Scalars['BigDecimal']>;
    priceRate_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    symbol?: Maybe<Scalars['String']>;
    symbol_contains?: Maybe<Scalars['String']>;
    symbol_ends_with?: Maybe<Scalars['String']>;
    symbol_gt?: Maybe<Scalars['String']>;
    symbol_gte?: Maybe<Scalars['String']>;
    symbol_in?: Maybe<Array<Scalars['String']>>;
    symbol_lt?: Maybe<Scalars['String']>;
    symbol_lte?: Maybe<Scalars['String']>;
    symbol_not?: Maybe<Scalars['String']>;
    symbol_not_contains?: Maybe<Scalars['String']>;
    symbol_not_ends_with?: Maybe<Scalars['String']>;
    symbol_not_in?: Maybe<Array<Scalars['String']>>;
    symbol_not_starts_with?: Maybe<Scalars['String']>;
    symbol_starts_with?: Maybe<Scalars['String']>;
    token?: Maybe<Scalars['String']>;
    token_contains?: Maybe<Scalars['String']>;
    token_ends_with?: Maybe<Scalars['String']>;
    token_gt?: Maybe<Scalars['String']>;
    token_gte?: Maybe<Scalars['String']>;
    token_in?: Maybe<Array<Scalars['String']>>;
    token_lt?: Maybe<Scalars['String']>;
    token_lte?: Maybe<Scalars['String']>;
    token_not?: Maybe<Scalars['String']>;
    token_not_contains?: Maybe<Scalars['String']>;
    token_not_ends_with?: Maybe<Scalars['String']>;
    token_not_in?: Maybe<Array<Scalars['String']>>;
    token_not_starts_with?: Maybe<Scalars['String']>;
    token_starts_with?: Maybe<Scalars['String']>;
    weight?: Maybe<Scalars['BigDecimal']>;
    weight_gt?: Maybe<Scalars['BigDecimal']>;
    weight_gte?: Maybe<Scalars['BigDecimal']>;
    weight_in?: Maybe<Array<Scalars['BigDecimal']>>;
    weight_lt?: Maybe<Scalars['BigDecimal']>;
    weight_lte?: Maybe<Scalars['BigDecimal']>;
    weight_not?: Maybe<Scalars['BigDecimal']>;
    weight_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolToken_OrderBy {
    Address = 'address',
    Balance = 'balance',
    Decimals = 'decimals',
    Id = 'id',
    Invested = 'invested',
    Investments = 'investments',
    Name = 'name',
    PoolId = 'poolId',
    PriceRate = 'priceRate',
    Symbol = 'symbol',
    Token = 'token',
    Weight = 'weight',
}

export type Pool_Filter = {
    address?: Maybe<Scalars['Bytes']>;
    address_contains?: Maybe<Scalars['Bytes']>;
    address_in?: Maybe<Array<Scalars['Bytes']>>;
    address_not?: Maybe<Scalars['Bytes']>;
    address_not_contains?: Maybe<Scalars['Bytes']>;
    address_not_in?: Maybe<Array<Scalars['Bytes']>>;
    amp?: Maybe<Scalars['BigInt']>;
    amp_gt?: Maybe<Scalars['BigInt']>;
    amp_gte?: Maybe<Scalars['BigInt']>;
    amp_in?: Maybe<Array<Scalars['BigInt']>>;
    amp_lt?: Maybe<Scalars['BigInt']>;
    amp_lte?: Maybe<Scalars['BigInt']>;
    amp_not?: Maybe<Scalars['BigInt']>;
    amp_not_in?: Maybe<Array<Scalars['BigInt']>>;
    baseToken?: Maybe<Scalars['Bytes']>;
    baseToken_contains?: Maybe<Scalars['Bytes']>;
    baseToken_in?: Maybe<Array<Scalars['Bytes']>>;
    baseToken_not?: Maybe<Scalars['Bytes']>;
    baseToken_not_contains?: Maybe<Scalars['Bytes']>;
    baseToken_not_in?: Maybe<Array<Scalars['Bytes']>>;
    createTime?: Maybe<Scalars['Int']>;
    createTime_gt?: Maybe<Scalars['Int']>;
    createTime_gte?: Maybe<Scalars['Int']>;
    createTime_in?: Maybe<Array<Scalars['Int']>>;
    createTime_lt?: Maybe<Scalars['Int']>;
    createTime_lte?: Maybe<Scalars['Int']>;
    createTime_not?: Maybe<Scalars['Int']>;
    createTime_not_in?: Maybe<Array<Scalars['Int']>>;
    expiryTime?: Maybe<Scalars['BigInt']>;
    expiryTime_gt?: Maybe<Scalars['BigInt']>;
    expiryTime_gte?: Maybe<Scalars['BigInt']>;
    expiryTime_in?: Maybe<Array<Scalars['BigInt']>>;
    expiryTime_lt?: Maybe<Scalars['BigInt']>;
    expiryTime_lte?: Maybe<Scalars['BigInt']>;
    expiryTime_not?: Maybe<Scalars['BigInt']>;
    expiryTime_not_in?: Maybe<Array<Scalars['BigInt']>>;
    factory?: Maybe<Scalars['Bytes']>;
    factory_contains?: Maybe<Scalars['Bytes']>;
    factory_in?: Maybe<Array<Scalars['Bytes']>>;
    factory_not?: Maybe<Scalars['Bytes']>;
    factory_not_contains?: Maybe<Scalars['Bytes']>;
    factory_not_in?: Maybe<Array<Scalars['Bytes']>>;
    holdersCount?: Maybe<Scalars['BigInt']>;
    holdersCount_gt?: Maybe<Scalars['BigInt']>;
    holdersCount_gte?: Maybe<Scalars['BigInt']>;
    holdersCount_in?: Maybe<Array<Scalars['BigInt']>>;
    holdersCount_lt?: Maybe<Scalars['BigInt']>;
    holdersCount_lte?: Maybe<Scalars['BigInt']>;
    holdersCount_not?: Maybe<Scalars['BigInt']>;
    holdersCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    managementFee?: Maybe<Scalars['BigDecimal']>;
    managementFee_gt?: Maybe<Scalars['BigDecimal']>;
    managementFee_gte?: Maybe<Scalars['BigDecimal']>;
    managementFee_in?: Maybe<Array<Scalars['BigDecimal']>>;
    managementFee_lt?: Maybe<Scalars['BigDecimal']>;
    managementFee_lte?: Maybe<Scalars['BigDecimal']>;
    managementFee_not?: Maybe<Scalars['BigDecimal']>;
    managementFee_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    name?: Maybe<Scalars['String']>;
    name_contains?: Maybe<Scalars['String']>;
    name_ends_with?: Maybe<Scalars['String']>;
    name_gt?: Maybe<Scalars['String']>;
    name_gte?: Maybe<Scalars['String']>;
    name_in?: Maybe<Array<Scalars['String']>>;
    name_lt?: Maybe<Scalars['String']>;
    name_lte?: Maybe<Scalars['String']>;
    name_not?: Maybe<Scalars['String']>;
    name_not_contains?: Maybe<Scalars['String']>;
    name_not_ends_with?: Maybe<Scalars['String']>;
    name_not_in?: Maybe<Array<Scalars['String']>>;
    name_not_starts_with?: Maybe<Scalars['String']>;
    name_starts_with?: Maybe<Scalars['String']>;
    owner?: Maybe<Scalars['Bytes']>;
    owner_contains?: Maybe<Scalars['Bytes']>;
    owner_in?: Maybe<Array<Scalars['Bytes']>>;
    owner_not?: Maybe<Scalars['Bytes']>;
    owner_not_contains?: Maybe<Scalars['Bytes']>;
    owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
    poolType?: Maybe<Scalars['String']>;
    poolType_contains?: Maybe<Scalars['String']>;
    poolType_ends_with?: Maybe<Scalars['String']>;
    poolType_gt?: Maybe<Scalars['String']>;
    poolType_gte?: Maybe<Scalars['String']>;
    poolType_in?: Maybe<Array<Scalars['String']>>;
    poolType_lt?: Maybe<Scalars['String']>;
    poolType_lte?: Maybe<Scalars['String']>;
    poolType_not?: Maybe<Scalars['String']>;
    poolType_not_contains?: Maybe<Scalars['String']>;
    poolType_not_ends_with?: Maybe<Scalars['String']>;
    poolType_not_in?: Maybe<Array<Scalars['String']>>;
    poolType_not_starts_with?: Maybe<Scalars['String']>;
    poolType_starts_with?: Maybe<Scalars['String']>;
    principalToken?: Maybe<Scalars['Bytes']>;
    principalToken_contains?: Maybe<Scalars['Bytes']>;
    principalToken_in?: Maybe<Array<Scalars['Bytes']>>;
    principalToken_not?: Maybe<Scalars['Bytes']>;
    principalToken_not_contains?: Maybe<Scalars['Bytes']>;
    principalToken_not_in?: Maybe<Array<Scalars['Bytes']>>;
    strategyType?: Maybe<Scalars['Int']>;
    strategyType_gt?: Maybe<Scalars['Int']>;
    strategyType_gte?: Maybe<Scalars['Int']>;
    strategyType_in?: Maybe<Array<Scalars['Int']>>;
    strategyType_lt?: Maybe<Scalars['Int']>;
    strategyType_lte?: Maybe<Scalars['Int']>;
    strategyType_not?: Maybe<Scalars['Int']>;
    strategyType_not_in?: Maybe<Array<Scalars['Int']>>;
    swapEnabled?: Maybe<Scalars['Boolean']>;
    swapEnabled_in?: Maybe<Array<Scalars['Boolean']>>;
    swapEnabled_not?: Maybe<Scalars['Boolean']>;
    swapEnabled_not_in?: Maybe<Array<Scalars['Boolean']>>;
    swapFee?: Maybe<Scalars['BigDecimal']>;
    swapFee_gt?: Maybe<Scalars['BigDecimal']>;
    swapFee_gte?: Maybe<Scalars['BigDecimal']>;
    swapFee_in?: Maybe<Array<Scalars['BigDecimal']>>;
    swapFee_lt?: Maybe<Scalars['BigDecimal']>;
    swapFee_lte?: Maybe<Scalars['BigDecimal']>;
    swapFee_not?: Maybe<Scalars['BigDecimal']>;
    swapFee_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    swapsCount?: Maybe<Scalars['BigInt']>;
    swapsCount_gt?: Maybe<Scalars['BigInt']>;
    swapsCount_gte?: Maybe<Scalars['BigInt']>;
    swapsCount_in?: Maybe<Array<Scalars['BigInt']>>;
    swapsCount_lt?: Maybe<Scalars['BigInt']>;
    swapsCount_lte?: Maybe<Scalars['BigInt']>;
    swapsCount_not?: Maybe<Scalars['BigInt']>;
    swapsCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    symbol?: Maybe<Scalars['String']>;
    symbol_contains?: Maybe<Scalars['String']>;
    symbol_ends_with?: Maybe<Scalars['String']>;
    symbol_gt?: Maybe<Scalars['String']>;
    symbol_gte?: Maybe<Scalars['String']>;
    symbol_in?: Maybe<Array<Scalars['String']>>;
    symbol_lt?: Maybe<Scalars['String']>;
    symbol_lte?: Maybe<Scalars['String']>;
    symbol_not?: Maybe<Scalars['String']>;
    symbol_not_contains?: Maybe<Scalars['String']>;
    symbol_not_ends_with?: Maybe<Scalars['String']>;
    symbol_not_in?: Maybe<Array<Scalars['String']>>;
    symbol_not_starts_with?: Maybe<Scalars['String']>;
    symbol_starts_with?: Maybe<Scalars['String']>;
    tokensList?: Maybe<Array<Scalars['Bytes']>>;
    tokensList_contains?: Maybe<Array<Scalars['Bytes']>>;
    tokensList_not?: Maybe<Array<Scalars['Bytes']>>;
    tokensList_not_contains?: Maybe<Array<Scalars['Bytes']>>;
    totalLiquidity?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_gt?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_gte?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalLiquidity_lt?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_lte?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_not?: Maybe<Scalars['BigDecimal']>;
    totalLiquidity_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalShares?: Maybe<Scalars['BigDecimal']>;
    totalShares_gt?: Maybe<Scalars['BigDecimal']>;
    totalShares_gte?: Maybe<Scalars['BigDecimal']>;
    totalShares_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalShares_lt?: Maybe<Scalars['BigDecimal']>;
    totalShares_lte?: Maybe<Scalars['BigDecimal']>;
    totalShares_not?: Maybe<Scalars['BigDecimal']>;
    totalShares_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapFee?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapFee_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalWeight?: Maybe<Scalars['BigDecimal']>;
    totalWeight_gt?: Maybe<Scalars['BigDecimal']>;
    totalWeight_gte?: Maybe<Scalars['BigDecimal']>;
    totalWeight_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalWeight_lt?: Maybe<Scalars['BigDecimal']>;
    totalWeight_lte?: Maybe<Scalars['BigDecimal']>;
    totalWeight_not?: Maybe<Scalars['BigDecimal']>;
    totalWeight_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    tx?: Maybe<Scalars['Bytes']>;
    tx_contains?: Maybe<Scalars['Bytes']>;
    tx_in?: Maybe<Array<Scalars['Bytes']>>;
    tx_not?: Maybe<Scalars['Bytes']>;
    tx_not_contains?: Maybe<Scalars['Bytes']>;
    tx_not_in?: Maybe<Array<Scalars['Bytes']>>;
    unitSeconds?: Maybe<Scalars['BigInt']>;
    unitSeconds_gt?: Maybe<Scalars['BigInt']>;
    unitSeconds_gte?: Maybe<Scalars['BigInt']>;
    unitSeconds_in?: Maybe<Array<Scalars['BigInt']>>;
    unitSeconds_lt?: Maybe<Scalars['BigInt']>;
    unitSeconds_lte?: Maybe<Scalars['BigInt']>;
    unitSeconds_not?: Maybe<Scalars['BigInt']>;
    unitSeconds_not_in?: Maybe<Array<Scalars['BigInt']>>;
    vaultID?: Maybe<Scalars['String']>;
    vaultID_contains?: Maybe<Scalars['String']>;
    vaultID_ends_with?: Maybe<Scalars['String']>;
    vaultID_gt?: Maybe<Scalars['String']>;
    vaultID_gte?: Maybe<Scalars['String']>;
    vaultID_in?: Maybe<Array<Scalars['String']>>;
    vaultID_lt?: Maybe<Scalars['String']>;
    vaultID_lte?: Maybe<Scalars['String']>;
    vaultID_not?: Maybe<Scalars['String']>;
    vaultID_not_contains?: Maybe<Scalars['String']>;
    vaultID_not_ends_with?: Maybe<Scalars['String']>;
    vaultID_not_in?: Maybe<Array<Scalars['String']>>;
    vaultID_not_starts_with?: Maybe<Scalars['String']>;
    vaultID_starts_with?: Maybe<Scalars['String']>;
};

export enum Pool_OrderBy {
    Address = 'address',
    Amp = 'amp',
    BaseToken = 'baseToken',
    CreateTime = 'createTime',
    ExpiryTime = 'expiryTime',
    Factory = 'factory',
    HistoricalValues = 'historicalValues',
    HoldersCount = 'holdersCount',
    Id = 'id',
    ManagementFee = 'managementFee',
    Name = 'name',
    Owner = 'owner',
    PoolType = 'poolType',
    PriceRateProviders = 'priceRateProviders',
    PrincipalToken = 'principalToken',
    Shares = 'shares',
    StrategyType = 'strategyType',
    SwapEnabled = 'swapEnabled',
    SwapFee = 'swapFee',
    Swaps = 'swaps',
    SwapsCount = 'swapsCount',
    Symbol = 'symbol',
    Tokens = 'tokens',
    TokensList = 'tokensList',
    TotalLiquidity = 'totalLiquidity',
    TotalShares = 'totalShares',
    TotalSwapFee = 'totalSwapFee',
    TotalSwapVolume = 'totalSwapVolume',
    TotalWeight = 'totalWeight',
    Tx = 'tx',
    UnitSeconds = 'unitSeconds',
    VaultId = 'vaultID',
    WeightUpdates = 'weightUpdates',
}

export type PriceRateProvider = {
    __typename?: 'PriceRateProvider';
    address: Scalars['Bytes'];
    cacheDuration: Scalars['Int'];
    cacheExpiry: Scalars['Int'];
    id: Scalars['ID'];
    lastCached: Scalars['Int'];
    poolId: Pool;
    rate: Scalars['BigDecimal'];
    token: PoolToken;
};

export type PriceRateProvider_Filter = {
    address?: Maybe<Scalars['Bytes']>;
    address_contains?: Maybe<Scalars['Bytes']>;
    address_in?: Maybe<Array<Scalars['Bytes']>>;
    address_not?: Maybe<Scalars['Bytes']>;
    address_not_contains?: Maybe<Scalars['Bytes']>;
    address_not_in?: Maybe<Array<Scalars['Bytes']>>;
    cacheDuration?: Maybe<Scalars['Int']>;
    cacheDuration_gt?: Maybe<Scalars['Int']>;
    cacheDuration_gte?: Maybe<Scalars['Int']>;
    cacheDuration_in?: Maybe<Array<Scalars['Int']>>;
    cacheDuration_lt?: Maybe<Scalars['Int']>;
    cacheDuration_lte?: Maybe<Scalars['Int']>;
    cacheDuration_not?: Maybe<Scalars['Int']>;
    cacheDuration_not_in?: Maybe<Array<Scalars['Int']>>;
    cacheExpiry?: Maybe<Scalars['Int']>;
    cacheExpiry_gt?: Maybe<Scalars['Int']>;
    cacheExpiry_gte?: Maybe<Scalars['Int']>;
    cacheExpiry_in?: Maybe<Array<Scalars['Int']>>;
    cacheExpiry_lt?: Maybe<Scalars['Int']>;
    cacheExpiry_lte?: Maybe<Scalars['Int']>;
    cacheExpiry_not?: Maybe<Scalars['Int']>;
    cacheExpiry_not_in?: Maybe<Array<Scalars['Int']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    lastCached?: Maybe<Scalars['Int']>;
    lastCached_gt?: Maybe<Scalars['Int']>;
    lastCached_gte?: Maybe<Scalars['Int']>;
    lastCached_in?: Maybe<Array<Scalars['Int']>>;
    lastCached_lt?: Maybe<Scalars['Int']>;
    lastCached_lte?: Maybe<Scalars['Int']>;
    lastCached_not?: Maybe<Scalars['Int']>;
    lastCached_not_in?: Maybe<Array<Scalars['Int']>>;
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    rate?: Maybe<Scalars['BigDecimal']>;
    rate_gt?: Maybe<Scalars['BigDecimal']>;
    rate_gte?: Maybe<Scalars['BigDecimal']>;
    rate_in?: Maybe<Array<Scalars['BigDecimal']>>;
    rate_lt?: Maybe<Scalars['BigDecimal']>;
    rate_lte?: Maybe<Scalars['BigDecimal']>;
    rate_not?: Maybe<Scalars['BigDecimal']>;
    rate_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    token?: Maybe<Scalars['String']>;
    token_contains?: Maybe<Scalars['String']>;
    token_ends_with?: Maybe<Scalars['String']>;
    token_gt?: Maybe<Scalars['String']>;
    token_gte?: Maybe<Scalars['String']>;
    token_in?: Maybe<Array<Scalars['String']>>;
    token_lt?: Maybe<Scalars['String']>;
    token_lte?: Maybe<Scalars['String']>;
    token_not?: Maybe<Scalars['String']>;
    token_not_contains?: Maybe<Scalars['String']>;
    token_not_ends_with?: Maybe<Scalars['String']>;
    token_not_in?: Maybe<Array<Scalars['String']>>;
    token_not_starts_with?: Maybe<Scalars['String']>;
    token_starts_with?: Maybe<Scalars['String']>;
};

export enum PriceRateProvider_OrderBy {
    Address = 'address',
    CacheDuration = 'cacheDuration',
    CacheExpiry = 'cacheExpiry',
    Id = 'id',
    LastCached = 'lastCached',
    PoolId = 'poolId',
    Rate = 'rate',
    Token = 'token',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    ampUpdate?: Maybe<AmpUpdate>;
    ampUpdates: Array<AmpUpdate>;
    balancer?: Maybe<Balancer>;
    balancerSnapshot?: Maybe<BalancerSnapshot>;
    balancerSnapshots: Array<BalancerSnapshot>;
    balancers: Array<Balancer>;
    gradualWeightUpdate?: Maybe<GradualWeightUpdate>;
    gradualWeightUpdates: Array<GradualWeightUpdate>;
    investment?: Maybe<Investment>;
    investments: Array<Investment>;
    joinExit?: Maybe<JoinExit>;
    joinExits: Array<JoinExit>;
    latestPrice?: Maybe<LatestPrice>;
    latestPrices: Array<LatestPrice>;
    pool?: Maybe<Pool>;
    poolHistoricalLiquidities: Array<PoolHistoricalLiquidity>;
    poolHistoricalLiquidity?: Maybe<PoolHistoricalLiquidity>;
    poolShare?: Maybe<PoolShare>;
    poolShares: Array<PoolShare>;
    poolSnapshot?: Maybe<PoolSnapshot>;
    poolSnapshots: Array<PoolSnapshot>;
    poolToken?: Maybe<PoolToken>;
    poolTokens: Array<PoolToken>;
    pools: Array<Pool>;
    priceRateProvider?: Maybe<PriceRateProvider>;
    priceRateProviders: Array<PriceRateProvider>;
    swap?: Maybe<Swap>;
    swaps: Array<Swap>;
    token?: Maybe<Token>;
    tokenPrice?: Maybe<TokenPrice>;
    tokenPrices: Array<TokenPrice>;
    tokenSnapshot?: Maybe<TokenSnapshot>;
    tokenSnapshots: Array<TokenSnapshot>;
    tokens: Array<Token>;
    tradePair?: Maybe<TradePair>;
    tradePairSnapshot?: Maybe<TradePairSnapshot>;
    tradePairSnapshots: Array<TradePairSnapshot>;
    tradePairs: Array<TradePair>;
    user?: Maybe<User>;
    userInternalBalance?: Maybe<UserInternalBalance>;
    userInternalBalances: Array<UserInternalBalance>;
    users: Array<User>;
};

export type Query_MetaArgs = {
    block?: Maybe<Block_Height>;
};

export type QueryAmpUpdateArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryAmpUpdatesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<AmpUpdate_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<AmpUpdate_Filter>;
};

export type QueryBalancerArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryBalancerSnapshotArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryBalancerSnapshotsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<BalancerSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<BalancerSnapshot_Filter>;
};

export type QueryBalancersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Balancer_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Balancer_Filter>;
};

export type QueryGradualWeightUpdateArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryGradualWeightUpdatesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<GradualWeightUpdate_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<GradualWeightUpdate_Filter>;
};

export type QueryInvestmentArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryInvestmentsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Investment_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Investment_Filter>;
};

export type QueryJoinExitArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryJoinExitsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<JoinExit_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<JoinExit_Filter>;
};

export type QueryLatestPriceArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryLatestPricesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<LatestPrice_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<LatestPrice_Filter>;
};

export type QueryPoolArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryPoolHistoricalLiquiditiesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolHistoricalLiquidity_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolHistoricalLiquidity_Filter>;
};

export type QueryPoolHistoricalLiquidityArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryPoolShareArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryPoolSharesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolShare_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolShare_Filter>;
};

export type QueryPoolSnapshotArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryPoolSnapshotsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolSnapshot_Filter>;
};

export type QueryPoolTokenArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryPoolTokensArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolToken_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolToken_Filter>;
};

export type QueryPoolsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Pool_Filter>;
};

export type QueryPriceRateProviderArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryPriceRateProvidersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PriceRateProvider_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PriceRateProvider_Filter>;
};

export type QuerySwapArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QuerySwapsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Swap_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Swap_Filter>;
};

export type QueryTokenArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryTokenPriceArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryTokenPricesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TokenPrice_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<TokenPrice_Filter>;
};

export type QueryTokenSnapshotArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryTokenSnapshotsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TokenSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<TokenSnapshot_Filter>;
};

export type QueryTokensArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Token_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Token_Filter>;
};

export type QueryTradePairArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryTradePairSnapshotArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryTradePairSnapshotsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TradePairSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<TradePairSnapshot_Filter>;
};

export type QueryTradePairsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TradePair_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<TradePair_Filter>;
};

export type QueryUserArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryUserInternalBalanceArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryUserInternalBalancesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<UserInternalBalance_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<UserInternalBalance_Filter>;
};

export type QueryUsersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<User_Filter>;
};

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    ampUpdate?: Maybe<AmpUpdate>;
    ampUpdates: Array<AmpUpdate>;
    balancer?: Maybe<Balancer>;
    balancerSnapshot?: Maybe<BalancerSnapshot>;
    balancerSnapshots: Array<BalancerSnapshot>;
    balancers: Array<Balancer>;
    gradualWeightUpdate?: Maybe<GradualWeightUpdate>;
    gradualWeightUpdates: Array<GradualWeightUpdate>;
    investment?: Maybe<Investment>;
    investments: Array<Investment>;
    joinExit?: Maybe<JoinExit>;
    joinExits: Array<JoinExit>;
    latestPrice?: Maybe<LatestPrice>;
    latestPrices: Array<LatestPrice>;
    pool?: Maybe<Pool>;
    poolHistoricalLiquidities: Array<PoolHistoricalLiquidity>;
    poolHistoricalLiquidity?: Maybe<PoolHistoricalLiquidity>;
    poolShare?: Maybe<PoolShare>;
    poolShares: Array<PoolShare>;
    poolSnapshot?: Maybe<PoolSnapshot>;
    poolSnapshots: Array<PoolSnapshot>;
    poolToken?: Maybe<PoolToken>;
    poolTokens: Array<PoolToken>;
    pools: Array<Pool>;
    priceRateProvider?: Maybe<PriceRateProvider>;
    priceRateProviders: Array<PriceRateProvider>;
    swap?: Maybe<Swap>;
    swaps: Array<Swap>;
    token?: Maybe<Token>;
    tokenPrice?: Maybe<TokenPrice>;
    tokenPrices: Array<TokenPrice>;
    tokenSnapshot?: Maybe<TokenSnapshot>;
    tokenSnapshots: Array<TokenSnapshot>;
    tokens: Array<Token>;
    tradePair?: Maybe<TradePair>;
    tradePairSnapshot?: Maybe<TradePairSnapshot>;
    tradePairSnapshots: Array<TradePairSnapshot>;
    tradePairs: Array<TradePair>;
    user?: Maybe<User>;
    userInternalBalance?: Maybe<UserInternalBalance>;
    userInternalBalances: Array<UserInternalBalance>;
    users: Array<User>;
};

export type Subscription_MetaArgs = {
    block?: Maybe<Block_Height>;
};

export type SubscriptionAmpUpdateArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionAmpUpdatesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<AmpUpdate_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<AmpUpdate_Filter>;
};

export type SubscriptionBalancerArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionBalancerSnapshotArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionBalancerSnapshotsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<BalancerSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<BalancerSnapshot_Filter>;
};

export type SubscriptionBalancersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Balancer_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Balancer_Filter>;
};

export type SubscriptionGradualWeightUpdateArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionGradualWeightUpdatesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<GradualWeightUpdate_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<GradualWeightUpdate_Filter>;
};

export type SubscriptionInvestmentArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionInvestmentsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Investment_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Investment_Filter>;
};

export type SubscriptionJoinExitArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionJoinExitsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<JoinExit_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<JoinExit_Filter>;
};

export type SubscriptionLatestPriceArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionLatestPricesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<LatestPrice_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<LatestPrice_Filter>;
};

export type SubscriptionPoolArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionPoolHistoricalLiquiditiesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolHistoricalLiquidity_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolHistoricalLiquidity_Filter>;
};

export type SubscriptionPoolHistoricalLiquidityArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionPoolShareArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionPoolSharesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolShare_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolShare_Filter>;
};

export type SubscriptionPoolSnapshotArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionPoolSnapshotsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolSnapshot_Filter>;
};

export type SubscriptionPoolTokenArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionPoolTokensArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolToken_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolToken_Filter>;
};

export type SubscriptionPoolsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Pool_Filter>;
};

export type SubscriptionPriceRateProviderArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionPriceRateProvidersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PriceRateProvider_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PriceRateProvider_Filter>;
};

export type SubscriptionSwapArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionSwapsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Swap_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Swap_Filter>;
};

export type SubscriptionTokenArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionTokenPriceArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionTokenPricesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TokenPrice_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<TokenPrice_Filter>;
};

export type SubscriptionTokenSnapshotArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionTokenSnapshotsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TokenSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<TokenSnapshot_Filter>;
};

export type SubscriptionTokensArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Token_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Token_Filter>;
};

export type SubscriptionTradePairArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionTradePairSnapshotArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionTradePairSnapshotsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TradePairSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<TradePairSnapshot_Filter>;
};

export type SubscriptionTradePairsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TradePair_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<TradePair_Filter>;
};

export type SubscriptionUserArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionUserInternalBalanceArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionUserInternalBalancesArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<UserInternalBalance_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<UserInternalBalance_Filter>;
};

export type SubscriptionUsersArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<User_Filter>;
};

export type Swap = {
    __typename?: 'Swap';
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
    userAddress: User;
    value: Scalars['BigDecimal'];
};

export type Swap_Filter = {
    caller?: Maybe<Scalars['Bytes']>;
    caller_contains?: Maybe<Scalars['Bytes']>;
    caller_in?: Maybe<Array<Scalars['Bytes']>>;
    caller_not?: Maybe<Scalars['Bytes']>;
    caller_not_contains?: Maybe<Scalars['Bytes']>;
    caller_not_in?: Maybe<Array<Scalars['Bytes']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    tokenAmountIn?: Maybe<Scalars['BigDecimal']>;
    tokenAmountIn_gt?: Maybe<Scalars['BigDecimal']>;
    tokenAmountIn_gte?: Maybe<Scalars['BigDecimal']>;
    tokenAmountIn_in?: Maybe<Array<Scalars['BigDecimal']>>;
    tokenAmountIn_lt?: Maybe<Scalars['BigDecimal']>;
    tokenAmountIn_lte?: Maybe<Scalars['BigDecimal']>;
    tokenAmountIn_not?: Maybe<Scalars['BigDecimal']>;
    tokenAmountIn_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    tokenAmountOut?: Maybe<Scalars['BigDecimal']>;
    tokenAmountOut_gt?: Maybe<Scalars['BigDecimal']>;
    tokenAmountOut_gte?: Maybe<Scalars['BigDecimal']>;
    tokenAmountOut_in?: Maybe<Array<Scalars['BigDecimal']>>;
    tokenAmountOut_lt?: Maybe<Scalars['BigDecimal']>;
    tokenAmountOut_lte?: Maybe<Scalars['BigDecimal']>;
    tokenAmountOut_not?: Maybe<Scalars['BigDecimal']>;
    tokenAmountOut_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    tokenIn?: Maybe<Scalars['Bytes']>;
    tokenInSym?: Maybe<Scalars['String']>;
    tokenInSym_contains?: Maybe<Scalars['String']>;
    tokenInSym_ends_with?: Maybe<Scalars['String']>;
    tokenInSym_gt?: Maybe<Scalars['String']>;
    tokenInSym_gte?: Maybe<Scalars['String']>;
    tokenInSym_in?: Maybe<Array<Scalars['String']>>;
    tokenInSym_lt?: Maybe<Scalars['String']>;
    tokenInSym_lte?: Maybe<Scalars['String']>;
    tokenInSym_not?: Maybe<Scalars['String']>;
    tokenInSym_not_contains?: Maybe<Scalars['String']>;
    tokenInSym_not_ends_with?: Maybe<Scalars['String']>;
    tokenInSym_not_in?: Maybe<Array<Scalars['String']>>;
    tokenInSym_not_starts_with?: Maybe<Scalars['String']>;
    tokenInSym_starts_with?: Maybe<Scalars['String']>;
    tokenIn_contains?: Maybe<Scalars['Bytes']>;
    tokenIn_in?: Maybe<Array<Scalars['Bytes']>>;
    tokenIn_not?: Maybe<Scalars['Bytes']>;
    tokenIn_not_contains?: Maybe<Scalars['Bytes']>;
    tokenIn_not_in?: Maybe<Array<Scalars['Bytes']>>;
    tokenOut?: Maybe<Scalars['Bytes']>;
    tokenOutSym?: Maybe<Scalars['String']>;
    tokenOutSym_contains?: Maybe<Scalars['String']>;
    tokenOutSym_ends_with?: Maybe<Scalars['String']>;
    tokenOutSym_gt?: Maybe<Scalars['String']>;
    tokenOutSym_gte?: Maybe<Scalars['String']>;
    tokenOutSym_in?: Maybe<Array<Scalars['String']>>;
    tokenOutSym_lt?: Maybe<Scalars['String']>;
    tokenOutSym_lte?: Maybe<Scalars['String']>;
    tokenOutSym_not?: Maybe<Scalars['String']>;
    tokenOutSym_not_contains?: Maybe<Scalars['String']>;
    tokenOutSym_not_ends_with?: Maybe<Scalars['String']>;
    tokenOutSym_not_in?: Maybe<Array<Scalars['String']>>;
    tokenOutSym_not_starts_with?: Maybe<Scalars['String']>;
    tokenOutSym_starts_with?: Maybe<Scalars['String']>;
    tokenOut_contains?: Maybe<Scalars['Bytes']>;
    tokenOut_in?: Maybe<Array<Scalars['Bytes']>>;
    tokenOut_not?: Maybe<Scalars['Bytes']>;
    tokenOut_not_contains?: Maybe<Scalars['Bytes']>;
    tokenOut_not_in?: Maybe<Array<Scalars['Bytes']>>;
    tx?: Maybe<Scalars['Bytes']>;
    tx_contains?: Maybe<Scalars['Bytes']>;
    tx_in?: Maybe<Array<Scalars['Bytes']>>;
    tx_not?: Maybe<Scalars['Bytes']>;
    tx_not_contains?: Maybe<Scalars['Bytes']>;
    tx_not_in?: Maybe<Array<Scalars['Bytes']>>;
    userAddress?: Maybe<Scalars['String']>;
    userAddress_contains?: Maybe<Scalars['String']>;
    userAddress_ends_with?: Maybe<Scalars['String']>;
    userAddress_gt?: Maybe<Scalars['String']>;
    userAddress_gte?: Maybe<Scalars['String']>;
    userAddress_in?: Maybe<Array<Scalars['String']>>;
    userAddress_lt?: Maybe<Scalars['String']>;
    userAddress_lte?: Maybe<Scalars['String']>;
    userAddress_not?: Maybe<Scalars['String']>;
    userAddress_not_contains?: Maybe<Scalars['String']>;
    userAddress_not_ends_with?: Maybe<Scalars['String']>;
    userAddress_not_in?: Maybe<Array<Scalars['String']>>;
    userAddress_not_starts_with?: Maybe<Scalars['String']>;
    userAddress_starts_with?: Maybe<Scalars['String']>;
    value?: Maybe<Scalars['BigDecimal']>;
    value_gt?: Maybe<Scalars['BigDecimal']>;
    value_gte?: Maybe<Scalars['BigDecimal']>;
    value_in?: Maybe<Array<Scalars['BigDecimal']>>;
    value_lt?: Maybe<Scalars['BigDecimal']>;
    value_lte?: Maybe<Scalars['BigDecimal']>;
    value_not?: Maybe<Scalars['BigDecimal']>;
    value_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum Swap_OrderBy {
    Caller = 'caller',
    Id = 'id',
    PoolId = 'poolId',
    Timestamp = 'timestamp',
    TokenAmountIn = 'tokenAmountIn',
    TokenAmountOut = 'tokenAmountOut',
    TokenIn = 'tokenIn',
    TokenInSym = 'tokenInSym',
    TokenOut = 'tokenOut',
    TokenOutSym = 'tokenOutSym',
    Tx = 'tx',
    UserAddress = 'userAddress',
    Value = 'value',
}

export type Token = {
    __typename?: 'Token';
    address: Scalars['String'];
    decimals: Scalars['Int'];
    id: Scalars['ID'];
    latestPrice?: Maybe<LatestPrice>;
    name?: Maybe<Scalars['String']>;
    symbol?: Maybe<Scalars['String']>;
    totalBalanceNotional: Scalars['BigDecimal'];
    totalBalanceUSD: Scalars['BigDecimal'];
    totalSwapCount: Scalars['BigInt'];
    totalVolumeNotional: Scalars['BigDecimal'];
    totalVolumeUSD: Scalars['BigDecimal'];
};

export type TokenPrice = {
    __typename?: 'TokenPrice';
    amount: Scalars['BigDecimal'];
    asset: Scalars['Bytes'];
    block: Scalars['BigInt'];
    id: Scalars['ID'];
    poolId: Pool;
    price: Scalars['BigDecimal'];
    priceUsd: Scalars['BigDecimal'];
    pricingAsset: Scalars['Bytes'];
    timestamp: Scalars['Int'];
};

export type TokenPrice_Filter = {
    amount?: Maybe<Scalars['BigDecimal']>;
    amount_gt?: Maybe<Scalars['BigDecimal']>;
    amount_gte?: Maybe<Scalars['BigDecimal']>;
    amount_in?: Maybe<Array<Scalars['BigDecimal']>>;
    amount_lt?: Maybe<Scalars['BigDecimal']>;
    amount_lte?: Maybe<Scalars['BigDecimal']>;
    amount_not?: Maybe<Scalars['BigDecimal']>;
    amount_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    asset?: Maybe<Scalars['Bytes']>;
    asset_contains?: Maybe<Scalars['Bytes']>;
    asset_in?: Maybe<Array<Scalars['Bytes']>>;
    asset_not?: Maybe<Scalars['Bytes']>;
    asset_not_contains?: Maybe<Scalars['Bytes']>;
    asset_not_in?: Maybe<Array<Scalars['Bytes']>>;
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
    poolId?: Maybe<Scalars['String']>;
    poolId_contains?: Maybe<Scalars['String']>;
    poolId_ends_with?: Maybe<Scalars['String']>;
    poolId_gt?: Maybe<Scalars['String']>;
    poolId_gte?: Maybe<Scalars['String']>;
    poolId_in?: Maybe<Array<Scalars['String']>>;
    poolId_lt?: Maybe<Scalars['String']>;
    poolId_lte?: Maybe<Scalars['String']>;
    poolId_not?: Maybe<Scalars['String']>;
    poolId_not_contains?: Maybe<Scalars['String']>;
    poolId_not_ends_with?: Maybe<Scalars['String']>;
    poolId_not_in?: Maybe<Array<Scalars['String']>>;
    poolId_not_starts_with?: Maybe<Scalars['String']>;
    poolId_starts_with?: Maybe<Scalars['String']>;
    price?: Maybe<Scalars['BigDecimal']>;
    priceUsd?: Maybe<Scalars['BigDecimal']>;
    priceUsd_gt?: Maybe<Scalars['BigDecimal']>;
    priceUsd_gte?: Maybe<Scalars['BigDecimal']>;
    priceUsd_in?: Maybe<Array<Scalars['BigDecimal']>>;
    priceUsd_lt?: Maybe<Scalars['BigDecimal']>;
    priceUsd_lte?: Maybe<Scalars['BigDecimal']>;
    priceUsd_not?: Maybe<Scalars['BigDecimal']>;
    priceUsd_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    price_gt?: Maybe<Scalars['BigDecimal']>;
    price_gte?: Maybe<Scalars['BigDecimal']>;
    price_in?: Maybe<Array<Scalars['BigDecimal']>>;
    price_lt?: Maybe<Scalars['BigDecimal']>;
    price_lte?: Maybe<Scalars['BigDecimal']>;
    price_not?: Maybe<Scalars['BigDecimal']>;
    price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    pricingAsset?: Maybe<Scalars['Bytes']>;
    pricingAsset_contains?: Maybe<Scalars['Bytes']>;
    pricingAsset_in?: Maybe<Array<Scalars['Bytes']>>;
    pricingAsset_not?: Maybe<Scalars['Bytes']>;
    pricingAsset_not_contains?: Maybe<Scalars['Bytes']>;
    pricingAsset_not_in?: Maybe<Array<Scalars['Bytes']>>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
};

export enum TokenPrice_OrderBy {
    Amount = 'amount',
    Asset = 'asset',
    Block = 'block',
    Id = 'id',
    PoolId = 'poolId',
    Price = 'price',
    PriceUsd = 'priceUsd',
    PricingAsset = 'pricingAsset',
    Timestamp = 'timestamp',
}

export type TokenSnapshot = {
    __typename?: 'TokenSnapshot';
    id: Scalars['ID'];
    timestamp: Scalars['Int'];
    token: Token;
    totalBalanceNotional: Scalars['BigDecimal'];
    totalBalanceUSD: Scalars['BigDecimal'];
    totalSwapCount: Scalars['BigInt'];
    totalVolumeNotional: Scalars['BigDecimal'];
    totalVolumeUSD: Scalars['BigDecimal'];
};

export type TokenSnapshot_Filter = {
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    token?: Maybe<Scalars['String']>;
    token_contains?: Maybe<Scalars['String']>;
    token_ends_with?: Maybe<Scalars['String']>;
    token_gt?: Maybe<Scalars['String']>;
    token_gte?: Maybe<Scalars['String']>;
    token_in?: Maybe<Array<Scalars['String']>>;
    token_lt?: Maybe<Scalars['String']>;
    token_lte?: Maybe<Scalars['String']>;
    token_not?: Maybe<Scalars['String']>;
    token_not_contains?: Maybe<Scalars['String']>;
    token_not_ends_with?: Maybe<Scalars['String']>;
    token_not_in?: Maybe<Array<Scalars['String']>>;
    token_not_starts_with?: Maybe<Scalars['String']>;
    token_starts_with?: Maybe<Scalars['String']>;
    totalBalanceNotional?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_gt?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_gte?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalBalanceNotional_lt?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_lte?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_not?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalBalanceUSD?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_gt?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_gte?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalBalanceUSD_lt?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_lte?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_not?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapCount?: Maybe<Scalars['BigInt']>;
    totalSwapCount_gt?: Maybe<Scalars['BigInt']>;
    totalSwapCount_gte?: Maybe<Scalars['BigInt']>;
    totalSwapCount_in?: Maybe<Array<Scalars['BigInt']>>;
    totalSwapCount_lt?: Maybe<Scalars['BigInt']>;
    totalSwapCount_lte?: Maybe<Scalars['BigInt']>;
    totalSwapCount_not?: Maybe<Scalars['BigInt']>;
    totalSwapCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    totalVolumeNotional?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_gt?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_gte?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalVolumeNotional_lt?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_lte?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_not?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalVolumeUSD?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum TokenSnapshot_OrderBy {
    Id = 'id',
    Timestamp = 'timestamp',
    Token = 'token',
    TotalBalanceNotional = 'totalBalanceNotional',
    TotalBalanceUsd = 'totalBalanceUSD',
    TotalSwapCount = 'totalSwapCount',
    TotalVolumeNotional = 'totalVolumeNotional',
    TotalVolumeUsd = 'totalVolumeUSD',
}

export type Token_Filter = {
    address?: Maybe<Scalars['String']>;
    address_contains?: Maybe<Scalars['String']>;
    address_ends_with?: Maybe<Scalars['String']>;
    address_gt?: Maybe<Scalars['String']>;
    address_gte?: Maybe<Scalars['String']>;
    address_in?: Maybe<Array<Scalars['String']>>;
    address_lt?: Maybe<Scalars['String']>;
    address_lte?: Maybe<Scalars['String']>;
    address_not?: Maybe<Scalars['String']>;
    address_not_contains?: Maybe<Scalars['String']>;
    address_not_ends_with?: Maybe<Scalars['String']>;
    address_not_in?: Maybe<Array<Scalars['String']>>;
    address_not_starts_with?: Maybe<Scalars['String']>;
    address_starts_with?: Maybe<Scalars['String']>;
    decimals?: Maybe<Scalars['Int']>;
    decimals_gt?: Maybe<Scalars['Int']>;
    decimals_gte?: Maybe<Scalars['Int']>;
    decimals_in?: Maybe<Array<Scalars['Int']>>;
    decimals_lt?: Maybe<Scalars['Int']>;
    decimals_lte?: Maybe<Scalars['Int']>;
    decimals_not?: Maybe<Scalars['Int']>;
    decimals_not_in?: Maybe<Array<Scalars['Int']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    latestPrice?: Maybe<Scalars['String']>;
    latestPrice_contains?: Maybe<Scalars['String']>;
    latestPrice_ends_with?: Maybe<Scalars['String']>;
    latestPrice_gt?: Maybe<Scalars['String']>;
    latestPrice_gte?: Maybe<Scalars['String']>;
    latestPrice_in?: Maybe<Array<Scalars['String']>>;
    latestPrice_lt?: Maybe<Scalars['String']>;
    latestPrice_lte?: Maybe<Scalars['String']>;
    latestPrice_not?: Maybe<Scalars['String']>;
    latestPrice_not_contains?: Maybe<Scalars['String']>;
    latestPrice_not_ends_with?: Maybe<Scalars['String']>;
    latestPrice_not_in?: Maybe<Array<Scalars['String']>>;
    latestPrice_not_starts_with?: Maybe<Scalars['String']>;
    latestPrice_starts_with?: Maybe<Scalars['String']>;
    name?: Maybe<Scalars['String']>;
    name_contains?: Maybe<Scalars['String']>;
    name_ends_with?: Maybe<Scalars['String']>;
    name_gt?: Maybe<Scalars['String']>;
    name_gte?: Maybe<Scalars['String']>;
    name_in?: Maybe<Array<Scalars['String']>>;
    name_lt?: Maybe<Scalars['String']>;
    name_lte?: Maybe<Scalars['String']>;
    name_not?: Maybe<Scalars['String']>;
    name_not_contains?: Maybe<Scalars['String']>;
    name_not_ends_with?: Maybe<Scalars['String']>;
    name_not_in?: Maybe<Array<Scalars['String']>>;
    name_not_starts_with?: Maybe<Scalars['String']>;
    name_starts_with?: Maybe<Scalars['String']>;
    symbol?: Maybe<Scalars['String']>;
    symbol_contains?: Maybe<Scalars['String']>;
    symbol_ends_with?: Maybe<Scalars['String']>;
    symbol_gt?: Maybe<Scalars['String']>;
    symbol_gte?: Maybe<Scalars['String']>;
    symbol_in?: Maybe<Array<Scalars['String']>>;
    symbol_lt?: Maybe<Scalars['String']>;
    symbol_lte?: Maybe<Scalars['String']>;
    symbol_not?: Maybe<Scalars['String']>;
    symbol_not_contains?: Maybe<Scalars['String']>;
    symbol_not_ends_with?: Maybe<Scalars['String']>;
    symbol_not_in?: Maybe<Array<Scalars['String']>>;
    symbol_not_starts_with?: Maybe<Scalars['String']>;
    symbol_starts_with?: Maybe<Scalars['String']>;
    totalBalanceNotional?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_gt?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_gte?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalBalanceNotional_lt?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_lte?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_not?: Maybe<Scalars['BigDecimal']>;
    totalBalanceNotional_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalBalanceUSD?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_gt?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_gte?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalBalanceUSD_lt?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_lte?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_not?: Maybe<Scalars['BigDecimal']>;
    totalBalanceUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapCount?: Maybe<Scalars['BigInt']>;
    totalSwapCount_gt?: Maybe<Scalars['BigInt']>;
    totalSwapCount_gte?: Maybe<Scalars['BigInt']>;
    totalSwapCount_in?: Maybe<Array<Scalars['BigInt']>>;
    totalSwapCount_lt?: Maybe<Scalars['BigInt']>;
    totalSwapCount_lte?: Maybe<Scalars['BigInt']>;
    totalSwapCount_not?: Maybe<Scalars['BigInt']>;
    totalSwapCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
    totalVolumeNotional?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_gt?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_gte?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalVolumeNotional_lt?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_lte?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_not?: Maybe<Scalars['BigDecimal']>;
    totalVolumeNotional_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalVolumeUSD?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
    totalVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum Token_OrderBy {
    Address = 'address',
    Decimals = 'decimals',
    Id = 'id',
    LatestPrice = 'latestPrice',
    Name = 'name',
    Symbol = 'symbol',
    TotalBalanceNotional = 'totalBalanceNotional',
    TotalBalanceUsd = 'totalBalanceUSD',
    TotalSwapCount = 'totalSwapCount',
    TotalVolumeNotional = 'totalVolumeNotional',
    TotalVolumeUsd = 'totalVolumeUSD',
}

export type TradePair = {
    __typename?: 'TradePair';
    /** Token Address - Token Address */
    id: Scalars['ID'];
    token0: Token;
    token1: Token;
    totalSwapFee: Scalars['BigDecimal'];
    totalSwapVolume: Scalars['BigDecimal'];
};

export type TradePairSnapshot = {
    __typename?: 'TradePairSnapshot';
    id: Scalars['ID'];
    pair: TradePair;
    timestamp: Scalars['Int'];
    totalSwapFee: Scalars['BigDecimal'];
    totalSwapVolume: Scalars['BigDecimal'];
};

export type TradePairSnapshot_Filter = {
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    pair?: Maybe<Scalars['String']>;
    pair_contains?: Maybe<Scalars['String']>;
    pair_ends_with?: Maybe<Scalars['String']>;
    pair_gt?: Maybe<Scalars['String']>;
    pair_gte?: Maybe<Scalars['String']>;
    pair_in?: Maybe<Array<Scalars['String']>>;
    pair_lt?: Maybe<Scalars['String']>;
    pair_lte?: Maybe<Scalars['String']>;
    pair_not?: Maybe<Scalars['String']>;
    pair_not_contains?: Maybe<Scalars['String']>;
    pair_not_ends_with?: Maybe<Scalars['String']>;
    pair_not_in?: Maybe<Array<Scalars['String']>>;
    pair_not_starts_with?: Maybe<Scalars['String']>;
    pair_starts_with?: Maybe<Scalars['String']>;
    timestamp?: Maybe<Scalars['Int']>;
    timestamp_gt?: Maybe<Scalars['Int']>;
    timestamp_gte?: Maybe<Scalars['Int']>;
    timestamp_in?: Maybe<Array<Scalars['Int']>>;
    timestamp_lt?: Maybe<Scalars['Int']>;
    timestamp_lte?: Maybe<Scalars['Int']>;
    timestamp_not?: Maybe<Scalars['Int']>;
    timestamp_not_in?: Maybe<Array<Scalars['Int']>>;
    totalSwapFee?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapFee_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum TradePairSnapshot_OrderBy {
    Id = 'id',
    Pair = 'pair',
    Timestamp = 'timestamp',
    TotalSwapFee = 'totalSwapFee',
    TotalSwapVolume = 'totalSwapVolume',
}

export type TradePair_Filter = {
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    token0?: Maybe<Scalars['String']>;
    token0_contains?: Maybe<Scalars['String']>;
    token0_ends_with?: Maybe<Scalars['String']>;
    token0_gt?: Maybe<Scalars['String']>;
    token0_gte?: Maybe<Scalars['String']>;
    token0_in?: Maybe<Array<Scalars['String']>>;
    token0_lt?: Maybe<Scalars['String']>;
    token0_lte?: Maybe<Scalars['String']>;
    token0_not?: Maybe<Scalars['String']>;
    token0_not_contains?: Maybe<Scalars['String']>;
    token0_not_ends_with?: Maybe<Scalars['String']>;
    token0_not_in?: Maybe<Array<Scalars['String']>>;
    token0_not_starts_with?: Maybe<Scalars['String']>;
    token0_starts_with?: Maybe<Scalars['String']>;
    token1?: Maybe<Scalars['String']>;
    token1_contains?: Maybe<Scalars['String']>;
    token1_ends_with?: Maybe<Scalars['String']>;
    token1_gt?: Maybe<Scalars['String']>;
    token1_gte?: Maybe<Scalars['String']>;
    token1_in?: Maybe<Array<Scalars['String']>>;
    token1_lt?: Maybe<Scalars['String']>;
    token1_lte?: Maybe<Scalars['String']>;
    token1_not?: Maybe<Scalars['String']>;
    token1_not_contains?: Maybe<Scalars['String']>;
    token1_not_ends_with?: Maybe<Scalars['String']>;
    token1_not_in?: Maybe<Array<Scalars['String']>>;
    token1_not_starts_with?: Maybe<Scalars['String']>;
    token1_starts_with?: Maybe<Scalars['String']>;
    totalSwapFee?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapFee_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapFee_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_gte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSwapVolume_lt?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_lte?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not?: Maybe<Scalars['BigDecimal']>;
    totalSwapVolume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum TradePair_OrderBy {
    Id = 'id',
    Token0 = 'token0',
    Token1 = 'token1',
    TotalSwapFee = 'totalSwapFee',
    TotalSwapVolume = 'totalSwapVolume',
}

export type User = {
    __typename?: 'User';
    id: Scalars['ID'];
    sharesOwned?: Maybe<Array<PoolShare>>;
    swaps?: Maybe<Array<Swap>>;
    userInternalBalances?: Maybe<Array<UserInternalBalance>>;
};

export type UserSharesOwnedArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolShare_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<PoolShare_Filter>;
};

export type UserSwapsArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Swap_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Swap_Filter>;
};

export type UserUserInternalBalancesArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<UserInternalBalance_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<UserInternalBalance_Filter>;
};

export type UserInternalBalance = {
    __typename?: 'UserInternalBalance';
    balance: Scalars['BigDecimal'];
    id: Scalars['ID'];
    token: Scalars['Bytes'];
    userAddress?: Maybe<User>;
};

export type UserInternalBalance_Filter = {
    balance?: Maybe<Scalars['BigDecimal']>;
    balance_gt?: Maybe<Scalars['BigDecimal']>;
    balance_gte?: Maybe<Scalars['BigDecimal']>;
    balance_in?: Maybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: Maybe<Scalars['BigDecimal']>;
    balance_lte?: Maybe<Scalars['BigDecimal']>;
    balance_not?: Maybe<Scalars['BigDecimal']>;
    balance_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    token?: Maybe<Scalars['Bytes']>;
    token_contains?: Maybe<Scalars['Bytes']>;
    token_in?: Maybe<Array<Scalars['Bytes']>>;
    token_not?: Maybe<Scalars['Bytes']>;
    token_not_contains?: Maybe<Scalars['Bytes']>;
    token_not_in?: Maybe<Array<Scalars['Bytes']>>;
    userAddress?: Maybe<Scalars['String']>;
    userAddress_contains?: Maybe<Scalars['String']>;
    userAddress_ends_with?: Maybe<Scalars['String']>;
    userAddress_gt?: Maybe<Scalars['String']>;
    userAddress_gte?: Maybe<Scalars['String']>;
    userAddress_in?: Maybe<Array<Scalars['String']>>;
    userAddress_lt?: Maybe<Scalars['String']>;
    userAddress_lte?: Maybe<Scalars['String']>;
    userAddress_not?: Maybe<Scalars['String']>;
    userAddress_not_contains?: Maybe<Scalars['String']>;
    userAddress_not_ends_with?: Maybe<Scalars['String']>;
    userAddress_not_in?: Maybe<Array<Scalars['String']>>;
    userAddress_not_starts_with?: Maybe<Scalars['String']>;
    userAddress_starts_with?: Maybe<Scalars['String']>;
};

export enum UserInternalBalance_OrderBy {
    Balance = 'balance',
    Id = 'id',
    Token = 'token',
    UserAddress = 'userAddress',
}

export type User_Filter = {
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
};

export enum User_OrderBy {
    Id = 'id',
    SharesOwned = 'sharesOwned',
    Swaps = 'swaps',
    UserInternalBalances = 'userInternalBalances',
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

export type BalancerProtocolDataQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Balancer_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<Balancer_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BalancerProtocolDataQuery = {
    __typename?: 'Query';
    balancers: Array<{
        __typename?: 'Balancer';
        id: string;
        totalLiquidity: string;
        totalSwapVolume: string;
        totalSwapFee: string;
        poolCount: number;
    }>;
};

export type BalancerUserQueryVariables = Exact<{
    id: Scalars['ID'];
    block?: Maybe<Block_Height>;
}>;

export type BalancerUserQuery = {
    __typename?: 'Query';
    user?:
        | {
              __typename?: 'User';
              id: string;
              sharesOwned?:
                  | Array<{ __typename?: 'PoolShare'; balance: string; poolId: { __typename?: 'Pool'; id: string } }>
                  | null
                  | undefined;
          }
        | null
        | undefined;
};

export type BalancerUsersQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<User_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BalancerUsersQuery = {
    __typename?: 'Query';
    users: Array<{
        __typename?: 'User';
        id: string;
        sharesOwned?:
            | Array<{ __typename?: 'PoolShare'; balance: string; poolId: { __typename?: 'Pool'; id: string } }>
            | null
            | undefined;
    }>;
};

export type BalancerUserFragment = {
    __typename?: 'User';
    id: string;
    sharesOwned?:
        | Array<{ __typename?: 'PoolShare'; balance: string; poolId: { __typename?: 'Pool'; id: string } }>
        | null
        | undefined;
};

export type BalancerTokenPricesQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<TokenPrice_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<TokenPrice_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BalancerTokenPricesQuery = {
    __typename?: 'Query';
    tokenPrices: Array<{
        __typename?: 'TokenPrice';
        id: string;
        asset: string;
        amount: string;
        pricingAsset: string;
        price: string;
        block: string;
        timestamp: number;
        poolId: { __typename?: 'Pool'; id: string };
    }>;
};

export type BalancerTokenPriceFragment = {
    __typename?: 'TokenPrice';
    id: string;
    asset: string;
    amount: string;
    pricingAsset: string;
    price: string;
    block: string;
    timestamp: number;
    poolId: { __typename?: 'Pool'; id: string };
};

export type BalancerPoolFragment = {
    __typename?: 'Pool';
    id: string;
    address: string;
    poolType?: string | null | undefined;
    symbol?: string | null | undefined;
    name?: string | null | undefined;
    swapFee: string;
    totalWeight?: string | null | undefined;
    totalSwapVolume: string;
    totalSwapFee: string;
    totalLiquidity: string;
    totalShares: string;
    swapsCount: string;
    holdersCount: string;
    tokens?:
        | Array<{
              __typename?: 'PoolToken';
              id: string;
              symbol: string;
              name: string;
              decimals: number;
              address: string;
              balance: string;
              invested: string;
              weight?: string | null | undefined;
              priceRate: string;
          }>
        | null
        | undefined;
};

export type BalancerPoolTokenFragment = {
    __typename?: 'PoolToken';
    id: string;
    symbol: string;
    name: string;
    decimals: number;
    address: string;
    balance: string;
    invested: string;
    weight?: string | null | undefined;
    priceRate: string;
};

export type BalancerPoolsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Pool_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<Pool_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BalancerPoolsQuery = {
    __typename?: 'Query';
    pools: Array<{
        __typename?: 'Pool';
        id: string;
        address: string;
        poolType?: string | null | undefined;
        symbol?: string | null | undefined;
        name?: string | null | undefined;
        swapFee: string;
        totalWeight?: string | null | undefined;
        totalSwapVolume: string;
        totalSwapFee: string;
        totalLiquidity: string;
        totalShares: string;
        swapsCount: string;
        holdersCount: string;
        tokens?:
            | Array<{
                  __typename?: 'PoolToken';
                  id: string;
                  symbol: string;
                  name: string;
                  decimals: number;
                  address: string;
                  balance: string;
                  invested: string;
                  weight?: string | null | undefined;
                  priceRate: string;
              }>
            | null
            | undefined;
    }>;
};

export type BalancerPoolQueryVariables = Exact<{
    id: Scalars['ID'];
    block?: Maybe<Block_Height>;
}>;

export type BalancerPoolQuery = {
    __typename?: 'Query';
    pool?:
        | {
              __typename?: 'Pool';
              id: string;
              address: string;
              poolType?: string | null | undefined;
              symbol?: string | null | undefined;
              name?: string | null | undefined;
              swapFee: string;
              totalWeight?: string | null | undefined;
              totalSwapVolume: string;
              totalSwapFee: string;
              totalLiquidity: string;
              totalShares: string;
              swapsCount: string;
              holdersCount: string;
              tokens?:
                  | Array<{
                        __typename?: 'PoolToken';
                        id: string;
                        symbol: string;
                        name: string;
                        decimals: number;
                        address: string;
                        balance: string;
                        invested: string;
                        weight?: string | null | undefined;
                        priceRate: string;
                    }>
                  | null
                  | undefined;
          }
        | null
        | undefined;
};

export type BalancerPoolHistoricalLiquiditiesQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolHistoricalLiquidity_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<PoolHistoricalLiquidity_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BalancerPoolHistoricalLiquiditiesQuery = {
    __typename?: 'Query';
    poolHistoricalLiquidities: Array<{
        __typename?: 'PoolHistoricalLiquidity';
        id: string;
        poolTotalShares: string;
        poolLiquidity: string;
        poolShareValue: string;
        pricingAsset: string;
        block: string;
        poolId: { __typename?: 'Pool'; id: string };
    }>;
};

export type BalancerPoolSnapshotsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<PoolSnapshot_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<PoolSnapshot_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BalancerPoolSnapshotsQuery = {
    __typename?: 'Query';
    poolSnapshots: Array<{
        __typename?: 'PoolSnapshot';
        id: string;
        totalShares: string;
        swapVolume: string;
        swapFees: string;
        timestamp: number;
        pool: { __typename?: 'Pool'; id: string };
    }>;
};

export type BalancerPoolSnapshotFragment = {
    __typename?: 'PoolSnapshot';
    id: string;
    totalShares: string;
    swapVolume: string;
    swapFees: string;
    timestamp: number;
    pool: { __typename?: 'Pool'; id: string };
};

export type BalancerLatestPricesQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<LatestPrice_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<LatestPrice_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BalancerLatestPricesQuery = {
    __typename?: 'Query';
    latestPrices: Array<{
        __typename?: 'LatestPrice';
        id: string;
        asset: string;
        price: string;
        pricingAsset: string;
        poolId: { __typename?: 'Pool'; id: string };
    }>;
};

export type BalancerJoinExitsQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<JoinExit_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<JoinExit_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BalancerJoinExitsQuery = {
    __typename?: 'Query';
    joinExits: Array<{
        __typename?: 'JoinExit';
        amounts: Array<string>;
        id: string;
        sender: string;
        timestamp: number;
        tx: string;
        type: InvestType;
        user: { __typename?: 'User'; id: string };
        pool: { __typename?: 'Pool'; id: string; tokensList: Array<string> };
    }>;
};

export type BalancerJoinExitFragment = {
    __typename?: 'JoinExit';
    amounts: Array<string>;
    id: string;
    sender: string;
    timestamp: number;
    tx: string;
    type: InvestType;
    user: { __typename?: 'User'; id: string };
    pool: { __typename?: 'Pool'; id: string; tokensList: Array<string> };
};

export type BalancePortfolioDataQueryVariables = Exact<{
    id: Scalars['ID'];
    previousBlockNumber: Scalars['Int'];
}>;

export type BalancePortfolioDataQuery = {
    __typename?: 'Query';
    user?:
        | {
              __typename?: 'User';
              id: string;
              sharesOwned?:
                  | Array<{ __typename?: 'PoolShare'; balance: string; poolId: { __typename?: 'Pool'; id: string } }>
                  | null
                  | undefined;
          }
        | null
        | undefined;
    pools: Array<{
        __typename?: 'Pool';
        id: string;
        address: string;
        poolType?: string | null | undefined;
        symbol?: string | null | undefined;
        name?: string | null | undefined;
        swapFee: string;
        totalWeight?: string | null | undefined;
        totalSwapVolume: string;
        totalSwapFee: string;
        totalLiquidity: string;
        totalShares: string;
        swapsCount: string;
        holdersCount: string;
        tokens?:
            | Array<{
                  __typename?: 'PoolToken';
                  id: string;
                  symbol: string;
                  name: string;
                  decimals: number;
                  address: string;
                  balance: string;
                  invested: string;
                  weight?: string | null | undefined;
                  priceRate: string;
              }>
            | null
            | undefined;
    }>;
    previousUser?:
        | {
              __typename?: 'User';
              id: string;
              sharesOwned?:
                  | Array<{ __typename?: 'PoolShare'; balance: string; poolId: { __typename?: 'Pool'; id: string } }>
                  | null
                  | undefined;
          }
        | null
        | undefined;
    previousPools: Array<{
        __typename?: 'Pool';
        id: string;
        address: string;
        poolType?: string | null | undefined;
        symbol?: string | null | undefined;
        name?: string | null | undefined;
        swapFee: string;
        totalWeight?: string | null | undefined;
        totalSwapVolume: string;
        totalSwapFee: string;
        totalLiquidity: string;
        totalShares: string;
        swapsCount: string;
        holdersCount: string;
        tokens?:
            | Array<{
                  __typename?: 'PoolToken';
                  id: string;
                  symbol: string;
                  name: string;
                  decimals: number;
                  address: string;
                  balance: string;
                  invested: string;
                  weight?: string | null | undefined;
                  priceRate: string;
              }>
            | null
            | undefined;
    }>;
};

export const BalancerUserFragmentDoc = gql`
    fragment BalancerUser on User {
        id
        sharesOwned(first: 1000) {
            balance
            poolId {
                id
            }
        }
    }
`;
export const BalancerTokenPriceFragmentDoc = gql`
    fragment BalancerTokenPrice on TokenPrice {
        id
        poolId {
            id
        }
        asset
        amount
        pricingAsset
        price
        block
        timestamp
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
        invested
        weight
        priceRate
    }
`;
export const BalancerPoolFragmentDoc = gql`
    fragment BalancerPool on Pool {
        id
        address
        poolType
        symbol
        name
        swapFee
        totalWeight
        totalSwapVolume
        totalSwapFee
        totalLiquidity
        totalShares
        swapsCount
        holdersCount
        tokens(first: 1000) {
            ...BalancerPoolToken
        }
    }
    ${BalancerPoolTokenFragmentDoc}
`;
export const BalancerPoolSnapshotFragmentDoc = gql`
    fragment BalancerPoolSnapshot on PoolSnapshot {
        id
        pool {
            id
        }
        totalShares
        swapVolume
        swapFees
        timestamp
    }
`;
export const BalancerJoinExitFragmentDoc = gql`
    fragment BalancerJoinExit on JoinExit {
        amounts
        id
        sender
        timestamp
        tx
        type
        user {
            id
        }
        pool {
            id
            tokensList
        }
    }
`;
export const BalancerProtocolDataDocument = gql`
    query BalancerProtocolData(
        $skip: Int
        $first: Int
        $orderBy: Balancer_orderBy
        $orderDirection: OrderDirection
        $where: Balancer_filter
        $block: Block_height
    ) {
        balancers(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            id
            totalLiquidity
            totalSwapVolume
            totalSwapFee
            poolCount
        }
    }
`;
export const BalancerUserDocument = gql`
    query BalancerUser($id: ID!, $block: Block_height) {
        user(id: $id, block: $block) {
            ...BalancerUser
        }
    }
    ${BalancerUserFragmentDoc}
`;
export const BalancerUsersDocument = gql`
    query BalancerUsers(
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
            ...BalancerUser
        }
    }
    ${BalancerUserFragmentDoc}
`;
export const BalancerTokenPricesDocument = gql`
    query BalancerTokenPrices(
        $skip: Int
        $first: Int
        $orderBy: TokenPrice_orderBy
        $orderDirection: OrderDirection
        $where: TokenPrice_filter
        $block: Block_height
    ) {
        tokenPrices(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            ...BalancerTokenPrice
        }
    }
    ${BalancerTokenPriceFragmentDoc}
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
export const BalancerPoolHistoricalLiquiditiesDocument = gql`
    query BalancerPoolHistoricalLiquidities(
        $skip: Int
        $first: Int
        $orderBy: PoolHistoricalLiquidity_orderBy
        $orderDirection: OrderDirection
        $where: PoolHistoricalLiquidity_filter
        $block: Block_height
    ) {
        poolHistoricalLiquidities(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            id
            poolId {
                id
            }
            poolTotalShares
            poolLiquidity
            poolShareValue
            pricingAsset
            block
        }
    }
`;
export const BalancerPoolSnapshotsDocument = gql`
    query BalancerPoolSnapshots(
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
            ...BalancerPoolSnapshot
        }
    }
    ${BalancerPoolSnapshotFragmentDoc}
`;
export const BalancerLatestPricesDocument = gql`
    query BalancerLatestPrices(
        $skip: Int
        $first: Int
        $orderBy: LatestPrice_orderBy
        $orderDirection: OrderDirection
        $where: LatestPrice_filter
        $block: Block_height
    ) {
        latestPrices(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            id
            asset
            price
            poolId {
                id
            }
            pricingAsset
        }
    }
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
export const BalancePortfolioDataDocument = gql`
    query BalancePortfolioData($id: ID!, $previousBlockNumber: Int!) {
        user(id: $id) {
            ...BalancerUser
        }
        pools(first: 1000, where: { totalShares_gt: "0" }) {
            ...BalancerPool
        }
        previousUser: user(id: $id, block: { number: $previousBlockNumber }) {
            ...BalancerUser
        }
        previousPools: pools(first: 1000, where: { totalShares_gt: "0" }, block: { number: $previousBlockNumber }) {
            ...BalancerPool
        }
    }
    ${BalancerUserFragmentDoc}
    ${BalancerPoolFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        BalancerProtocolData(
            variables?: BalancerProtocolDataQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerProtocolDataQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerProtocolDataQuery>(BalancerProtocolDataDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerProtocolData',
            );
        },
        BalancerUser(
            variables: BalancerUserQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerUserQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerUserQuery>(BalancerUserDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerUser',
            );
        },
        BalancerUsers(
            variables?: BalancerUsersQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerUsersQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerUsersQuery>(BalancerUsersDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerUsers',
            );
        },
        BalancerTokenPrices(
            variables?: BalancerTokenPricesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerTokenPricesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerTokenPricesQuery>(BalancerTokenPricesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerTokenPrices',
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
            );
        },
        BalancerPoolHistoricalLiquidities(
            variables?: BalancerPoolHistoricalLiquiditiesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerPoolHistoricalLiquiditiesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerPoolHistoricalLiquiditiesQuery>(
                        BalancerPoolHistoricalLiquiditiesDocument,
                        variables,
                        { ...requestHeaders, ...wrappedRequestHeaders },
                    ),
                'BalancerPoolHistoricalLiquidities',
            );
        },
        BalancerPoolSnapshots(
            variables?: BalancerPoolSnapshotsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerPoolSnapshotsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerPoolSnapshotsQuery>(BalancerPoolSnapshotsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerPoolSnapshots',
            );
        },
        BalancerLatestPrices(
            variables?: BalancerLatestPricesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancerLatestPricesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancerLatestPricesQuery>(BalancerLatestPricesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancerLatestPrices',
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
            );
        },
        BalancePortfolioData(
            variables: BalancePortfolioDataQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BalancePortfolioDataQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BalancePortfolioDataQuery>(BalancePortfolioDataDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BalancePortfolioData',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
