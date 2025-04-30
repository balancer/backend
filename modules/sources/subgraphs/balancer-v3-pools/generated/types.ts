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

export type BlockChangedFilter = {
    number_gte: Scalars['Int'];
};

export type Block_Height = {
    hash?: InputMaybe<Scalars['Bytes']>;
    number?: InputMaybe<Scalars['Int']>;
    number_gte?: InputMaybe<Scalars['Int']>;
};

export type Factory = {
    __typename?: 'Factory';
    /** Address of the Factory contract */
    address: Scalars['Bytes'];
    /** Unique identifier for the Factory */
    id: Scalars['Bytes'];
    /** Pools created by this Factory */
    pools?: Maybe<Array<Pool>>;
    /** Type of pools this Factory creates */
    type: PoolType;
    /** Version number of the Factory */
    version: Scalars['Int'];
};

export type FactoryPoolsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<Pool_Filter>;
};

export type Factory_Filter = {
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
    and?: InputMaybe<Array<InputMaybe<Factory_Filter>>>;
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
    or?: InputMaybe<Array<InputMaybe<Factory_Filter>>>;
    pools_?: InputMaybe<Pool_Filter>;
    type?: InputMaybe<PoolType>;
    type_in?: InputMaybe<Array<PoolType>>;
    type_not?: InputMaybe<PoolType>;
    type_not_in?: InputMaybe<Array<PoolType>>;
    version?: InputMaybe<Scalars['Int']>;
    version_gt?: InputMaybe<Scalars['Int']>;
    version_gte?: InputMaybe<Scalars['Int']>;
    version_in?: InputMaybe<Array<Scalars['Int']>>;
    version_lt?: InputMaybe<Scalars['Int']>;
    version_lte?: InputMaybe<Scalars['Int']>;
    version_not?: InputMaybe<Scalars['Int']>;
    version_not_in?: InputMaybe<Array<Scalars['Int']>>;
};

export enum Factory_OrderBy {
    Address = 'address',
    Id = 'id',
    Pools = 'pools',
    Type = 'type',
    Version = 'version',
}

export type Gyro2Params = {
    __typename?: 'Gyro2Params';
    /** Unique identifier for the Gyro2Params */
    id: Scalars['Bytes'];
    sqrtAlpha: Scalars['BigDecimal'];
    sqrtBeta: Scalars['BigDecimal'];
};

export type Gyro2Params_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<Gyro2Params_Filter>>>;
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
    or?: InputMaybe<Array<InputMaybe<Gyro2Params_Filter>>>;
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
};

export enum Gyro2Params_OrderBy {
    Id = 'id',
    SqrtAlpha = 'sqrtAlpha',
    SqrtBeta = 'sqrtBeta',
}

export type GyroEParams = {
    __typename?: 'GyroEParams';
    alpha: Scalars['BigDecimal'];
    beta: Scalars['BigDecimal'];
    c: Scalars['BigDecimal'];
    dSq: Scalars['BigDecimal'];
    /** Unique identifier for the GyroEParams */
    id: Scalars['Bytes'];
    lambda: Scalars['BigDecimal'];
    s: Scalars['BigDecimal'];
    tauAlphaX: Scalars['BigDecimal'];
    tauAlphaY: Scalars['BigDecimal'];
    tauBetaX: Scalars['BigDecimal'];
    tauBetaY: Scalars['BigDecimal'];
    u: Scalars['BigDecimal'];
    v: Scalars['BigDecimal'];
    w: Scalars['BigDecimal'];
    z: Scalars['BigDecimal'];
};

export type GyroEParams_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    alpha?: InputMaybe<Scalars['BigDecimal']>;
    alpha_gt?: InputMaybe<Scalars['BigDecimal']>;
    alpha_gte?: InputMaybe<Scalars['BigDecimal']>;
    alpha_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    alpha_lt?: InputMaybe<Scalars['BigDecimal']>;
    alpha_lte?: InputMaybe<Scalars['BigDecimal']>;
    alpha_not?: InputMaybe<Scalars['BigDecimal']>;
    alpha_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    and?: InputMaybe<Array<InputMaybe<GyroEParams_Filter>>>;
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
    dSq?: InputMaybe<Scalars['BigDecimal']>;
    dSq_gt?: InputMaybe<Scalars['BigDecimal']>;
    dSq_gte?: InputMaybe<Scalars['BigDecimal']>;
    dSq_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    dSq_lt?: InputMaybe<Scalars['BigDecimal']>;
    dSq_lte?: InputMaybe<Scalars['BigDecimal']>;
    dSq_not?: InputMaybe<Scalars['BigDecimal']>;
    dSq_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
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
    lambda?: InputMaybe<Scalars['BigDecimal']>;
    lambda_gt?: InputMaybe<Scalars['BigDecimal']>;
    lambda_gte?: InputMaybe<Scalars['BigDecimal']>;
    lambda_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    lambda_lt?: InputMaybe<Scalars['BigDecimal']>;
    lambda_lte?: InputMaybe<Scalars['BigDecimal']>;
    lambda_not?: InputMaybe<Scalars['BigDecimal']>;
    lambda_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    or?: InputMaybe<Array<InputMaybe<GyroEParams_Filter>>>;
    s?: InputMaybe<Scalars['BigDecimal']>;
    s_gt?: InputMaybe<Scalars['BigDecimal']>;
    s_gte?: InputMaybe<Scalars['BigDecimal']>;
    s_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    s_lt?: InputMaybe<Scalars['BigDecimal']>;
    s_lte?: InputMaybe<Scalars['BigDecimal']>;
    s_not?: InputMaybe<Scalars['BigDecimal']>;
    s_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
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
    u?: InputMaybe<Scalars['BigDecimal']>;
    u_gt?: InputMaybe<Scalars['BigDecimal']>;
    u_gte?: InputMaybe<Scalars['BigDecimal']>;
    u_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    u_lt?: InputMaybe<Scalars['BigDecimal']>;
    u_lte?: InputMaybe<Scalars['BigDecimal']>;
    u_not?: InputMaybe<Scalars['BigDecimal']>;
    u_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    v?: InputMaybe<Scalars['BigDecimal']>;
    v_gt?: InputMaybe<Scalars['BigDecimal']>;
    v_gte?: InputMaybe<Scalars['BigDecimal']>;
    v_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    v_lt?: InputMaybe<Scalars['BigDecimal']>;
    v_lte?: InputMaybe<Scalars['BigDecimal']>;
    v_not?: InputMaybe<Scalars['BigDecimal']>;
    v_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    w?: InputMaybe<Scalars['BigDecimal']>;
    w_gt?: InputMaybe<Scalars['BigDecimal']>;
    w_gte?: InputMaybe<Scalars['BigDecimal']>;
    w_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    w_lt?: InputMaybe<Scalars['BigDecimal']>;
    w_lte?: InputMaybe<Scalars['BigDecimal']>;
    w_not?: InputMaybe<Scalars['BigDecimal']>;
    w_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    z?: InputMaybe<Scalars['BigDecimal']>;
    z_gt?: InputMaybe<Scalars['BigDecimal']>;
    z_gte?: InputMaybe<Scalars['BigDecimal']>;
    z_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    z_lt?: InputMaybe<Scalars['BigDecimal']>;
    z_lte?: InputMaybe<Scalars['BigDecimal']>;
    z_not?: InputMaybe<Scalars['BigDecimal']>;
    z_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum GyroEParams_OrderBy {
    Alpha = 'alpha',
    Beta = 'beta',
    C = 'c',
    DSq = 'dSq',
    Id = 'id',
    Lambda = 'lambda',
    S = 's',
    TauAlphaX = 'tauAlphaX',
    TauAlphaY = 'tauAlphaY',
    TauBetaX = 'tauBetaX',
    TauBetaY = 'tauBetaY',
    U = 'u',
    V = 'v',
    W = 'w',
    Z = 'z',
}

export type LbpParams = {
    __typename?: 'LBPParams';
    /** End time of the LBP */
    endTime: Scalars['BigInt'];
    /** Unique identifier for the LBPParams */
    id: Scalars['Bytes'];
    /** Project token swap in blocked */
    isProjectTokenSwapInBlocked: Scalars['Boolean'];
    /** Owner of the LBP */
    owner: Scalars['Bytes'];
    /** Project token for the LBP */
    projectToken: Scalars['Bytes'];
    /** Final weight of the project token */
    projectTokenEndWeight: Scalars['BigInt'];
    /** Initial weight of the project token */
    projectTokenStartWeight: Scalars['BigInt'];
    /** Reserve token for the LBP */
    reserveToken: Scalars['Bytes'];
    /** Final weight of the reserve token */
    reserveTokenEndWeight: Scalars['BigInt'];
    /** Initial weight of the reserve token */
    reserveTokenStartWeight: Scalars['BigInt'];
    /** Start time of the LBP */
    startTime: Scalars['BigInt'];
};

export type LbpParams_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<LbpParams_Filter>>>;
    endTime?: InputMaybe<Scalars['BigInt']>;
    endTime_gt?: InputMaybe<Scalars['BigInt']>;
    endTime_gte?: InputMaybe<Scalars['BigInt']>;
    endTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
    endTime_lt?: InputMaybe<Scalars['BigInt']>;
    endTime_lte?: InputMaybe<Scalars['BigInt']>;
    endTime_not?: InputMaybe<Scalars['BigInt']>;
    endTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    isProjectTokenSwapInBlocked?: InputMaybe<Scalars['Boolean']>;
    isProjectTokenSwapInBlocked_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isProjectTokenSwapInBlocked_not?: InputMaybe<Scalars['Boolean']>;
    isProjectTokenSwapInBlocked_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    or?: InputMaybe<Array<InputMaybe<LbpParams_Filter>>>;
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
    projectToken?: InputMaybe<Scalars['Bytes']>;
    projectTokenEndWeight?: InputMaybe<Scalars['BigInt']>;
    projectTokenEndWeight_gt?: InputMaybe<Scalars['BigInt']>;
    projectTokenEndWeight_gte?: InputMaybe<Scalars['BigInt']>;
    projectTokenEndWeight_in?: InputMaybe<Array<Scalars['BigInt']>>;
    projectTokenEndWeight_lt?: InputMaybe<Scalars['BigInt']>;
    projectTokenEndWeight_lte?: InputMaybe<Scalars['BigInt']>;
    projectTokenEndWeight_not?: InputMaybe<Scalars['BigInt']>;
    projectTokenEndWeight_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    projectTokenStartWeight?: InputMaybe<Scalars['BigInt']>;
    projectTokenStartWeight_gt?: InputMaybe<Scalars['BigInt']>;
    projectTokenStartWeight_gte?: InputMaybe<Scalars['BigInt']>;
    projectTokenStartWeight_in?: InputMaybe<Array<Scalars['BigInt']>>;
    projectTokenStartWeight_lt?: InputMaybe<Scalars['BigInt']>;
    projectTokenStartWeight_lte?: InputMaybe<Scalars['BigInt']>;
    projectTokenStartWeight_not?: InputMaybe<Scalars['BigInt']>;
    projectTokenStartWeight_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    projectToken_contains?: InputMaybe<Scalars['Bytes']>;
    projectToken_gt?: InputMaybe<Scalars['Bytes']>;
    projectToken_gte?: InputMaybe<Scalars['Bytes']>;
    projectToken_in?: InputMaybe<Array<Scalars['Bytes']>>;
    projectToken_lt?: InputMaybe<Scalars['Bytes']>;
    projectToken_lte?: InputMaybe<Scalars['Bytes']>;
    projectToken_not?: InputMaybe<Scalars['Bytes']>;
    projectToken_not_contains?: InputMaybe<Scalars['Bytes']>;
    projectToken_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    reserveToken?: InputMaybe<Scalars['Bytes']>;
    reserveTokenEndWeight?: InputMaybe<Scalars['BigInt']>;
    reserveTokenEndWeight_gt?: InputMaybe<Scalars['BigInt']>;
    reserveTokenEndWeight_gte?: InputMaybe<Scalars['BigInt']>;
    reserveTokenEndWeight_in?: InputMaybe<Array<Scalars['BigInt']>>;
    reserveTokenEndWeight_lt?: InputMaybe<Scalars['BigInt']>;
    reserveTokenEndWeight_lte?: InputMaybe<Scalars['BigInt']>;
    reserveTokenEndWeight_not?: InputMaybe<Scalars['BigInt']>;
    reserveTokenEndWeight_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    reserveTokenStartWeight?: InputMaybe<Scalars['BigInt']>;
    reserveTokenStartWeight_gt?: InputMaybe<Scalars['BigInt']>;
    reserveTokenStartWeight_gte?: InputMaybe<Scalars['BigInt']>;
    reserveTokenStartWeight_in?: InputMaybe<Array<Scalars['BigInt']>>;
    reserveTokenStartWeight_lt?: InputMaybe<Scalars['BigInt']>;
    reserveTokenStartWeight_lte?: InputMaybe<Scalars['BigInt']>;
    reserveTokenStartWeight_not?: InputMaybe<Scalars['BigInt']>;
    reserveTokenStartWeight_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    reserveToken_contains?: InputMaybe<Scalars['Bytes']>;
    reserveToken_gt?: InputMaybe<Scalars['Bytes']>;
    reserveToken_gte?: InputMaybe<Scalars['Bytes']>;
    reserveToken_in?: InputMaybe<Array<Scalars['Bytes']>>;
    reserveToken_lt?: InputMaybe<Scalars['Bytes']>;
    reserveToken_lte?: InputMaybe<Scalars['Bytes']>;
    reserveToken_not?: InputMaybe<Scalars['Bytes']>;
    reserveToken_not_contains?: InputMaybe<Scalars['Bytes']>;
    reserveToken_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    startTime?: InputMaybe<Scalars['BigInt']>;
    startTime_gt?: InputMaybe<Scalars['BigInt']>;
    startTime_gte?: InputMaybe<Scalars['BigInt']>;
    startTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
    startTime_lt?: InputMaybe<Scalars['BigInt']>;
    startTime_lte?: InputMaybe<Scalars['BigInt']>;
    startTime_not?: InputMaybe<Scalars['BigInt']>;
    startTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum LbpParams_OrderBy {
    EndTime = 'endTime',
    Id = 'id',
    IsProjectTokenSwapInBlocked = 'isProjectTokenSwapInBlocked',
    Owner = 'owner',
    ProjectToken = 'projectToken',
    ProjectTokenEndWeight = 'projectTokenEndWeight',
    ProjectTokenStartWeight = 'projectTokenStartWeight',
    ReserveToken = 'reserveToken',
    ReserveTokenEndWeight = 'reserveTokenEndWeight',
    ReserveTokenStartWeight = 'reserveTokenStartWeight',
    StartTime = 'startTime',
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type Pool = {
    __typename?: 'Pool';
    /** Address of the Pool contract */
    address: Scalars['Bytes'];
    /** Factory that created this Pool */
    factory: Factory;
    /** Parameters for Gyro2 pools (null for other pool types) */
    gyro2Params?: Maybe<Gyro2Params>;
    /** Parameters for GyroE pools (null for other pool types) */
    gyroEParams?: Maybe<GyroEParams>;
    /** Unique identifier for the Pool */
    id: Scalars['Bytes'];
    /** Parameters for LBP pools (null for other pool types) */
    lbpParams?: Maybe<LbpParams>;
    /** Parameters for QuantAMMWeighted pools (null for other pool types) */
    quantAMMWeightedParams?: Maybe<QuantAmmWeightedParams>;
    /** Parameters for ReClamm pools (null for other pool types) */
    reClammParams?: Maybe<ReClammParams>;
    /** Parameters for Stable pools (null for other pool types) */
    stableParams?: Maybe<StableParams>;
    /** Parameters for StableSurge pools (null for other pool types) */
    stableSurgeParams?: Maybe<StableSurgeParams>;
    /** Parameters for Weighted pools (null for other pool types) */
    weightedParams?: Maybe<WeightedParams>;
};

export enum PoolType {
    Gyro2 = 'Gyro2',
    GyroE = 'GyroE',
    Lbp = 'LBP',
    QuantAmmWeighted = 'QuantAMMWeighted',
    ReClamm = 'ReClamm',
    Stable = 'Stable',
    StableSurge = 'StableSurge',
    Weighted = 'Weighted',
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
    factory?: InputMaybe<Scalars['String']>;
    factory_?: InputMaybe<Factory_Filter>;
    factory_contains?: InputMaybe<Scalars['String']>;
    factory_contains_nocase?: InputMaybe<Scalars['String']>;
    factory_ends_with?: InputMaybe<Scalars['String']>;
    factory_ends_with_nocase?: InputMaybe<Scalars['String']>;
    factory_gt?: InputMaybe<Scalars['String']>;
    factory_gte?: InputMaybe<Scalars['String']>;
    factory_in?: InputMaybe<Array<Scalars['String']>>;
    factory_lt?: InputMaybe<Scalars['String']>;
    factory_lte?: InputMaybe<Scalars['String']>;
    factory_not?: InputMaybe<Scalars['String']>;
    factory_not_contains?: InputMaybe<Scalars['String']>;
    factory_not_contains_nocase?: InputMaybe<Scalars['String']>;
    factory_not_ends_with?: InputMaybe<Scalars['String']>;
    factory_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    factory_not_in?: InputMaybe<Array<Scalars['String']>>;
    factory_not_starts_with?: InputMaybe<Scalars['String']>;
    factory_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    factory_starts_with?: InputMaybe<Scalars['String']>;
    factory_starts_with_nocase?: InputMaybe<Scalars['String']>;
    gyro2Params?: InputMaybe<Scalars['String']>;
    gyro2Params_?: InputMaybe<Gyro2Params_Filter>;
    gyro2Params_contains?: InputMaybe<Scalars['String']>;
    gyro2Params_contains_nocase?: InputMaybe<Scalars['String']>;
    gyro2Params_ends_with?: InputMaybe<Scalars['String']>;
    gyro2Params_ends_with_nocase?: InputMaybe<Scalars['String']>;
    gyro2Params_gt?: InputMaybe<Scalars['String']>;
    gyro2Params_gte?: InputMaybe<Scalars['String']>;
    gyro2Params_in?: InputMaybe<Array<Scalars['String']>>;
    gyro2Params_lt?: InputMaybe<Scalars['String']>;
    gyro2Params_lte?: InputMaybe<Scalars['String']>;
    gyro2Params_not?: InputMaybe<Scalars['String']>;
    gyro2Params_not_contains?: InputMaybe<Scalars['String']>;
    gyro2Params_not_contains_nocase?: InputMaybe<Scalars['String']>;
    gyro2Params_not_ends_with?: InputMaybe<Scalars['String']>;
    gyro2Params_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    gyro2Params_not_in?: InputMaybe<Array<Scalars['String']>>;
    gyro2Params_not_starts_with?: InputMaybe<Scalars['String']>;
    gyro2Params_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    gyro2Params_starts_with?: InputMaybe<Scalars['String']>;
    gyro2Params_starts_with_nocase?: InputMaybe<Scalars['String']>;
    gyroEParams?: InputMaybe<Scalars['String']>;
    gyroEParams_?: InputMaybe<GyroEParams_Filter>;
    gyroEParams_contains?: InputMaybe<Scalars['String']>;
    gyroEParams_contains_nocase?: InputMaybe<Scalars['String']>;
    gyroEParams_ends_with?: InputMaybe<Scalars['String']>;
    gyroEParams_ends_with_nocase?: InputMaybe<Scalars['String']>;
    gyroEParams_gt?: InputMaybe<Scalars['String']>;
    gyroEParams_gte?: InputMaybe<Scalars['String']>;
    gyroEParams_in?: InputMaybe<Array<Scalars['String']>>;
    gyroEParams_lt?: InputMaybe<Scalars['String']>;
    gyroEParams_lte?: InputMaybe<Scalars['String']>;
    gyroEParams_not?: InputMaybe<Scalars['String']>;
    gyroEParams_not_contains?: InputMaybe<Scalars['String']>;
    gyroEParams_not_contains_nocase?: InputMaybe<Scalars['String']>;
    gyroEParams_not_ends_with?: InputMaybe<Scalars['String']>;
    gyroEParams_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    gyroEParams_not_in?: InputMaybe<Array<Scalars['String']>>;
    gyroEParams_not_starts_with?: InputMaybe<Scalars['String']>;
    gyroEParams_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    gyroEParams_starts_with?: InputMaybe<Scalars['String']>;
    gyroEParams_starts_with_nocase?: InputMaybe<Scalars['String']>;
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
    lbpParams?: InputMaybe<Scalars['String']>;
    lbpParams_?: InputMaybe<LbpParams_Filter>;
    lbpParams_contains?: InputMaybe<Scalars['String']>;
    lbpParams_contains_nocase?: InputMaybe<Scalars['String']>;
    lbpParams_ends_with?: InputMaybe<Scalars['String']>;
    lbpParams_ends_with_nocase?: InputMaybe<Scalars['String']>;
    lbpParams_gt?: InputMaybe<Scalars['String']>;
    lbpParams_gte?: InputMaybe<Scalars['String']>;
    lbpParams_in?: InputMaybe<Array<Scalars['String']>>;
    lbpParams_lt?: InputMaybe<Scalars['String']>;
    lbpParams_lte?: InputMaybe<Scalars['String']>;
    lbpParams_not?: InputMaybe<Scalars['String']>;
    lbpParams_not_contains?: InputMaybe<Scalars['String']>;
    lbpParams_not_contains_nocase?: InputMaybe<Scalars['String']>;
    lbpParams_not_ends_with?: InputMaybe<Scalars['String']>;
    lbpParams_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    lbpParams_not_in?: InputMaybe<Array<Scalars['String']>>;
    lbpParams_not_starts_with?: InputMaybe<Scalars['String']>;
    lbpParams_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    lbpParams_starts_with?: InputMaybe<Scalars['String']>;
    lbpParams_starts_with_nocase?: InputMaybe<Scalars['String']>;
    or?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
    quantAMMWeightedParams?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_?: InputMaybe<QuantAmmWeightedParams_Filter>;
    quantAMMWeightedParams_contains?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_contains_nocase?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_ends_with?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_ends_with_nocase?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_gt?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_gte?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_in?: InputMaybe<Array<Scalars['String']>>;
    quantAMMWeightedParams_lt?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_lte?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_not?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_not_contains?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_not_contains_nocase?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_not_ends_with?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_not_in?: InputMaybe<Array<Scalars['String']>>;
    quantAMMWeightedParams_not_starts_with?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_starts_with?: InputMaybe<Scalars['String']>;
    quantAMMWeightedParams_starts_with_nocase?: InputMaybe<Scalars['String']>;
    reClammParams?: InputMaybe<Scalars['String']>;
    reClammParams_?: InputMaybe<ReClammParams_Filter>;
    reClammParams_contains?: InputMaybe<Scalars['String']>;
    reClammParams_contains_nocase?: InputMaybe<Scalars['String']>;
    reClammParams_ends_with?: InputMaybe<Scalars['String']>;
    reClammParams_ends_with_nocase?: InputMaybe<Scalars['String']>;
    reClammParams_gt?: InputMaybe<Scalars['String']>;
    reClammParams_gte?: InputMaybe<Scalars['String']>;
    reClammParams_in?: InputMaybe<Array<Scalars['String']>>;
    reClammParams_lt?: InputMaybe<Scalars['String']>;
    reClammParams_lte?: InputMaybe<Scalars['String']>;
    reClammParams_not?: InputMaybe<Scalars['String']>;
    reClammParams_not_contains?: InputMaybe<Scalars['String']>;
    reClammParams_not_contains_nocase?: InputMaybe<Scalars['String']>;
    reClammParams_not_ends_with?: InputMaybe<Scalars['String']>;
    reClammParams_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    reClammParams_not_in?: InputMaybe<Array<Scalars['String']>>;
    reClammParams_not_starts_with?: InputMaybe<Scalars['String']>;
    reClammParams_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    reClammParams_starts_with?: InputMaybe<Scalars['String']>;
    reClammParams_starts_with_nocase?: InputMaybe<Scalars['String']>;
    stableParams?: InputMaybe<Scalars['String']>;
    stableParams_?: InputMaybe<StableParams_Filter>;
    stableParams_contains?: InputMaybe<Scalars['String']>;
    stableParams_contains_nocase?: InputMaybe<Scalars['String']>;
    stableParams_ends_with?: InputMaybe<Scalars['String']>;
    stableParams_ends_with_nocase?: InputMaybe<Scalars['String']>;
    stableParams_gt?: InputMaybe<Scalars['String']>;
    stableParams_gte?: InputMaybe<Scalars['String']>;
    stableParams_in?: InputMaybe<Array<Scalars['String']>>;
    stableParams_lt?: InputMaybe<Scalars['String']>;
    stableParams_lte?: InputMaybe<Scalars['String']>;
    stableParams_not?: InputMaybe<Scalars['String']>;
    stableParams_not_contains?: InputMaybe<Scalars['String']>;
    stableParams_not_contains_nocase?: InputMaybe<Scalars['String']>;
    stableParams_not_ends_with?: InputMaybe<Scalars['String']>;
    stableParams_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    stableParams_not_in?: InputMaybe<Array<Scalars['String']>>;
    stableParams_not_starts_with?: InputMaybe<Scalars['String']>;
    stableParams_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    stableParams_starts_with?: InputMaybe<Scalars['String']>;
    stableParams_starts_with_nocase?: InputMaybe<Scalars['String']>;
    stableSurgeParams?: InputMaybe<Scalars['String']>;
    stableSurgeParams_?: InputMaybe<StableSurgeParams_Filter>;
    stableSurgeParams_contains?: InputMaybe<Scalars['String']>;
    stableSurgeParams_contains_nocase?: InputMaybe<Scalars['String']>;
    stableSurgeParams_ends_with?: InputMaybe<Scalars['String']>;
    stableSurgeParams_ends_with_nocase?: InputMaybe<Scalars['String']>;
    stableSurgeParams_gt?: InputMaybe<Scalars['String']>;
    stableSurgeParams_gte?: InputMaybe<Scalars['String']>;
    stableSurgeParams_in?: InputMaybe<Array<Scalars['String']>>;
    stableSurgeParams_lt?: InputMaybe<Scalars['String']>;
    stableSurgeParams_lte?: InputMaybe<Scalars['String']>;
    stableSurgeParams_not?: InputMaybe<Scalars['String']>;
    stableSurgeParams_not_contains?: InputMaybe<Scalars['String']>;
    stableSurgeParams_not_contains_nocase?: InputMaybe<Scalars['String']>;
    stableSurgeParams_not_ends_with?: InputMaybe<Scalars['String']>;
    stableSurgeParams_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    stableSurgeParams_not_in?: InputMaybe<Array<Scalars['String']>>;
    stableSurgeParams_not_starts_with?: InputMaybe<Scalars['String']>;
    stableSurgeParams_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    stableSurgeParams_starts_with?: InputMaybe<Scalars['String']>;
    stableSurgeParams_starts_with_nocase?: InputMaybe<Scalars['String']>;
    weightedParams?: InputMaybe<Scalars['String']>;
    weightedParams_?: InputMaybe<WeightedParams_Filter>;
    weightedParams_contains?: InputMaybe<Scalars['String']>;
    weightedParams_contains_nocase?: InputMaybe<Scalars['String']>;
    weightedParams_ends_with?: InputMaybe<Scalars['String']>;
    weightedParams_ends_with_nocase?: InputMaybe<Scalars['String']>;
    weightedParams_gt?: InputMaybe<Scalars['String']>;
    weightedParams_gte?: InputMaybe<Scalars['String']>;
    weightedParams_in?: InputMaybe<Array<Scalars['String']>>;
    weightedParams_lt?: InputMaybe<Scalars['String']>;
    weightedParams_lte?: InputMaybe<Scalars['String']>;
    weightedParams_not?: InputMaybe<Scalars['String']>;
    weightedParams_not_contains?: InputMaybe<Scalars['String']>;
    weightedParams_not_contains_nocase?: InputMaybe<Scalars['String']>;
    weightedParams_not_ends_with?: InputMaybe<Scalars['String']>;
    weightedParams_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    weightedParams_not_in?: InputMaybe<Array<Scalars['String']>>;
    weightedParams_not_starts_with?: InputMaybe<Scalars['String']>;
    weightedParams_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    weightedParams_starts_with?: InputMaybe<Scalars['String']>;
    weightedParams_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Pool_OrderBy {
    Address = 'address',
    Factory = 'factory',
    FactoryAddress = 'factory__address',
    FactoryId = 'factory__id',
    FactoryType = 'factory__type',
    FactoryVersion = 'factory__version',
    Gyro2Params = 'gyro2Params',
    Gyro2ParamsId = 'gyro2Params__id',
    Gyro2ParamsSqrtAlpha = 'gyro2Params__sqrtAlpha',
    Gyro2ParamsSqrtBeta = 'gyro2Params__sqrtBeta',
    GyroEParams = 'gyroEParams',
    GyroEParamsAlpha = 'gyroEParams__alpha',
    GyroEParamsBeta = 'gyroEParams__beta',
    GyroEParamsC = 'gyroEParams__c',
    GyroEParamsDSq = 'gyroEParams__dSq',
    GyroEParamsId = 'gyroEParams__id',
    GyroEParamsLambda = 'gyroEParams__lambda',
    GyroEParamsS = 'gyroEParams__s',
    GyroEParamsTauAlphaX = 'gyroEParams__tauAlphaX',
    GyroEParamsTauAlphaY = 'gyroEParams__tauAlphaY',
    GyroEParamsTauBetaX = 'gyroEParams__tauBetaX',
    GyroEParamsTauBetaY = 'gyroEParams__tauBetaY',
    GyroEParamsU = 'gyroEParams__u',
    GyroEParamsV = 'gyroEParams__v',
    GyroEParamsW = 'gyroEParams__w',
    GyroEParamsZ = 'gyroEParams__z',
    Id = 'id',
    LbpParams = 'lbpParams',
    LbpParamsEndTime = 'lbpParams__endTime',
    LbpParamsId = 'lbpParams__id',
    LbpParamsIsProjectTokenSwapInBlocked = 'lbpParams__isProjectTokenSwapInBlocked',
    LbpParamsOwner = 'lbpParams__owner',
    LbpParamsProjectToken = 'lbpParams__projectToken',
    LbpParamsProjectTokenEndWeight = 'lbpParams__projectTokenEndWeight',
    LbpParamsProjectTokenStartWeight = 'lbpParams__projectTokenStartWeight',
    LbpParamsReserveToken = 'lbpParams__reserveToken',
    LbpParamsReserveTokenEndWeight = 'lbpParams__reserveTokenEndWeight',
    LbpParamsReserveTokenStartWeight = 'lbpParams__reserveTokenStartWeight',
    LbpParamsStartTime = 'lbpParams__startTime',
    QuantAmmWeightedParams = 'quantAMMWeightedParams',
    QuantAmmWeightedParamsAbsoluteWeightGuardRail = 'quantAMMWeightedParams__absoluteWeightGuardRail',
    QuantAmmWeightedParamsEpsilonMax = 'quantAMMWeightedParams__epsilonMax',
    QuantAmmWeightedParamsId = 'quantAMMWeightedParams__id',
    QuantAmmWeightedParamsLastInterpolationTimePossible = 'quantAMMWeightedParams__lastInterpolationTimePossible',
    QuantAmmWeightedParamsLastUpdateIntervalTime = 'quantAMMWeightedParams__lastUpdateIntervalTime',
    QuantAmmWeightedParamsMaxTradeSizeRatio = 'quantAMMWeightedParams__maxTradeSizeRatio',
    QuantAmmWeightedParamsOracleStalenessThreshold = 'quantAMMWeightedParams__oracleStalenessThreshold',
    QuantAmmWeightedParamsPoolRegistry = 'quantAMMWeightedParams__poolRegistry',
    QuantAmmWeightedParamsUpdateInterval = 'quantAMMWeightedParams__updateInterval',
    ReClammParams = 'reClammParams',
    ReClammParamsCenterednessMargin = 'reClammParams__centerednessMargin',
    ReClammParamsCurrentFourthRootPriceRatio = 'reClammParams__currentFourthRootPriceRatio',
    ReClammParamsDailyPriceShiftBase = 'reClammParams__dailyPriceShiftBase',
    ReClammParamsDailyPriceShiftExponent = 'reClammParams__dailyPriceShiftExponent',
    ReClammParamsEndFourthRootPriceRatio = 'reClammParams__endFourthRootPriceRatio',
    ReClammParamsId = 'reClammParams__id',
    ReClammParamsLastTimestamp = 'reClammParams__lastTimestamp',
    ReClammParamsPriceRatioUpdateEndTime = 'reClammParams__priceRatioUpdateEndTime',
    ReClammParamsPriceRatioUpdateStartTime = 'reClammParams__priceRatioUpdateStartTime',
    ReClammParamsStartFourthRootPriceRatio = 'reClammParams__startFourthRootPriceRatio',
    StableParams = 'stableParams',
    StableParamsAmp = 'stableParams__amp',
    StableParamsId = 'stableParams__id',
    StableSurgeParams = 'stableSurgeParams',
    StableSurgeParamsAmp = 'stableSurgeParams__amp',
    StableSurgeParamsId = 'stableSurgeParams__id',
    StableSurgeParamsMaxSurgeFeePercentage = 'stableSurgeParams__maxSurgeFeePercentage',
    StableSurgeParamsSurgeThresholdPercentage = 'stableSurgeParams__surgeThresholdPercentage',
    WeightedParams = 'weightedParams',
    WeightedParamsId = 'weightedParams__id',
}

export type QuantAmmWeightedDetail = {
    __typename?: 'QuantAMMWeightedDetail';
    category: Scalars['String'];
    id: Scalars['Bytes'];
    name: Scalars['String'];
    pool: QuantAmmWeightedParams;
    type: Scalars['String'];
    value: Scalars['String'];
};

export type QuantAmmWeightedDetail_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<QuantAmmWeightedDetail_Filter>>>;
    category?: InputMaybe<Scalars['String']>;
    category_contains?: InputMaybe<Scalars['String']>;
    category_contains_nocase?: InputMaybe<Scalars['String']>;
    category_ends_with?: InputMaybe<Scalars['String']>;
    category_ends_with_nocase?: InputMaybe<Scalars['String']>;
    category_gt?: InputMaybe<Scalars['String']>;
    category_gte?: InputMaybe<Scalars['String']>;
    category_in?: InputMaybe<Array<Scalars['String']>>;
    category_lt?: InputMaybe<Scalars['String']>;
    category_lte?: InputMaybe<Scalars['String']>;
    category_not?: InputMaybe<Scalars['String']>;
    category_not_contains?: InputMaybe<Scalars['String']>;
    category_not_contains_nocase?: InputMaybe<Scalars['String']>;
    category_not_ends_with?: InputMaybe<Scalars['String']>;
    category_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    category_not_in?: InputMaybe<Array<Scalars['String']>>;
    category_not_starts_with?: InputMaybe<Scalars['String']>;
    category_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    category_starts_with?: InputMaybe<Scalars['String']>;
    category_starts_with_nocase?: InputMaybe<Scalars['String']>;
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
    or?: InputMaybe<Array<InputMaybe<QuantAmmWeightedDetail_Filter>>>;
    pool?: InputMaybe<Scalars['String']>;
    pool_?: InputMaybe<QuantAmmWeightedParams_Filter>;
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
    type?: InputMaybe<Scalars['String']>;
    type_contains?: InputMaybe<Scalars['String']>;
    type_contains_nocase?: InputMaybe<Scalars['String']>;
    type_ends_with?: InputMaybe<Scalars['String']>;
    type_ends_with_nocase?: InputMaybe<Scalars['String']>;
    type_gt?: InputMaybe<Scalars['String']>;
    type_gte?: InputMaybe<Scalars['String']>;
    type_in?: InputMaybe<Array<Scalars['String']>>;
    type_lt?: InputMaybe<Scalars['String']>;
    type_lte?: InputMaybe<Scalars['String']>;
    type_not?: InputMaybe<Scalars['String']>;
    type_not_contains?: InputMaybe<Scalars['String']>;
    type_not_contains_nocase?: InputMaybe<Scalars['String']>;
    type_not_ends_with?: InputMaybe<Scalars['String']>;
    type_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    type_not_in?: InputMaybe<Array<Scalars['String']>>;
    type_not_starts_with?: InputMaybe<Scalars['String']>;
    type_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    type_starts_with?: InputMaybe<Scalars['String']>;
    type_starts_with_nocase?: InputMaybe<Scalars['String']>;
    value?: InputMaybe<Scalars['String']>;
    value_contains?: InputMaybe<Scalars['String']>;
    value_contains_nocase?: InputMaybe<Scalars['String']>;
    value_ends_with?: InputMaybe<Scalars['String']>;
    value_ends_with_nocase?: InputMaybe<Scalars['String']>;
    value_gt?: InputMaybe<Scalars['String']>;
    value_gte?: InputMaybe<Scalars['String']>;
    value_in?: InputMaybe<Array<Scalars['String']>>;
    value_lt?: InputMaybe<Scalars['String']>;
    value_lte?: InputMaybe<Scalars['String']>;
    value_not?: InputMaybe<Scalars['String']>;
    value_not_contains?: InputMaybe<Scalars['String']>;
    value_not_contains_nocase?: InputMaybe<Scalars['String']>;
    value_not_ends_with?: InputMaybe<Scalars['String']>;
    value_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    value_not_in?: InputMaybe<Array<Scalars['String']>>;
    value_not_starts_with?: InputMaybe<Scalars['String']>;
    value_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    value_starts_with?: InputMaybe<Scalars['String']>;
    value_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum QuantAmmWeightedDetail_OrderBy {
    Category = 'category',
    Id = 'id',
    Name = 'name',
    Pool = 'pool',
    PoolAbsoluteWeightGuardRail = 'pool__absoluteWeightGuardRail',
    PoolEpsilonMax = 'pool__epsilonMax',
    PoolId = 'pool__id',
    PoolLastInterpolationTimePossible = 'pool__lastInterpolationTimePossible',
    PoolLastUpdateIntervalTime = 'pool__lastUpdateIntervalTime',
    PoolMaxTradeSizeRatio = 'pool__maxTradeSizeRatio',
    PoolOracleStalenessThreshold = 'pool__oracleStalenessThreshold',
    PoolPoolRegistry = 'pool__poolRegistry',
    PoolUpdateInterval = 'pool__updateInterval',
    Type = 'type',
    Value = 'value',
}

export type QuantAmmWeightedParams = {
    __typename?: 'QuantAMMWeightedParams';
    /** Absolute weight guard rail */
    absoluteWeightGuardRail: Scalars['BigInt'];
    /** Pool details array */
    details: Array<QuantAmmWeightedDetail>;
    /** Maximum epsilon value */
    epsilonMax: Scalars['BigInt'];
    /** Unique identifier for the QuantAMMWeightedParams */
    id: Scalars['Bytes'];
    /** Lambda values */
    lambda: Array<Scalars['BigInt']>;
    /** Last interpolation time possible */
    lastInterpolationTimePossible: Scalars['BigInt'];
    /** Last update interval time */
    lastUpdateIntervalTime: Scalars['BigInt'];
    /** Maximum trade size ratio */
    maxTradeSizeRatio: Scalars['BigInt'];
    /** Oracle staleness threshold */
    oracleStalenessThreshold: Scalars['BigInt'];
    /** Pool registry */
    poolRegistry: Scalars['BigInt'];
    /** Update interval */
    updateInterval: Scalars['BigInt'];
    /** Weight block multipliers */
    weightBlockMultipliers: Array<Scalars['BigInt']>;
    /** Weights at the last update interval */
    weightsAtLastUpdateInterval: Array<Scalars['BigInt']>;
};

export type QuantAmmWeightedParamsDetailsArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<QuantAmmWeightedDetail_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<QuantAmmWeightedDetail_Filter>;
};

export type QuantAmmWeightedParams_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    absoluteWeightGuardRail?: InputMaybe<Scalars['BigInt']>;
    absoluteWeightGuardRail_gt?: InputMaybe<Scalars['BigInt']>;
    absoluteWeightGuardRail_gte?: InputMaybe<Scalars['BigInt']>;
    absoluteWeightGuardRail_in?: InputMaybe<Array<Scalars['BigInt']>>;
    absoluteWeightGuardRail_lt?: InputMaybe<Scalars['BigInt']>;
    absoluteWeightGuardRail_lte?: InputMaybe<Scalars['BigInt']>;
    absoluteWeightGuardRail_not?: InputMaybe<Scalars['BigInt']>;
    absoluteWeightGuardRail_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    and?: InputMaybe<Array<InputMaybe<QuantAmmWeightedParams_Filter>>>;
    details_?: InputMaybe<QuantAmmWeightedDetail_Filter>;
    epsilonMax?: InputMaybe<Scalars['BigInt']>;
    epsilonMax_gt?: InputMaybe<Scalars['BigInt']>;
    epsilonMax_gte?: InputMaybe<Scalars['BigInt']>;
    epsilonMax_in?: InputMaybe<Array<Scalars['BigInt']>>;
    epsilonMax_lt?: InputMaybe<Scalars['BigInt']>;
    epsilonMax_lte?: InputMaybe<Scalars['BigInt']>;
    epsilonMax_not?: InputMaybe<Scalars['BigInt']>;
    epsilonMax_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    lambda?: InputMaybe<Array<Scalars['BigInt']>>;
    lambda_contains?: InputMaybe<Array<Scalars['BigInt']>>;
    lambda_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
    lambda_not?: InputMaybe<Array<Scalars['BigInt']>>;
    lambda_not_contains?: InputMaybe<Array<Scalars['BigInt']>>;
    lambda_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
    lastInterpolationTimePossible?: InputMaybe<Scalars['BigInt']>;
    lastInterpolationTimePossible_gt?: InputMaybe<Scalars['BigInt']>;
    lastInterpolationTimePossible_gte?: InputMaybe<Scalars['BigInt']>;
    lastInterpolationTimePossible_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lastInterpolationTimePossible_lt?: InputMaybe<Scalars['BigInt']>;
    lastInterpolationTimePossible_lte?: InputMaybe<Scalars['BigInt']>;
    lastInterpolationTimePossible_not?: InputMaybe<Scalars['BigInt']>;
    lastInterpolationTimePossible_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lastUpdateIntervalTime?: InputMaybe<Scalars['BigInt']>;
    lastUpdateIntervalTime_gt?: InputMaybe<Scalars['BigInt']>;
    lastUpdateIntervalTime_gte?: InputMaybe<Scalars['BigInt']>;
    lastUpdateIntervalTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lastUpdateIntervalTime_lt?: InputMaybe<Scalars['BigInt']>;
    lastUpdateIntervalTime_lte?: InputMaybe<Scalars['BigInt']>;
    lastUpdateIntervalTime_not?: InputMaybe<Scalars['BigInt']>;
    lastUpdateIntervalTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    maxTradeSizeRatio?: InputMaybe<Scalars['BigInt']>;
    maxTradeSizeRatio_gt?: InputMaybe<Scalars['BigInt']>;
    maxTradeSizeRatio_gte?: InputMaybe<Scalars['BigInt']>;
    maxTradeSizeRatio_in?: InputMaybe<Array<Scalars['BigInt']>>;
    maxTradeSizeRatio_lt?: InputMaybe<Scalars['BigInt']>;
    maxTradeSizeRatio_lte?: InputMaybe<Scalars['BigInt']>;
    maxTradeSizeRatio_not?: InputMaybe<Scalars['BigInt']>;
    maxTradeSizeRatio_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    or?: InputMaybe<Array<InputMaybe<QuantAmmWeightedParams_Filter>>>;
    oracleStalenessThreshold?: InputMaybe<Scalars['BigInt']>;
    oracleStalenessThreshold_gt?: InputMaybe<Scalars['BigInt']>;
    oracleStalenessThreshold_gte?: InputMaybe<Scalars['BigInt']>;
    oracleStalenessThreshold_in?: InputMaybe<Array<Scalars['BigInt']>>;
    oracleStalenessThreshold_lt?: InputMaybe<Scalars['BigInt']>;
    oracleStalenessThreshold_lte?: InputMaybe<Scalars['BigInt']>;
    oracleStalenessThreshold_not?: InputMaybe<Scalars['BigInt']>;
    oracleStalenessThreshold_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    poolRegistry?: InputMaybe<Scalars['BigInt']>;
    poolRegistry_gt?: InputMaybe<Scalars['BigInt']>;
    poolRegistry_gte?: InputMaybe<Scalars['BigInt']>;
    poolRegistry_in?: InputMaybe<Array<Scalars['BigInt']>>;
    poolRegistry_lt?: InputMaybe<Scalars['BigInt']>;
    poolRegistry_lte?: InputMaybe<Scalars['BigInt']>;
    poolRegistry_not?: InputMaybe<Scalars['BigInt']>;
    poolRegistry_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    updateInterval?: InputMaybe<Scalars['BigInt']>;
    updateInterval_gt?: InputMaybe<Scalars['BigInt']>;
    updateInterval_gte?: InputMaybe<Scalars['BigInt']>;
    updateInterval_in?: InputMaybe<Array<Scalars['BigInt']>>;
    updateInterval_lt?: InputMaybe<Scalars['BigInt']>;
    updateInterval_lte?: InputMaybe<Scalars['BigInt']>;
    updateInterval_not?: InputMaybe<Scalars['BigInt']>;
    updateInterval_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    weightBlockMultipliers?: InputMaybe<Array<Scalars['BigInt']>>;
    weightBlockMultipliers_contains?: InputMaybe<Array<Scalars['BigInt']>>;
    weightBlockMultipliers_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
    weightBlockMultipliers_not?: InputMaybe<Array<Scalars['BigInt']>>;
    weightBlockMultipliers_not_contains?: InputMaybe<Array<Scalars['BigInt']>>;
    weightBlockMultipliers_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
    weightsAtLastUpdateInterval?: InputMaybe<Array<Scalars['BigInt']>>;
    weightsAtLastUpdateInterval_contains?: InputMaybe<Array<Scalars['BigInt']>>;
    weightsAtLastUpdateInterval_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
    weightsAtLastUpdateInterval_not?: InputMaybe<Array<Scalars['BigInt']>>;
    weightsAtLastUpdateInterval_not_contains?: InputMaybe<Array<Scalars['BigInt']>>;
    weightsAtLastUpdateInterval_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum QuantAmmWeightedParams_OrderBy {
    AbsoluteWeightGuardRail = 'absoluteWeightGuardRail',
    Details = 'details',
    EpsilonMax = 'epsilonMax',
    Id = 'id',
    Lambda = 'lambda',
    LastInterpolationTimePossible = 'lastInterpolationTimePossible',
    LastUpdateIntervalTime = 'lastUpdateIntervalTime',
    MaxTradeSizeRatio = 'maxTradeSizeRatio',
    OracleStalenessThreshold = 'oracleStalenessThreshold',
    PoolRegistry = 'poolRegistry',
    UpdateInterval = 'updateInterval',
    WeightBlockMultipliers = 'weightBlockMultipliers',
    WeightsAtLastUpdateInterval = 'weightsAtLastUpdateInterval',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    factories: Array<Factory>;
    factory?: Maybe<Factory>;
    gyro2Params?: Maybe<Gyro2Params>;
    gyro2Params_collection: Array<Gyro2Params>;
    gyroEParams?: Maybe<GyroEParams>;
    gyroEParams_collection: Array<GyroEParams>;
    lbpparams?: Maybe<LbpParams>;
    lbpparams_collection: Array<LbpParams>;
    pool?: Maybe<Pool>;
    pools: Array<Pool>;
    quantAMMWeightedDetail?: Maybe<QuantAmmWeightedDetail>;
    quantAMMWeightedDetails: Array<QuantAmmWeightedDetail>;
    quantAMMWeightedParams?: Maybe<QuantAmmWeightedParams>;
    quantAMMWeightedParams_collection: Array<QuantAmmWeightedParams>;
    reClammParams?: Maybe<ReClammParams>;
    reClammParams_collection: Array<ReClammParams>;
    stableParams?: Maybe<StableParams>;
    stableParams_collection: Array<StableParams>;
    stableSurgeParams?: Maybe<StableSurgeParams>;
    stableSurgeParams_collection: Array<StableSurgeParams>;
    weightedParams?: Maybe<WeightedParams>;
    weightedParams_collection: Array<WeightedParams>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryFactoriesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Factory_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Factory_Filter>;
};

export type QueryFactoryArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGyro2ParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGyro2Params_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Gyro2Params_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Gyro2Params_Filter>;
};

export type QueryGyroEParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGyroEParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GyroEParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GyroEParams_Filter>;
};

export type QueryLbpparamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLbpparams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LbpParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LbpParams_Filter>;
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

export type QueryQuantAmmWeightedDetailArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryQuantAmmWeightedDetailsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<QuantAmmWeightedDetail_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<QuantAmmWeightedDetail_Filter>;
};

export type QueryQuantAmmWeightedParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryQuantAmmWeightedParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<QuantAmmWeightedParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<QuantAmmWeightedParams_Filter>;
};

export type QueryReClammParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryReClammParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<ReClammParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<ReClammParams_Filter>;
};

export type QueryStableParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryStableParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<StableParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<StableParams_Filter>;
};

export type QueryStableSurgeParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryStableSurgeParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<StableSurgeParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<StableSurgeParams_Filter>;
};

export type QueryWeightedParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryWeightedParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<WeightedParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<WeightedParams_Filter>;
};

export type ReClammParams = {
    __typename?: 'ReClammParams';
    /** The centeredness margin of the pool */
    centerednessMargin: Scalars['BigInt'];
    /** The current fourth root price ratio, an interpolation of the price ratio state */
    currentFourthRootPriceRatio: Scalars['BigInt'];
    /** Internal time constant used to update virtual balances (1 - tau) */
    dailyPriceShiftBase: Scalars['BigInt'];
    /** Represents how fast the pool can move the virtual balances per day */
    dailyPriceShiftExponent: Scalars['BigInt'];
    /** The fourth root price ratio at the end of an update */
    endFourthRootPriceRatio: Scalars['BigInt'];
    /** Unique identifier for the ReClammParams */
    id: Scalars['Bytes'];
    /** The timestamp of the last user interaction */
    lastTimestamp: Scalars['BigInt'];
    /** The last virtual balances of the pool */
    lastVirtualBalances: Array<Scalars['BigInt']>;
    /** The timestamp when the update ends */
    priceRatioUpdateEndTime: Scalars['BigInt'];
    /** The timestamp when the update begins */
    priceRatioUpdateStartTime: Scalars['BigInt'];
    /** The fourth root price ratio at the start of an update */
    startFourthRootPriceRatio: Scalars['BigInt'];
};

export type ReClammParams_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<ReClammParams_Filter>>>;
    centerednessMargin?: InputMaybe<Scalars['BigInt']>;
    centerednessMargin_gt?: InputMaybe<Scalars['BigInt']>;
    centerednessMargin_gte?: InputMaybe<Scalars['BigInt']>;
    centerednessMargin_in?: InputMaybe<Array<Scalars['BigInt']>>;
    centerednessMargin_lt?: InputMaybe<Scalars['BigInt']>;
    centerednessMargin_lte?: InputMaybe<Scalars['BigInt']>;
    centerednessMargin_not?: InputMaybe<Scalars['BigInt']>;
    centerednessMargin_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    currentFourthRootPriceRatio?: InputMaybe<Scalars['BigInt']>;
    currentFourthRootPriceRatio_gt?: InputMaybe<Scalars['BigInt']>;
    currentFourthRootPriceRatio_gte?: InputMaybe<Scalars['BigInt']>;
    currentFourthRootPriceRatio_in?: InputMaybe<Array<Scalars['BigInt']>>;
    currentFourthRootPriceRatio_lt?: InputMaybe<Scalars['BigInt']>;
    currentFourthRootPriceRatio_lte?: InputMaybe<Scalars['BigInt']>;
    currentFourthRootPriceRatio_not?: InputMaybe<Scalars['BigInt']>;
    currentFourthRootPriceRatio_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    dailyPriceShiftBase?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftBase_gt?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftBase_gte?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftBase_in?: InputMaybe<Array<Scalars['BigInt']>>;
    dailyPriceShiftBase_lt?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftBase_lte?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftBase_not?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftBase_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    dailyPriceShiftExponent?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftExponent_gt?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftExponent_gte?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftExponent_in?: InputMaybe<Array<Scalars['BigInt']>>;
    dailyPriceShiftExponent_lt?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftExponent_lte?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftExponent_not?: InputMaybe<Scalars['BigInt']>;
    dailyPriceShiftExponent_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    endFourthRootPriceRatio?: InputMaybe<Scalars['BigInt']>;
    endFourthRootPriceRatio_gt?: InputMaybe<Scalars['BigInt']>;
    endFourthRootPriceRatio_gte?: InputMaybe<Scalars['BigInt']>;
    endFourthRootPriceRatio_in?: InputMaybe<Array<Scalars['BigInt']>>;
    endFourthRootPriceRatio_lt?: InputMaybe<Scalars['BigInt']>;
    endFourthRootPriceRatio_lte?: InputMaybe<Scalars['BigInt']>;
    endFourthRootPriceRatio_not?: InputMaybe<Scalars['BigInt']>;
    endFourthRootPriceRatio_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    lastTimestamp?: InputMaybe<Scalars['BigInt']>;
    lastTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
    lastTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
    lastTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lastTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
    lastTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
    lastTimestamp_not?: InputMaybe<Scalars['BigInt']>;
    lastTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    lastVirtualBalances?: InputMaybe<Array<Scalars['BigInt']>>;
    lastVirtualBalances_contains?: InputMaybe<Array<Scalars['BigInt']>>;
    lastVirtualBalances_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
    lastVirtualBalances_not?: InputMaybe<Array<Scalars['BigInt']>>;
    lastVirtualBalances_not_contains?: InputMaybe<Array<Scalars['BigInt']>>;
    lastVirtualBalances_not_contains_nocase?: InputMaybe<Array<Scalars['BigInt']>>;
    or?: InputMaybe<Array<InputMaybe<ReClammParams_Filter>>>;
    priceRatioUpdateEndTime?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateEndTime_gt?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateEndTime_gte?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateEndTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
    priceRatioUpdateEndTime_lt?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateEndTime_lte?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateEndTime_not?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateEndTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    priceRatioUpdateStartTime?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateStartTime_gt?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateStartTime_gte?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateStartTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
    priceRatioUpdateStartTime_lt?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateStartTime_lte?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateStartTime_not?: InputMaybe<Scalars['BigInt']>;
    priceRatioUpdateStartTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    startFourthRootPriceRatio?: InputMaybe<Scalars['BigInt']>;
    startFourthRootPriceRatio_gt?: InputMaybe<Scalars['BigInt']>;
    startFourthRootPriceRatio_gte?: InputMaybe<Scalars['BigInt']>;
    startFourthRootPriceRatio_in?: InputMaybe<Array<Scalars['BigInt']>>;
    startFourthRootPriceRatio_lt?: InputMaybe<Scalars['BigInt']>;
    startFourthRootPriceRatio_lte?: InputMaybe<Scalars['BigInt']>;
    startFourthRootPriceRatio_not?: InputMaybe<Scalars['BigInt']>;
    startFourthRootPriceRatio_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum ReClammParams_OrderBy {
    CenterednessMargin = 'centerednessMargin',
    CurrentFourthRootPriceRatio = 'currentFourthRootPriceRatio',
    DailyPriceShiftBase = 'dailyPriceShiftBase',
    DailyPriceShiftExponent = 'dailyPriceShiftExponent',
    EndFourthRootPriceRatio = 'endFourthRootPriceRatio',
    Id = 'id',
    LastTimestamp = 'lastTimestamp',
    LastVirtualBalances = 'lastVirtualBalances',
    PriceRatioUpdateEndTime = 'priceRatioUpdateEndTime',
    PriceRatioUpdateStartTime = 'priceRatioUpdateStartTime',
    StartFourthRootPriceRatio = 'startFourthRootPriceRatio',
}

export type StableParams = {
    __typename?: 'StableParams';
    /** Amplification parameter for Stable Pools */
    amp: Scalars['BigInt'];
    /** Unique identifier for the StablePoolParams */
    id: Scalars['Bytes'];
};

export type StableParams_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    amp?: InputMaybe<Scalars['BigInt']>;
    amp_gt?: InputMaybe<Scalars['BigInt']>;
    amp_gte?: InputMaybe<Scalars['BigInt']>;
    amp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    amp_lt?: InputMaybe<Scalars['BigInt']>;
    amp_lte?: InputMaybe<Scalars['BigInt']>;
    amp_not?: InputMaybe<Scalars['BigInt']>;
    amp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    and?: InputMaybe<Array<InputMaybe<StableParams_Filter>>>;
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
    or?: InputMaybe<Array<InputMaybe<StableParams_Filter>>>;
};

export enum StableParams_OrderBy {
    Amp = 'amp',
    Id = 'id',
}

export type StableSurgeParams = {
    __typename?: 'StableSurgeParams';
    /** Amplification parameter */
    amp: Scalars['BigInt'];
    /** Unique identifier for the StableSurgeParams */
    id: Scalars['Bytes'];
    /** Maximum surge fee percentage */
    maxSurgeFeePercentage: Scalars['BigDecimal'];
    /** Surge threshold percentage */
    surgeThresholdPercentage: Scalars['BigDecimal'];
};

export type StableSurgeParams_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    amp?: InputMaybe<Scalars['BigInt']>;
    amp_gt?: InputMaybe<Scalars['BigInt']>;
    amp_gte?: InputMaybe<Scalars['BigInt']>;
    amp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    amp_lt?: InputMaybe<Scalars['BigInt']>;
    amp_lte?: InputMaybe<Scalars['BigInt']>;
    amp_not?: InputMaybe<Scalars['BigInt']>;
    amp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    and?: InputMaybe<Array<InputMaybe<StableSurgeParams_Filter>>>;
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
    maxSurgeFeePercentage?: InputMaybe<Scalars['BigDecimal']>;
    maxSurgeFeePercentage_gt?: InputMaybe<Scalars['BigDecimal']>;
    maxSurgeFeePercentage_gte?: InputMaybe<Scalars['BigDecimal']>;
    maxSurgeFeePercentage_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    maxSurgeFeePercentage_lt?: InputMaybe<Scalars['BigDecimal']>;
    maxSurgeFeePercentage_lte?: InputMaybe<Scalars['BigDecimal']>;
    maxSurgeFeePercentage_not?: InputMaybe<Scalars['BigDecimal']>;
    maxSurgeFeePercentage_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    or?: InputMaybe<Array<InputMaybe<StableSurgeParams_Filter>>>;
    surgeThresholdPercentage?: InputMaybe<Scalars['BigDecimal']>;
    surgeThresholdPercentage_gt?: InputMaybe<Scalars['BigDecimal']>;
    surgeThresholdPercentage_gte?: InputMaybe<Scalars['BigDecimal']>;
    surgeThresholdPercentage_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    surgeThresholdPercentage_lt?: InputMaybe<Scalars['BigDecimal']>;
    surgeThresholdPercentage_lte?: InputMaybe<Scalars['BigDecimal']>;
    surgeThresholdPercentage_not?: InputMaybe<Scalars['BigDecimal']>;
    surgeThresholdPercentage_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum StableSurgeParams_OrderBy {
    Amp = 'amp',
    Id = 'id',
    MaxSurgeFeePercentage = 'maxSurgeFeePercentage',
    SurgeThresholdPercentage = 'surgeThresholdPercentage',
}

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    factories: Array<Factory>;
    factory?: Maybe<Factory>;
    gyro2Params?: Maybe<Gyro2Params>;
    gyro2Params_collection: Array<Gyro2Params>;
    gyroEParams?: Maybe<GyroEParams>;
    gyroEParams_collection: Array<GyroEParams>;
    lbpparams?: Maybe<LbpParams>;
    lbpparams_collection: Array<LbpParams>;
    pool?: Maybe<Pool>;
    pools: Array<Pool>;
    quantAMMWeightedDetail?: Maybe<QuantAmmWeightedDetail>;
    quantAMMWeightedDetails: Array<QuantAmmWeightedDetail>;
    quantAMMWeightedParams?: Maybe<QuantAmmWeightedParams>;
    quantAMMWeightedParams_collection: Array<QuantAmmWeightedParams>;
    reClammParams?: Maybe<ReClammParams>;
    reClammParams_collection: Array<ReClammParams>;
    stableParams?: Maybe<StableParams>;
    stableParams_collection: Array<StableParams>;
    stableSurgeParams?: Maybe<StableSurgeParams>;
    stableSurgeParams_collection: Array<StableSurgeParams>;
    weightedParams?: Maybe<WeightedParams>;
    weightedParams_collection: Array<WeightedParams>;
};

export type Subscription_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type SubscriptionFactoriesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Factory_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Factory_Filter>;
};

export type SubscriptionFactoryArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGyro2ParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGyro2Params_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Gyro2Params_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Gyro2Params_Filter>;
};

export type SubscriptionGyroEParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGyroEParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GyroEParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GyroEParams_Filter>;
};

export type SubscriptionLbpparamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionLbpparams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LbpParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LbpParams_Filter>;
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

export type SubscriptionQuantAmmWeightedDetailArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionQuantAmmWeightedDetailsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<QuantAmmWeightedDetail_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<QuantAmmWeightedDetail_Filter>;
};

export type SubscriptionQuantAmmWeightedParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionQuantAmmWeightedParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<QuantAmmWeightedParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<QuantAmmWeightedParams_Filter>;
};

export type SubscriptionReClammParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionReClammParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<ReClammParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<ReClammParams_Filter>;
};

export type SubscriptionStableParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionStableParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<StableParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<StableParams_Filter>;
};

export type SubscriptionStableSurgeParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionStableSurgeParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<StableSurgeParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<StableSurgeParams_Filter>;
};

export type SubscriptionWeightedParamsArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionWeightedParams_CollectionArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<WeightedParams_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<WeightedParams_Filter>;
};

export type WeightedParams = {
    __typename?: 'WeightedParams';
    /** Unique identifier for the WeightedPoolParams */
    id: Scalars['Bytes'];
    /** Token weights for Weighted Pools */
    weights: Array<Scalars['BigDecimal']>;
};

export type WeightedParams_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<WeightedParams_Filter>>>;
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
    or?: InputMaybe<Array<InputMaybe<WeightedParams_Filter>>>;
    weights?: InputMaybe<Array<Scalars['BigDecimal']>>;
    weights_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    weights_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
    weights_not?: InputMaybe<Array<Scalars['BigDecimal']>>;
    weights_not_contains?: InputMaybe<Array<Scalars['BigDecimal']>>;
    weights_not_contains_nocase?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum WeightedParams_OrderBy {
    Id = 'id',
    Weights = 'weights',
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

export type ChangedPoolsQueryVariables = Exact<{
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    where?: InputMaybe<Pool_Filter>;
}>;

export type ChangedPoolsQuery = { __typename?: 'Query'; pools: Array<{ __typename?: 'Pool'; id: string }> };

export type MetadataQueryVariables = Exact<{ [key: string]: never }>;

export type MetadataQuery = {
    __typename?: 'Query';
    meta?: {
        __typename?: '_Meta_';
        deployment: string;
        hasIndexingErrors: boolean;
        block: { __typename?: '_Block_'; number: number };
    } | null;
};

export type FactoryFragment = {
    __typename?: 'Factory';
    id: string;
    type: PoolType;
    version: number;
    pools?: Array<{ __typename?: 'Pool'; id: string; address: string }> | null;
};

export type TypePoolFragment = {
    __typename?: 'Pool';
    id: string;
    address: string;
    factory: { __typename?: 'Factory'; id: string; type: PoolType; version: number };
    stableParams?: { __typename?: 'StableParams'; amp: string } | null;
    stableSurgeParams?: { __typename?: 'StableSurgeParams'; amp: string } | null;
    weightedParams?: { __typename?: 'WeightedParams'; weights: Array<string> } | null;
    gyro2Params?: { __typename?: 'Gyro2Params'; sqrtAlpha: string; sqrtBeta: string } | null;
    gyroEParams?: {
        __typename?: 'GyroEParams';
        alpha: string;
        beta: string;
        c: string;
        s: string;
        lambda: string;
        tauAlphaX: string;
        tauAlphaY: string;
        tauBetaX: string;
        tauBetaY: string;
        u: string;
        v: string;
        w: string;
        z: string;
        dSq: string;
    } | null;
    quantAMMWeightedParams?: {
        __typename?: 'QuantAMMWeightedParams';
        oracleStalenessThreshold: string;
        poolRegistry: string;
        lambda: Array<string>;
        epsilonMax: string;
        absoluteWeightGuardRail: string;
        maxTradeSizeRatio: string;
        updateInterval: string;
        weightsAtLastUpdateInterval: Array<string>;
        weightBlockMultipliers: Array<string>;
        lastUpdateIntervalTime: string;
        lastInterpolationTimePossible: string;
        details: Array<{
            __typename?: 'QuantAMMWeightedDetail';
            id: string;
            category: string;
            name: string;
            type: string;
            value: string;
        }>;
    } | null;
    lbpParams?: {
        __typename?: 'LBPParams';
        startTime: string;
        endTime: string;
        owner: string;
        isProjectTokenSwapInBlocked: boolean;
        reserveToken: string;
        reserveTokenStartWeight: string;
        reserveTokenEndWeight: string;
        projectToken: string;
        projectTokenStartWeight: string;
        projectTokenEndWeight: string;
    } | null;
    reClammParams?: {
        __typename?: 'ReClammParams';
        lastTimestamp: string;
        lastVirtualBalances: Array<string>;
        dailyPriceShiftBase: string;
        centerednessMargin: string;
        currentFourthRootPriceRatio: string;
        startFourthRootPriceRatio: string;
        endFourthRootPriceRatio: string;
        priceRatioUpdateStartTime: string;
        priceRatioUpdateEndTime: string;
    } | null;
};

export type PoolsQueryVariables = Exact<{
    skip?: InputMaybe<Scalars['Int']>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Pool_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    where?: InputMaybe<Pool_Filter>;
    block?: InputMaybe<Block_Height>;
}>;

export type PoolsQuery = {
    __typename?: 'Query';
    pools: Array<{
        __typename?: 'Pool';
        id: string;
        address: string;
        factory: { __typename?: 'Factory'; id: string; type: PoolType; version: number };
        stableParams?: { __typename?: 'StableParams'; amp: string } | null;
        stableSurgeParams?: { __typename?: 'StableSurgeParams'; amp: string } | null;
        weightedParams?: { __typename?: 'WeightedParams'; weights: Array<string> } | null;
        gyro2Params?: { __typename?: 'Gyro2Params'; sqrtAlpha: string; sqrtBeta: string } | null;
        gyroEParams?: {
            __typename?: 'GyroEParams';
            alpha: string;
            beta: string;
            c: string;
            s: string;
            lambda: string;
            tauAlphaX: string;
            tauAlphaY: string;
            tauBetaX: string;
            tauBetaY: string;
            u: string;
            v: string;
            w: string;
            z: string;
            dSq: string;
        } | null;
        quantAMMWeightedParams?: {
            __typename?: 'QuantAMMWeightedParams';
            oracleStalenessThreshold: string;
            poolRegistry: string;
            lambda: Array<string>;
            epsilonMax: string;
            absoluteWeightGuardRail: string;
            maxTradeSizeRatio: string;
            updateInterval: string;
            weightsAtLastUpdateInterval: Array<string>;
            weightBlockMultipliers: Array<string>;
            lastUpdateIntervalTime: string;
            lastInterpolationTimePossible: string;
            details: Array<{
                __typename?: 'QuantAMMWeightedDetail';
                id: string;
                category: string;
                name: string;
                type: string;
                value: string;
            }>;
        } | null;
        lbpParams?: {
            __typename?: 'LBPParams';
            startTime: string;
            endTime: string;
            owner: string;
            isProjectTokenSwapInBlocked: boolean;
            reserveToken: string;
            reserveTokenStartWeight: string;
            reserveTokenEndWeight: string;
            projectToken: string;
            projectTokenStartWeight: string;
            projectTokenEndWeight: string;
        } | null;
        reClammParams?: {
            __typename?: 'ReClammParams';
            lastTimestamp: string;
            lastVirtualBalances: Array<string>;
            dailyPriceShiftBase: string;
            centerednessMargin: string;
            currentFourthRootPriceRatio: string;
            startFourthRootPriceRatio: string;
            endFourthRootPriceRatio: string;
            priceRatioUpdateStartTime: string;
            priceRatioUpdateEndTime: string;
        } | null;
    }>;
};

export const FactoryFragmentDoc = gql`
    fragment Factory on Factory {
        id
        type
        version
        pools {
            id
            address
        }
    }
`;
export const TypePoolFragmentDoc = gql`
    fragment TypePool on Pool {
        id
        address
        factory {
            id
            type
            version
        }
        stableParams {
            amp
        }
        stableSurgeParams {
            amp
        }
        weightedParams {
            weights
        }
        gyro2Params {
            sqrtAlpha
            sqrtBeta
        }
        gyroEParams {
            alpha
            beta
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
        }
        quantAMMWeightedParams {
            oracleStalenessThreshold
            poolRegistry
            lambda
            epsilonMax
            absoluteWeightGuardRail
            maxTradeSizeRatio
            updateInterval
            weightsAtLastUpdateInterval
            weightBlockMultipliers
            lastUpdateIntervalTime
            lastInterpolationTimePossible
            details {
                id
                category
                name
                type
                value
            }
        }
        lbpParams {
            startTime
            endTime
            owner
            isProjectTokenSwapInBlocked
            reserveToken
            reserveTokenStartWeight
            reserveTokenEndWeight
            projectToken
            projectTokenStartWeight
            projectTokenEndWeight
        }
        reClammParams {
            lastTimestamp
            lastVirtualBalances
            dailyPriceShiftBase
            centerednessMargin
            currentFourthRootPriceRatio
            startFourthRootPriceRatio
            endFourthRootPriceRatio
            priceRatioUpdateStartTime
            priceRatioUpdateEndTime
        }
    }
`;
export const ChangedPoolsDocument = gql`
    query ChangedPools($first: Int, $orderBy: Pool_orderBy, $orderDirection: OrderDirection, $where: Pool_filter) {
        pools(first: $first, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
            id
        }
    }
`;
export const MetadataDocument = gql`
    query Metadata {
        meta: _meta {
            block {
                number
            }
            deployment
            hasIndexingErrors
        }
    }
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
            ...TypePool
        }
    }
    ${TypePoolFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
    operationType?: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        ChangedPools(
            variables?: ChangedPoolsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<ChangedPoolsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<ChangedPoolsQuery>(ChangedPoolsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'ChangedPools',
                'query',
            );
        },
        Metadata(
            variables?: MetadataQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<MetadataQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<MetadataQuery>(MetadataDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'Metadata',
                'query',
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
                'query',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
