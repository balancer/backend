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
    day = 'day',
    hour = 'hour',
}

export type BlockChangedFilter = {
    number_gte: Scalars['Int'];
};

export type Block_Height = {
    hash?: InputMaybe<Scalars['Bytes']>;
    number?: InputMaybe<Scalars['Int']>;
    number_gte?: InputMaybe<Scalars['Int']>;
};

export enum Chain {
    Arbitrum = 'Arbitrum',
    Avalanche = 'Avalanche',
    Base = 'Base',
    Fraxtal = 'Fraxtal',
    Gnosis = 'Gnosis',
    Optimism = 'Optimism',
    Polygon = 'Polygon',
    PolygonZkEvm = 'PolygonZkEvm',
}

export type Gauge = {
    __typename?: 'Gauge';
    /**  Timestamp at which Balancer DAO added the gauge to GaugeController [seconds]  */
    addedTimestamp: Scalars['Int'];
    /**  Address of the gauge  */
    address: Scalars['Bytes'];
    /**  Equal to: <gaugeAddress>-<typeID>  */
    id: Scalars['ID'];
    /**  Reference to LiquidityGauge  */
    liquidityGauge?: Maybe<LiquidityGauge>;
    /**  Reference to RootGauge  */
    rootGauge?: Maybe<RootGauge>;
    /**  Type of the gauge  */
    type: GaugeType;
};

export type GaugeFactory = {
    __typename?: 'GaugeFactory';
    /**  List of gauges created through the factory  */
    gauges?: Maybe<Array<LiquidityGauge>>;
    /**  Factory contract address  */
    id: Scalars['ID'];
    /**  Number of gauges created through the factory  */
    numGauges: Scalars['Int'];
};

export type GaugeFactoryGaugesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LiquidityGauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<LiquidityGauge_Filter>;
};

export type GaugeFactory_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<GaugeFactory_Filter>>>;
    gauges_?: InputMaybe<LiquidityGauge_Filter>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    numGauges?: InputMaybe<Scalars['Int']>;
    numGauges_gt?: InputMaybe<Scalars['Int']>;
    numGauges_gte?: InputMaybe<Scalars['Int']>;
    numGauges_in?: InputMaybe<Array<Scalars['Int']>>;
    numGauges_lt?: InputMaybe<Scalars['Int']>;
    numGauges_lte?: InputMaybe<Scalars['Int']>;
    numGauges_not?: InputMaybe<Scalars['Int']>;
    numGauges_not_in?: InputMaybe<Array<Scalars['Int']>>;
    or?: InputMaybe<Array<InputMaybe<GaugeFactory_Filter>>>;
};

export enum GaugeFactory_OrderBy {
    gauges = 'gauges',
    id = 'id',
    numGauges = 'numGauges',
}

export type GaugeInjector = {
    __typename?: 'GaugeInjector';
    /**  GaugeInjector contract address  */
    id: Scalars['ID'];
};

export type GaugeInjector_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<GaugeInjector_Filter>>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<GaugeInjector_Filter>>>;
};

export enum GaugeInjector_OrderBy {
    id = 'id',
}

export type GaugeShare = {
    __typename?: 'GaugeShare';
    /**  User's balance of gauge deposit tokens  */
    balance: Scalars['BigDecimal'];
    /**  Reference to LiquidityGauge entity  */
    gauge: LiquidityGauge;
    /**  Equal to: <userAddress>-<gaugeAddress>  */
    id: Scalars['ID'];
    /**  Reference to User entity  */
    user: User;
};

export type GaugeShare_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<GaugeShare_Filter>>>;
    balance?: InputMaybe<Scalars['BigDecimal']>;
    balance_gt?: InputMaybe<Scalars['BigDecimal']>;
    balance_gte?: InputMaybe<Scalars['BigDecimal']>;
    balance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    balance_lt?: InputMaybe<Scalars['BigDecimal']>;
    balance_lte?: InputMaybe<Scalars['BigDecimal']>;
    balance_not?: InputMaybe<Scalars['BigDecimal']>;
    balance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    gauge?: InputMaybe<Scalars['String']>;
    gauge_?: InputMaybe<LiquidityGauge_Filter>;
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
    or?: InputMaybe<Array<InputMaybe<GaugeShare_Filter>>>;
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

export enum GaugeShare_OrderBy {
    balance = 'balance',
    gauge = 'gauge',
    gauge__id = 'gauge__id',
    gauge__isKilled = 'gauge__isKilled',
    gauge__isPreferentialGauge = 'gauge__isPreferentialGauge',
    gauge__poolAddress = 'gauge__poolAddress',
    gauge__poolId = 'gauge__poolId',
    gauge__relativeWeightCap = 'gauge__relativeWeightCap',
    gauge__streamer = 'gauge__streamer',
    gauge__symbol = 'gauge__symbol',
    gauge__totalSupply = 'gauge__totalSupply',
    id = 'id',
    user = 'user',
    user__id = 'user__id',
}

export type GaugeType = {
    __typename?: 'GaugeType';
    /**  Type ID  */
    id: Scalars['ID'];
    /**  Name of the type - empty string if call reverts  */
    name: Scalars['String'];
};

export type GaugeType_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<GaugeType_Filter>>>;
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
    or?: InputMaybe<Array<InputMaybe<GaugeType_Filter>>>;
};

export enum GaugeType_OrderBy {
    id = 'id',
    name = 'name',
}

export type GaugeVote = {
    __typename?: 'GaugeVote';
    /**  Reference to Gauge entity  */
    gauge: Gauge;
    /**  Equal to: <userAddress>-<gaugeAddress>  */
    id: Scalars['ID'];
    /**  Timestamp at which user voted [seconds]  */
    timestamp?: Maybe<Scalars['BigInt']>;
    /**  Reference to User entity  */
    user: User;
    /**  Weight of veBAL power user has used to vote  */
    weight?: Maybe<Scalars['BigDecimal']>;
};

export type GaugeVote_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<GaugeVote_Filter>>>;
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
    or?: InputMaybe<Array<InputMaybe<GaugeVote_Filter>>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
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
    weight?: InputMaybe<Scalars['BigDecimal']>;
    weight_gt?: InputMaybe<Scalars['BigDecimal']>;
    weight_gte?: InputMaybe<Scalars['BigDecimal']>;
    weight_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    weight_lt?: InputMaybe<Scalars['BigDecimal']>;
    weight_lte?: InputMaybe<Scalars['BigDecimal']>;
    weight_not?: InputMaybe<Scalars['BigDecimal']>;
    weight_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum GaugeVote_OrderBy {
    gauge = 'gauge',
    gauge__addedTimestamp = 'gauge__addedTimestamp',
    gauge__address = 'gauge__address',
    gauge__id = 'gauge__id',
    id = 'id',
    timestamp = 'timestamp',
    user = 'user',
    user__id = 'user__id',
    weight = 'weight',
}

export type Gauge_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    addedTimestamp?: InputMaybe<Scalars['Int']>;
    addedTimestamp_gt?: InputMaybe<Scalars['Int']>;
    addedTimestamp_gte?: InputMaybe<Scalars['Int']>;
    addedTimestamp_in?: InputMaybe<Array<Scalars['Int']>>;
    addedTimestamp_lt?: InputMaybe<Scalars['Int']>;
    addedTimestamp_lte?: InputMaybe<Scalars['Int']>;
    addedTimestamp_not?: InputMaybe<Scalars['Int']>;
    addedTimestamp_not_in?: InputMaybe<Array<Scalars['Int']>>;
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
    and?: InputMaybe<Array<InputMaybe<Gauge_Filter>>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    liquidityGauge?: InputMaybe<Scalars['String']>;
    liquidityGauge_?: InputMaybe<LiquidityGauge_Filter>;
    liquidityGauge_contains?: InputMaybe<Scalars['String']>;
    liquidityGauge_contains_nocase?: InputMaybe<Scalars['String']>;
    liquidityGauge_ends_with?: InputMaybe<Scalars['String']>;
    liquidityGauge_ends_with_nocase?: InputMaybe<Scalars['String']>;
    liquidityGauge_gt?: InputMaybe<Scalars['String']>;
    liquidityGauge_gte?: InputMaybe<Scalars['String']>;
    liquidityGauge_in?: InputMaybe<Array<Scalars['String']>>;
    liquidityGauge_lt?: InputMaybe<Scalars['String']>;
    liquidityGauge_lte?: InputMaybe<Scalars['String']>;
    liquidityGauge_not?: InputMaybe<Scalars['String']>;
    liquidityGauge_not_contains?: InputMaybe<Scalars['String']>;
    liquidityGauge_not_contains_nocase?: InputMaybe<Scalars['String']>;
    liquidityGauge_not_ends_with?: InputMaybe<Scalars['String']>;
    liquidityGauge_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    liquidityGauge_not_in?: InputMaybe<Array<Scalars['String']>>;
    liquidityGauge_not_starts_with?: InputMaybe<Scalars['String']>;
    liquidityGauge_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    liquidityGauge_starts_with?: InputMaybe<Scalars['String']>;
    liquidityGauge_starts_with_nocase?: InputMaybe<Scalars['String']>;
    or?: InputMaybe<Array<InputMaybe<Gauge_Filter>>>;
    rootGauge?: InputMaybe<Scalars['String']>;
    rootGauge_?: InputMaybe<RootGauge_Filter>;
    rootGauge_contains?: InputMaybe<Scalars['String']>;
    rootGauge_contains_nocase?: InputMaybe<Scalars['String']>;
    rootGauge_ends_with?: InputMaybe<Scalars['String']>;
    rootGauge_ends_with_nocase?: InputMaybe<Scalars['String']>;
    rootGauge_gt?: InputMaybe<Scalars['String']>;
    rootGauge_gte?: InputMaybe<Scalars['String']>;
    rootGauge_in?: InputMaybe<Array<Scalars['String']>>;
    rootGauge_lt?: InputMaybe<Scalars['String']>;
    rootGauge_lte?: InputMaybe<Scalars['String']>;
    rootGauge_not?: InputMaybe<Scalars['String']>;
    rootGauge_not_contains?: InputMaybe<Scalars['String']>;
    rootGauge_not_contains_nocase?: InputMaybe<Scalars['String']>;
    rootGauge_not_ends_with?: InputMaybe<Scalars['String']>;
    rootGauge_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    rootGauge_not_in?: InputMaybe<Array<Scalars['String']>>;
    rootGauge_not_starts_with?: InputMaybe<Scalars['String']>;
    rootGauge_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    rootGauge_starts_with?: InputMaybe<Scalars['String']>;
    rootGauge_starts_with_nocase?: InputMaybe<Scalars['String']>;
    type?: InputMaybe<Scalars['String']>;
    type_?: InputMaybe<GaugeType_Filter>;
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
};

export enum Gauge_OrderBy {
    addedTimestamp = 'addedTimestamp',
    address = 'address',
    id = 'id',
    liquidityGauge = 'liquidityGauge',
    liquidityGauge__id = 'liquidityGauge__id',
    liquidityGauge__isKilled = 'liquidityGauge__isKilled',
    liquidityGauge__isPreferentialGauge = 'liquidityGauge__isPreferentialGauge',
    liquidityGauge__poolAddress = 'liquidityGauge__poolAddress',
    liquidityGauge__poolId = 'liquidityGauge__poolId',
    liquidityGauge__relativeWeightCap = 'liquidityGauge__relativeWeightCap',
    liquidityGauge__streamer = 'liquidityGauge__streamer',
    liquidityGauge__symbol = 'liquidityGauge__symbol',
    liquidityGauge__totalSupply = 'liquidityGauge__totalSupply',
    rootGauge = 'rootGauge',
    rootGauge__chain = 'rootGauge__chain',
    rootGauge__id = 'rootGauge__id',
    rootGauge__isKilled = 'rootGauge__isKilled',
    rootGauge__recipient = 'rootGauge__recipient',
    rootGauge__relativeWeightCap = 'rootGauge__relativeWeightCap',
    type = 'type',
    type__id = 'type__id',
    type__name = 'type__name',
}

export type LiquidityGauge = {
    __typename?: 'LiquidityGauge';
    /**  Factory contract address  */
    factory: GaugeFactory;
    /**  Reference to Gauge entity - created when LiquidityGauge is added to GaugeController */
    gauge?: Maybe<Gauge>;
    /**  LiquidityGauge contract address  */
    id: Scalars['ID'];
    /**  Whether Balancer DAO killed the gauge  */
    isKilled: Scalars['Boolean'];
    /**  Whether the LiquidityGauge is the most recent added to GaugeController  */
    isPreferentialGauge: Scalars['Boolean'];
    /**  Reference to Pool entity  */
    pool?: Maybe<Pool>;
    /**  Address of the pool (lp_token of the gauge)  */
    poolAddress: Scalars['Bytes'];
    /**  Pool ID if lp_token is a Balancer pool; null otherwise  */
    poolId?: Maybe<Scalars['Bytes']>;
    /**  Relative weight cap of the gauge (0.01 = 1%) - V2 factories only  */
    relativeWeightCap?: Maybe<Scalars['BigDecimal']>;
    /**  List of reward tokens depositted in the gauge - ChildChainLiquidityGauge only  */
    rewardTokensList?: Maybe<Array<Scalars['Bytes']>>;
    /**  List of user shares  */
    shares?: Maybe<Array<GaugeShare>>;
    /**  Address of the contract that streams reward tokens to the gauge - ChildChainLiquidityGauge only  */
    streamer?: Maybe<Scalars['Bytes']>;
    /**  ERC20 token symbol  */
    symbol: Scalars['String'];
    /**  List of reward tokens depositted in the gauge  */
    tokens?: Maybe<Array<RewardToken>>;
    /**  Total of BPTs users have staked in the LiquidityGauge  */
    totalSupply: Scalars['BigDecimal'];
};

export type LiquidityGaugeSharesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<GaugeShare_Filter>;
};

export type LiquidityGaugeTokensArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RewardToken_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<RewardToken_Filter>;
};

export type LiquidityGauge_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<LiquidityGauge_Filter>>>;
    factory?: InputMaybe<Scalars['String']>;
    factory_?: InputMaybe<GaugeFactory_Filter>;
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
    isKilled?: InputMaybe<Scalars['Boolean']>;
    isKilled_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isKilled_not?: InputMaybe<Scalars['Boolean']>;
    isKilled_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isPreferentialGauge?: InputMaybe<Scalars['Boolean']>;
    isPreferentialGauge_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isPreferentialGauge_not?: InputMaybe<Scalars['Boolean']>;
    isPreferentialGauge_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    or?: InputMaybe<Array<InputMaybe<LiquidityGauge_Filter>>>;
    pool?: InputMaybe<Scalars['String']>;
    poolAddress?: InputMaybe<Scalars['Bytes']>;
    poolAddress_contains?: InputMaybe<Scalars['Bytes']>;
    poolAddress_gt?: InputMaybe<Scalars['Bytes']>;
    poolAddress_gte?: InputMaybe<Scalars['Bytes']>;
    poolAddress_in?: InputMaybe<Array<Scalars['Bytes']>>;
    poolAddress_lt?: InputMaybe<Scalars['Bytes']>;
    poolAddress_lte?: InputMaybe<Scalars['Bytes']>;
    poolAddress_not?: InputMaybe<Scalars['Bytes']>;
    poolAddress_not_contains?: InputMaybe<Scalars['Bytes']>;
    poolAddress_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    poolId?: InputMaybe<Scalars['Bytes']>;
    poolId_contains?: InputMaybe<Scalars['Bytes']>;
    poolId_gt?: InputMaybe<Scalars['Bytes']>;
    poolId_gte?: InputMaybe<Scalars['Bytes']>;
    poolId_in?: InputMaybe<Array<Scalars['Bytes']>>;
    poolId_lt?: InputMaybe<Scalars['Bytes']>;
    poolId_lte?: InputMaybe<Scalars['Bytes']>;
    poolId_not?: InputMaybe<Scalars['Bytes']>;
    poolId_not_contains?: InputMaybe<Scalars['Bytes']>;
    poolId_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
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
    relativeWeightCap?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_gt?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_gte?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    relativeWeightCap_lt?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_lte?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_not?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    rewardTokensList?: InputMaybe<Array<Scalars['Bytes']>>;
    rewardTokensList_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    rewardTokensList_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    rewardTokensList_not?: InputMaybe<Array<Scalars['Bytes']>>;
    rewardTokensList_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    rewardTokensList_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    shares_?: InputMaybe<GaugeShare_Filter>;
    streamer?: InputMaybe<Scalars['Bytes']>;
    streamer_contains?: InputMaybe<Scalars['Bytes']>;
    streamer_gt?: InputMaybe<Scalars['Bytes']>;
    streamer_gte?: InputMaybe<Scalars['Bytes']>;
    streamer_in?: InputMaybe<Array<Scalars['Bytes']>>;
    streamer_lt?: InputMaybe<Scalars['Bytes']>;
    streamer_lte?: InputMaybe<Scalars['Bytes']>;
    streamer_not?: InputMaybe<Scalars['Bytes']>;
    streamer_not_contains?: InputMaybe<Scalars['Bytes']>;
    streamer_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
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
    tokens_?: InputMaybe<RewardToken_Filter>;
    totalSupply?: InputMaybe<Scalars['BigDecimal']>;
    totalSupply_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalSupply_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalSupply_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalSupply_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalSupply_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalSupply_not?: InputMaybe<Scalars['BigDecimal']>;
    totalSupply_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum LiquidityGauge_OrderBy {
    factory = 'factory',
    factory__id = 'factory__id',
    factory__numGauges = 'factory__numGauges',
    gauge = 'gauge',
    gauge__addedTimestamp = 'gauge__addedTimestamp',
    gauge__address = 'gauge__address',
    gauge__id = 'gauge__id',
    id = 'id',
    isKilled = 'isKilled',
    isPreferentialGauge = 'isPreferentialGauge',
    pool = 'pool',
    poolAddress = 'poolAddress',
    poolId = 'poolId',
    pool__address = 'pool__address',
    pool__id = 'pool__id',
    pool__poolId = 'pool__poolId',
    relativeWeightCap = 'relativeWeightCap',
    rewardTokensList = 'rewardTokensList',
    shares = 'shares',
    streamer = 'streamer',
    symbol = 'symbol',
    tokens = 'tokens',
    totalSupply = 'totalSupply',
}

export type LockSnapshot = {
    __typename?: 'LockSnapshot';
    /**  veBAL balance at the moment user locks  */
    bias: Scalars['BigDecimal'];
    /**  Equal to <userAddress>-<timestamp>  */
    id: Scalars['ID'];
    /**  veBAL decay rate (per second)  */
    slope: Scalars['BigDecimal'];
    /**  Timestamp at which the snapshot was taken [seconds]  */
    timestamp: Scalars['Int'];
    /**  Reference to User entity  */
    user: User;
};

export type LockSnapshot_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<LockSnapshot_Filter>>>;
    bias?: InputMaybe<Scalars['BigDecimal']>;
    bias_gt?: InputMaybe<Scalars['BigDecimal']>;
    bias_gte?: InputMaybe<Scalars['BigDecimal']>;
    bias_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    bias_lt?: InputMaybe<Scalars['BigDecimal']>;
    bias_lte?: InputMaybe<Scalars['BigDecimal']>;
    bias_not?: InputMaybe<Scalars['BigDecimal']>;
    bias_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<LockSnapshot_Filter>>>;
    slope?: InputMaybe<Scalars['BigDecimal']>;
    slope_gt?: InputMaybe<Scalars['BigDecimal']>;
    slope_gte?: InputMaybe<Scalars['BigDecimal']>;
    slope_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    slope_lt?: InputMaybe<Scalars['BigDecimal']>;
    slope_lte?: InputMaybe<Scalars['BigDecimal']>;
    slope_not?: InputMaybe<Scalars['BigDecimal']>;
    slope_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
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
};

export enum LockSnapshot_OrderBy {
    bias = 'bias',
    id = 'id',
    slope = 'slope',
    timestamp = 'timestamp',
    user = 'user',
    user__id = 'user__id',
}

export type OmniVotingEscrowLock = {
    __typename?: 'OmniVotingEscrowLock';
    /**  veBAL balance at the moment user locks  */
    bias: Scalars['BigDecimal'];
    /**  Chain where the lock was bridged to  */
    dstChainId: Scalars['Int'];
    /**  Equal to: <userAdress>-<omniVotingEscrow>  */
    id: Scalars['ID'];
    /**  User on the local chain (reference to User entity)  */
    localUser: User;
    /**  User address on the remote chain  */
    remoteUser: Scalars['Bytes'];
    /**  veBAL decay rate (per second)  */
    slope: Scalars['BigDecimal'];
    /**  Timestamp the lock was created [seconds]  */
    timestamp: Scalars['Int'];
    /**  Reference to VotingEscrow entity  */
    votingEscrowID: VotingEscrow;
};

export type OmniVotingEscrowLock_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<OmniVotingEscrowLock_Filter>>>;
    bias?: InputMaybe<Scalars['BigDecimal']>;
    bias_gt?: InputMaybe<Scalars['BigDecimal']>;
    bias_gte?: InputMaybe<Scalars['BigDecimal']>;
    bias_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    bias_lt?: InputMaybe<Scalars['BigDecimal']>;
    bias_lte?: InputMaybe<Scalars['BigDecimal']>;
    bias_not?: InputMaybe<Scalars['BigDecimal']>;
    bias_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    dstChainId?: InputMaybe<Scalars['Int']>;
    dstChainId_gt?: InputMaybe<Scalars['Int']>;
    dstChainId_gte?: InputMaybe<Scalars['Int']>;
    dstChainId_in?: InputMaybe<Array<Scalars['Int']>>;
    dstChainId_lt?: InputMaybe<Scalars['Int']>;
    dstChainId_lte?: InputMaybe<Scalars['Int']>;
    dstChainId_not?: InputMaybe<Scalars['Int']>;
    dstChainId_not_in?: InputMaybe<Array<Scalars['Int']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    localUser?: InputMaybe<Scalars['String']>;
    localUser_?: InputMaybe<User_Filter>;
    localUser_contains?: InputMaybe<Scalars['String']>;
    localUser_contains_nocase?: InputMaybe<Scalars['String']>;
    localUser_ends_with?: InputMaybe<Scalars['String']>;
    localUser_ends_with_nocase?: InputMaybe<Scalars['String']>;
    localUser_gt?: InputMaybe<Scalars['String']>;
    localUser_gte?: InputMaybe<Scalars['String']>;
    localUser_in?: InputMaybe<Array<Scalars['String']>>;
    localUser_lt?: InputMaybe<Scalars['String']>;
    localUser_lte?: InputMaybe<Scalars['String']>;
    localUser_not?: InputMaybe<Scalars['String']>;
    localUser_not_contains?: InputMaybe<Scalars['String']>;
    localUser_not_contains_nocase?: InputMaybe<Scalars['String']>;
    localUser_not_ends_with?: InputMaybe<Scalars['String']>;
    localUser_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    localUser_not_in?: InputMaybe<Array<Scalars['String']>>;
    localUser_not_starts_with?: InputMaybe<Scalars['String']>;
    localUser_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    localUser_starts_with?: InputMaybe<Scalars['String']>;
    localUser_starts_with_nocase?: InputMaybe<Scalars['String']>;
    or?: InputMaybe<Array<InputMaybe<OmniVotingEscrowLock_Filter>>>;
    remoteUser?: InputMaybe<Scalars['Bytes']>;
    remoteUser_contains?: InputMaybe<Scalars['Bytes']>;
    remoteUser_gt?: InputMaybe<Scalars['Bytes']>;
    remoteUser_gte?: InputMaybe<Scalars['Bytes']>;
    remoteUser_in?: InputMaybe<Array<Scalars['Bytes']>>;
    remoteUser_lt?: InputMaybe<Scalars['Bytes']>;
    remoteUser_lte?: InputMaybe<Scalars['Bytes']>;
    remoteUser_not?: InputMaybe<Scalars['Bytes']>;
    remoteUser_not_contains?: InputMaybe<Scalars['Bytes']>;
    remoteUser_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    slope?: InputMaybe<Scalars['BigDecimal']>;
    slope_gt?: InputMaybe<Scalars['BigDecimal']>;
    slope_gte?: InputMaybe<Scalars['BigDecimal']>;
    slope_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    slope_lt?: InputMaybe<Scalars['BigDecimal']>;
    slope_lte?: InputMaybe<Scalars['BigDecimal']>;
    slope_not?: InputMaybe<Scalars['BigDecimal']>;
    slope_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    timestamp?: InputMaybe<Scalars['Int']>;
    timestamp_gt?: InputMaybe<Scalars['Int']>;
    timestamp_gte?: InputMaybe<Scalars['Int']>;
    timestamp_in?: InputMaybe<Array<Scalars['Int']>>;
    timestamp_lt?: InputMaybe<Scalars['Int']>;
    timestamp_lte?: InputMaybe<Scalars['Int']>;
    timestamp_not?: InputMaybe<Scalars['Int']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['Int']>>;
    votingEscrowID?: InputMaybe<Scalars['String']>;
    votingEscrowID_?: InputMaybe<VotingEscrow_Filter>;
    votingEscrowID_contains?: InputMaybe<Scalars['String']>;
    votingEscrowID_contains_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_ends_with?: InputMaybe<Scalars['String']>;
    votingEscrowID_ends_with_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_gt?: InputMaybe<Scalars['String']>;
    votingEscrowID_gte?: InputMaybe<Scalars['String']>;
    votingEscrowID_in?: InputMaybe<Array<Scalars['String']>>;
    votingEscrowID_lt?: InputMaybe<Scalars['String']>;
    votingEscrowID_lte?: InputMaybe<Scalars['String']>;
    votingEscrowID_not?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_contains?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_contains_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_ends_with?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_in?: InputMaybe<Array<Scalars['String']>>;
    votingEscrowID_not_starts_with?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_starts_with?: InputMaybe<Scalars['String']>;
    votingEscrowID_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum OmniVotingEscrowLock_OrderBy {
    bias = 'bias',
    dstChainId = 'dstChainId',
    id = 'id',
    localUser = 'localUser',
    localUser__id = 'localUser__id',
    remoteUser = 'remoteUser',
    slope = 'slope',
    timestamp = 'timestamp',
    votingEscrowID = 'votingEscrowID',
    votingEscrowID__id = 'votingEscrowID__id',
    votingEscrowID__stakedSupply = 'votingEscrowID__stakedSupply',
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
    asc = 'asc',
    desc = 'desc',
}

export type Pool = {
    __typename?: 'Pool';
    /**  Address of the pool (lp_token of the gauge)  */
    address: Scalars['Bytes'];
    /**  List of gauges created for the pool  */
    gauges?: Maybe<Array<LiquidityGauge>>;
    /**  List of the pool's gauges addresses  */
    gaugesList: Array<Scalars['Bytes']>;
    /**  Address of the pool (lp_token of the gauge)  */
    id: Scalars['ID'];
    /**  Pool ID if lp_token is a Balancer pool; null otherwise  */
    poolId?: Maybe<Scalars['Bytes']>;
    /**  Most recent, unkilled gauge in the GaugeController  */
    preferentialGauge?: Maybe<LiquidityGauge>;
};

export type PoolGaugesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LiquidityGauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<LiquidityGauge_Filter>;
};

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
    gaugesList?: InputMaybe<Array<Scalars['Bytes']>>;
    gaugesList_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    gaugesList_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    gaugesList_not?: InputMaybe<Array<Scalars['Bytes']>>;
    gaugesList_not_contains?: InputMaybe<Array<Scalars['Bytes']>>;
    gaugesList_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']>>;
    gauges_?: InputMaybe<LiquidityGauge_Filter>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    or?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
    poolId?: InputMaybe<Scalars['Bytes']>;
    poolId_contains?: InputMaybe<Scalars['Bytes']>;
    poolId_gt?: InputMaybe<Scalars['Bytes']>;
    poolId_gte?: InputMaybe<Scalars['Bytes']>;
    poolId_in?: InputMaybe<Array<Scalars['Bytes']>>;
    poolId_lt?: InputMaybe<Scalars['Bytes']>;
    poolId_lte?: InputMaybe<Scalars['Bytes']>;
    poolId_not?: InputMaybe<Scalars['Bytes']>;
    poolId_not_contains?: InputMaybe<Scalars['Bytes']>;
    poolId_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    preferentialGauge?: InputMaybe<Scalars['String']>;
    preferentialGauge_?: InputMaybe<LiquidityGauge_Filter>;
    preferentialGauge_contains?: InputMaybe<Scalars['String']>;
    preferentialGauge_contains_nocase?: InputMaybe<Scalars['String']>;
    preferentialGauge_ends_with?: InputMaybe<Scalars['String']>;
    preferentialGauge_ends_with_nocase?: InputMaybe<Scalars['String']>;
    preferentialGauge_gt?: InputMaybe<Scalars['String']>;
    preferentialGauge_gte?: InputMaybe<Scalars['String']>;
    preferentialGauge_in?: InputMaybe<Array<Scalars['String']>>;
    preferentialGauge_lt?: InputMaybe<Scalars['String']>;
    preferentialGauge_lte?: InputMaybe<Scalars['String']>;
    preferentialGauge_not?: InputMaybe<Scalars['String']>;
    preferentialGauge_not_contains?: InputMaybe<Scalars['String']>;
    preferentialGauge_not_contains_nocase?: InputMaybe<Scalars['String']>;
    preferentialGauge_not_ends_with?: InputMaybe<Scalars['String']>;
    preferentialGauge_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    preferentialGauge_not_in?: InputMaybe<Array<Scalars['String']>>;
    preferentialGauge_not_starts_with?: InputMaybe<Scalars['String']>;
    preferentialGauge_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    preferentialGauge_starts_with?: InputMaybe<Scalars['String']>;
    preferentialGauge_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Pool_OrderBy {
    address = 'address',
    gauges = 'gauges',
    gaugesList = 'gaugesList',
    id = 'id',
    poolId = 'poolId',
    preferentialGauge = 'preferentialGauge',
    preferentialGauge__id = 'preferentialGauge__id',
    preferentialGauge__isKilled = 'preferentialGauge__isKilled',
    preferentialGauge__isPreferentialGauge = 'preferentialGauge__isPreferentialGauge',
    preferentialGauge__poolAddress = 'preferentialGauge__poolAddress',
    preferentialGauge__poolId = 'preferentialGauge__poolId',
    preferentialGauge__relativeWeightCap = 'preferentialGauge__relativeWeightCap',
    preferentialGauge__streamer = 'preferentialGauge__streamer',
    preferentialGauge__symbol = 'preferentialGauge__symbol',
    preferentialGauge__totalSupply = 'preferentialGauge__totalSupply',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    gauge?: Maybe<Gauge>;
    gaugeFactories: Array<GaugeFactory>;
    gaugeFactory?: Maybe<GaugeFactory>;
    gaugeInjector?: Maybe<GaugeInjector>;
    gaugeInjectors: Array<GaugeInjector>;
    gaugeShare?: Maybe<GaugeShare>;
    gaugeShares: Array<GaugeShare>;
    gaugeType?: Maybe<GaugeType>;
    gaugeTypes: Array<GaugeType>;
    gaugeVote?: Maybe<GaugeVote>;
    gaugeVotes: Array<GaugeVote>;
    gauges: Array<Gauge>;
    liquidityGauge?: Maybe<LiquidityGauge>;
    liquidityGauges: Array<LiquidityGauge>;
    lockSnapshot?: Maybe<LockSnapshot>;
    lockSnapshots: Array<LockSnapshot>;
    omniVotingEscrowLock?: Maybe<OmniVotingEscrowLock>;
    omniVotingEscrowLocks: Array<OmniVotingEscrowLock>;
    pool?: Maybe<Pool>;
    pools: Array<Pool>;
    rewardToken?: Maybe<RewardToken>;
    rewardTokens: Array<RewardToken>;
    rootGauge?: Maybe<RootGauge>;
    rootGauges: Array<RootGauge>;
    singleRecipientGauge?: Maybe<SingleRecipientGauge>;
    singleRecipientGauges: Array<SingleRecipientGauge>;
    user?: Maybe<User>;
    users: Array<User>;
    votingEscrow?: Maybe<VotingEscrow>;
    votingEscrowLock?: Maybe<VotingEscrowLock>;
    votingEscrowLocks: Array<VotingEscrowLock>;
    votingEscrows: Array<VotingEscrow>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGaugeFactoriesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeFactory_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeFactory_Filter>;
};

export type QueryGaugeFactoryArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGaugeInjectorArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGaugeInjectorsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeInjector_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeInjector_Filter>;
};

export type QueryGaugeShareArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGaugeSharesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeShare_Filter>;
};

export type QueryGaugeTypeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGaugeTypesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeType_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeType_Filter>;
};

export type QueryGaugeVoteArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryGaugeVotesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeVote_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeVote_Filter>;
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

export type QueryLiquidityGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLiquidityGaugesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LiquidityGauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LiquidityGauge_Filter>;
};

export type QueryLockSnapshotArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLockSnapshotsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LockSnapshot_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LockSnapshot_Filter>;
};

export type QueryOmniVotingEscrowLockArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryOmniVotingEscrowLocksArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<OmniVotingEscrowLock_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<OmniVotingEscrowLock_Filter>;
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

export type QueryRootGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRootGaugesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RootGauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<RootGauge_Filter>;
};

export type QuerySingleRecipientGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QuerySingleRecipientGaugesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<SingleRecipientGauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<SingleRecipientGauge_Filter>;
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

export type QueryVotingEscrowArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryVotingEscrowLockArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryVotingEscrowLocksArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<VotingEscrowLock_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<VotingEscrowLock_Filter>;
};

export type QueryVotingEscrowsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<VotingEscrow_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<VotingEscrow_Filter>;
};

export type RewardToken = {
    __typename?: 'RewardToken';
    /**  ERC20 token decimals - zero if call to decimals() reverts  */
    decimals: Scalars['Int'];
    /**  Reference to LiquidityGauge entity  */
    gauge: LiquidityGauge;
    /**  Equal to: <tokenAddress>-<gaugeAddress>  */
    id: Scalars['ID'];
    /**  Timestamp at which finishes the period of rewards  */
    periodFinish?: Maybe<Scalars['BigInt']>;
    /**  Rate of reward tokens streamed per second  */
    rate?: Maybe<Scalars['BigDecimal']>;
    /**  ERC20 token symbol - empty string if call to symbol() reverts  */
    symbol: Scalars['String'];
    /**  Amount of reward tokens that has been deposited into the gauge  */
    totalDeposited: Scalars['BigDecimal'];
};

export type RewardToken_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<RewardToken_Filter>>>;
    decimals?: InputMaybe<Scalars['Int']>;
    decimals_gt?: InputMaybe<Scalars['Int']>;
    decimals_gte?: InputMaybe<Scalars['Int']>;
    decimals_in?: InputMaybe<Array<Scalars['Int']>>;
    decimals_lt?: InputMaybe<Scalars['Int']>;
    decimals_lte?: InputMaybe<Scalars['Int']>;
    decimals_not?: InputMaybe<Scalars['Int']>;
    decimals_not_in?: InputMaybe<Array<Scalars['Int']>>;
    gauge?: InputMaybe<Scalars['String']>;
    gauge_?: InputMaybe<LiquidityGauge_Filter>;
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
    or?: InputMaybe<Array<InputMaybe<RewardToken_Filter>>>;
    periodFinish?: InputMaybe<Scalars['BigInt']>;
    periodFinish_gt?: InputMaybe<Scalars['BigInt']>;
    periodFinish_gte?: InputMaybe<Scalars['BigInt']>;
    periodFinish_in?: InputMaybe<Array<Scalars['BigInt']>>;
    periodFinish_lt?: InputMaybe<Scalars['BigInt']>;
    periodFinish_lte?: InputMaybe<Scalars['BigInt']>;
    periodFinish_not?: InputMaybe<Scalars['BigInt']>;
    periodFinish_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    rate?: InputMaybe<Scalars['BigDecimal']>;
    rate_gt?: InputMaybe<Scalars['BigDecimal']>;
    rate_gte?: InputMaybe<Scalars['BigDecimal']>;
    rate_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    rate_lt?: InputMaybe<Scalars['BigDecimal']>;
    rate_lte?: InputMaybe<Scalars['BigDecimal']>;
    rate_not?: InputMaybe<Scalars['BigDecimal']>;
    rate_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
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
    totalDeposited?: InputMaybe<Scalars['BigDecimal']>;
    totalDeposited_gt?: InputMaybe<Scalars['BigDecimal']>;
    totalDeposited_gte?: InputMaybe<Scalars['BigDecimal']>;
    totalDeposited_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    totalDeposited_lt?: InputMaybe<Scalars['BigDecimal']>;
    totalDeposited_lte?: InputMaybe<Scalars['BigDecimal']>;
    totalDeposited_not?: InputMaybe<Scalars['BigDecimal']>;
    totalDeposited_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum RewardToken_OrderBy {
    decimals = 'decimals',
    gauge = 'gauge',
    gauge__id = 'gauge__id',
    gauge__isKilled = 'gauge__isKilled',
    gauge__isPreferentialGauge = 'gauge__isPreferentialGauge',
    gauge__poolAddress = 'gauge__poolAddress',
    gauge__poolId = 'gauge__poolId',
    gauge__relativeWeightCap = 'gauge__relativeWeightCap',
    gauge__streamer = 'gauge__streamer',
    gauge__symbol = 'gauge__symbol',
    gauge__totalSupply = 'gauge__totalSupply',
    id = 'id',
    periodFinish = 'periodFinish',
    rate = 'rate',
    symbol = 'symbol',
    totalDeposited = 'totalDeposited',
}

export type RootGauge = {
    __typename?: 'RootGauge';
    /**  Chain where emissions by this gauge will be bridged to  */
    chain: Chain;
    /**  Factory contract address  */
    factory: GaugeFactory;
    /**  Reference to Gauge entity - created when LiquidityGauge is added to GaugeController */
    gauge?: Maybe<Gauge>;
    /**  RootGauge contract address */
    id: Scalars['ID'];
    /**  Whether Balancer DAO killed the gauge  */
    isKilled: Scalars['Boolean'];
    /**  Address where emissions by this gauge will be bridged to  */
    recipient: Scalars['Bytes'];
    /**  Relative weight cap of the gauge (0.01 = 1%) - V2 factories only  */
    relativeWeightCap?: Maybe<Scalars['BigDecimal']>;
};

export type RootGauge_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<RootGauge_Filter>>>;
    chain?: InputMaybe<Chain>;
    chain_in?: InputMaybe<Array<Chain>>;
    chain_not?: InputMaybe<Chain>;
    chain_not_in?: InputMaybe<Array<Chain>>;
    factory?: InputMaybe<Scalars['String']>;
    factory_?: InputMaybe<GaugeFactory_Filter>;
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
    isKilled?: InputMaybe<Scalars['Boolean']>;
    isKilled_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isKilled_not?: InputMaybe<Scalars['Boolean']>;
    isKilled_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    or?: InputMaybe<Array<InputMaybe<RootGauge_Filter>>>;
    recipient?: InputMaybe<Scalars['Bytes']>;
    recipient_contains?: InputMaybe<Scalars['Bytes']>;
    recipient_gt?: InputMaybe<Scalars['Bytes']>;
    recipient_gte?: InputMaybe<Scalars['Bytes']>;
    recipient_in?: InputMaybe<Array<Scalars['Bytes']>>;
    recipient_lt?: InputMaybe<Scalars['Bytes']>;
    recipient_lte?: InputMaybe<Scalars['Bytes']>;
    recipient_not?: InputMaybe<Scalars['Bytes']>;
    recipient_not_contains?: InputMaybe<Scalars['Bytes']>;
    recipient_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    relativeWeightCap?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_gt?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_gte?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    relativeWeightCap_lt?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_lte?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_not?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum RootGauge_OrderBy {
    chain = 'chain',
    factory = 'factory',
    factory__id = 'factory__id',
    factory__numGauges = 'factory__numGauges',
    gauge = 'gauge',
    gauge__addedTimestamp = 'gauge__addedTimestamp',
    gauge__address = 'gauge__address',
    gauge__id = 'gauge__id',
    id = 'id',
    isKilled = 'isKilled',
    recipient = 'recipient',
    relativeWeightCap = 'relativeWeightCap',
}

export type SingleRecipientGauge = {
    __typename?: 'SingleRecipientGauge';
    /**  Factory contract address  */
    factory: GaugeFactory;
    /**  Reference to Gauge entity - created when SingleRecipientGauge is added to GaugeController */
    gauge?: Maybe<Gauge>;
    /**  SingleRecipientGauge contract address */
    id: Scalars['ID'];
    /**  Whether Balancer DAO killed the gauge  */
    isKilled: Scalars['Boolean'];
    /**  Address where emissions for this gauge will be sent to  */
    recipient: Scalars['Bytes'];
    /**  Relative weight cap of the gauge (0.01 = 1%) - V2 factories only  */
    relativeWeightCap?: Maybe<Scalars['BigDecimal']>;
};

export type SingleRecipientGauge_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<SingleRecipientGauge_Filter>>>;
    factory?: InputMaybe<Scalars['String']>;
    factory_?: InputMaybe<GaugeFactory_Filter>;
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
    isKilled?: InputMaybe<Scalars['Boolean']>;
    isKilled_in?: InputMaybe<Array<Scalars['Boolean']>>;
    isKilled_not?: InputMaybe<Scalars['Boolean']>;
    isKilled_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
    or?: InputMaybe<Array<InputMaybe<SingleRecipientGauge_Filter>>>;
    recipient?: InputMaybe<Scalars['Bytes']>;
    recipient_contains?: InputMaybe<Scalars['Bytes']>;
    recipient_gt?: InputMaybe<Scalars['Bytes']>;
    recipient_gte?: InputMaybe<Scalars['Bytes']>;
    recipient_in?: InputMaybe<Array<Scalars['Bytes']>>;
    recipient_lt?: InputMaybe<Scalars['Bytes']>;
    recipient_lte?: InputMaybe<Scalars['Bytes']>;
    recipient_not?: InputMaybe<Scalars['Bytes']>;
    recipient_not_contains?: InputMaybe<Scalars['Bytes']>;
    recipient_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    relativeWeightCap?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_gt?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_gte?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    relativeWeightCap_lt?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_lte?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_not?: InputMaybe<Scalars['BigDecimal']>;
    relativeWeightCap_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum SingleRecipientGauge_OrderBy {
    factory = 'factory',
    factory__id = 'factory__id',
    factory__numGauges = 'factory__numGauges',
    gauge = 'gauge',
    gauge__addedTimestamp = 'gauge__addedTimestamp',
    gauge__address = 'gauge__address',
    gauge__id = 'gauge__id',
    id = 'id',
    isKilled = 'isKilled',
    recipient = 'recipient',
    relativeWeightCap = 'relativeWeightCap',
}

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    gauge?: Maybe<Gauge>;
    gaugeFactories: Array<GaugeFactory>;
    gaugeFactory?: Maybe<GaugeFactory>;
    gaugeInjector?: Maybe<GaugeInjector>;
    gaugeInjectors: Array<GaugeInjector>;
    gaugeShare?: Maybe<GaugeShare>;
    gaugeShares: Array<GaugeShare>;
    gaugeType?: Maybe<GaugeType>;
    gaugeTypes: Array<GaugeType>;
    gaugeVote?: Maybe<GaugeVote>;
    gaugeVotes: Array<GaugeVote>;
    gauges: Array<Gauge>;
    liquidityGauge?: Maybe<LiquidityGauge>;
    liquidityGauges: Array<LiquidityGauge>;
    lockSnapshot?: Maybe<LockSnapshot>;
    lockSnapshots: Array<LockSnapshot>;
    omniVotingEscrowLock?: Maybe<OmniVotingEscrowLock>;
    omniVotingEscrowLocks: Array<OmniVotingEscrowLock>;
    pool?: Maybe<Pool>;
    pools: Array<Pool>;
    rewardToken?: Maybe<RewardToken>;
    rewardTokens: Array<RewardToken>;
    rootGauge?: Maybe<RootGauge>;
    rootGauges: Array<RootGauge>;
    singleRecipientGauge?: Maybe<SingleRecipientGauge>;
    singleRecipientGauges: Array<SingleRecipientGauge>;
    user?: Maybe<User>;
    users: Array<User>;
    votingEscrow?: Maybe<VotingEscrow>;
    votingEscrowLock?: Maybe<VotingEscrowLock>;
    votingEscrowLocks: Array<VotingEscrowLock>;
    votingEscrows: Array<VotingEscrow>;
};

export type Subscription_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type SubscriptionGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGaugeFactoriesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeFactory_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeFactory_Filter>;
};

export type SubscriptionGaugeFactoryArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGaugeInjectorArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGaugeInjectorsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeInjector_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeInjector_Filter>;
};

export type SubscriptionGaugeShareArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGaugeSharesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeShare_Filter>;
};

export type SubscriptionGaugeTypeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGaugeTypesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeType_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeType_Filter>;
};

export type SubscriptionGaugeVoteArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionGaugeVotesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeVote_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<GaugeVote_Filter>;
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

export type SubscriptionLiquidityGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionLiquidityGaugesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LiquidityGauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LiquidityGauge_Filter>;
};

export type SubscriptionLockSnapshotArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionLockSnapshotsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<LockSnapshot_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<LockSnapshot_Filter>;
};

export type SubscriptionOmniVotingEscrowLockArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionOmniVotingEscrowLocksArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<OmniVotingEscrowLock_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<OmniVotingEscrowLock_Filter>;
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

export type SubscriptionRootGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionRootGaugesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<RootGauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<RootGauge_Filter>;
};

export type SubscriptionSingleRecipientGaugeArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionSingleRecipientGaugesArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<SingleRecipientGauge_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<SingleRecipientGauge_Filter>;
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

export type SubscriptionVotingEscrowArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionVotingEscrowLockArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionVotingEscrowLocksArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<VotingEscrowLock_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<VotingEscrowLock_Filter>;
};

export type SubscriptionVotingEscrowsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<VotingEscrow_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<VotingEscrow_Filter>;
};

export type User = {
    __typename?: 'User';
    /**  List of gauge the user has shares  */
    gaugeShares?: Maybe<Array<GaugeShare>>;
    /**  List of votes on gauges  */
    gaugeVotes?: Maybe<Array<GaugeVote>>;
    /**  User address  */
    id: Scalars['ID'];
    /**  List of omni locks the user created  */
    omniVotingLocks?: Maybe<Array<OmniVotingEscrowLock>>;
    /**  List of locks the user created  */
    votingLocks?: Maybe<Array<VotingEscrowLock>>;
};

export type UserGaugeSharesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeShare_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<GaugeShare_Filter>;
};

export type UserGaugeVotesArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<GaugeVote_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<GaugeVote_Filter>;
};

export type UserOmniVotingLocksArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<OmniVotingEscrowLock_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<OmniVotingEscrowLock_Filter>;
};

export type UserVotingLocksArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<VotingEscrowLock_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<VotingEscrowLock_Filter>;
};

export type User_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<User_Filter>>>;
    gaugeShares_?: InputMaybe<GaugeShare_Filter>;
    gaugeVotes_?: InputMaybe<GaugeVote_Filter>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    omniVotingLocks_?: InputMaybe<OmniVotingEscrowLock_Filter>;
    or?: InputMaybe<Array<InputMaybe<User_Filter>>>;
    votingLocks_?: InputMaybe<VotingEscrowLock_Filter>;
};

export enum User_OrderBy {
    gaugeShares = 'gaugeShares',
    gaugeVotes = 'gaugeVotes',
    id = 'id',
    omniVotingLocks = 'omniVotingLocks',
    votingLocks = 'votingLocks',
}

export type VotingEscrow = {
    __typename?: 'VotingEscrow';
    /**  VotingEscrow contract address  */
    id: Scalars['ID'];
    /**  List of veBAL locks created  */
    locks?: Maybe<Array<VotingEscrowLock>>;
    /**  List of veBAL locks created  */
    omniLocks?: Maybe<Array<OmniVotingEscrowLock>>;
    /**  Amount of B-80BAL-20WETH BPT locked, only applies on mainnet  */
    stakedSupply?: Maybe<Scalars['BigDecimal']>;
};

export type VotingEscrowLocksArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<VotingEscrowLock_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<VotingEscrowLock_Filter>;
};

export type VotingEscrowOmniLocksArgs = {
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<OmniVotingEscrowLock_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    where?: InputMaybe<OmniVotingEscrowLock_Filter>;
};

export type VotingEscrowLock = {
    __typename?: 'VotingEscrowLock';
    /**  veBAL balance at the moment user locks  */
    bias: Scalars['BigDecimal'];
    /**  Equal to: <userAdress>-<votingEscrow>  */
    id: Scalars['ID'];
    /**  Amount of B-80BAL-20WETH BPT the user has locked  */
    lockedBalance: Scalars['BigDecimal'];
    /**  veBAL decay rate (per second)  */
    slope: Scalars['BigDecimal'];
    /**  Timestamp at which the lock was created [seconds]  */
    timestamp: Scalars['Int'];
    /**  Timestamp at which B-80BAL-20WETH BPT can be unlocked by user [seconds]  */
    unlockTime: Scalars['BigInt'];
    /**  Timestamp at which the lcok was created [seconds]. Same as timestamp  */
    updatedAt: Scalars['Int'];
    /**  Reference to User entity  */
    user: User;
    /**  Reference to VotingEscrow entity  */
    votingEscrowID: VotingEscrow;
};

export type VotingEscrowLock_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<VotingEscrowLock_Filter>>>;
    bias?: InputMaybe<Scalars['BigDecimal']>;
    bias_gt?: InputMaybe<Scalars['BigDecimal']>;
    bias_gte?: InputMaybe<Scalars['BigDecimal']>;
    bias_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    bias_lt?: InputMaybe<Scalars['BigDecimal']>;
    bias_lte?: InputMaybe<Scalars['BigDecimal']>;
    bias_not?: InputMaybe<Scalars['BigDecimal']>;
    bias_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    lockedBalance?: InputMaybe<Scalars['BigDecimal']>;
    lockedBalance_gt?: InputMaybe<Scalars['BigDecimal']>;
    lockedBalance_gte?: InputMaybe<Scalars['BigDecimal']>;
    lockedBalance_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    lockedBalance_lt?: InputMaybe<Scalars['BigDecimal']>;
    lockedBalance_lte?: InputMaybe<Scalars['BigDecimal']>;
    lockedBalance_not?: InputMaybe<Scalars['BigDecimal']>;
    lockedBalance_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    or?: InputMaybe<Array<InputMaybe<VotingEscrowLock_Filter>>>;
    slope?: InputMaybe<Scalars['BigDecimal']>;
    slope_gt?: InputMaybe<Scalars['BigDecimal']>;
    slope_gte?: InputMaybe<Scalars['BigDecimal']>;
    slope_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    slope_lt?: InputMaybe<Scalars['BigDecimal']>;
    slope_lte?: InputMaybe<Scalars['BigDecimal']>;
    slope_not?: InputMaybe<Scalars['BigDecimal']>;
    slope_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    timestamp?: InputMaybe<Scalars['Int']>;
    timestamp_gt?: InputMaybe<Scalars['Int']>;
    timestamp_gte?: InputMaybe<Scalars['Int']>;
    timestamp_in?: InputMaybe<Array<Scalars['Int']>>;
    timestamp_lt?: InputMaybe<Scalars['Int']>;
    timestamp_lte?: InputMaybe<Scalars['Int']>;
    timestamp_not?: InputMaybe<Scalars['Int']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['Int']>>;
    unlockTime?: InputMaybe<Scalars['BigInt']>;
    unlockTime_gt?: InputMaybe<Scalars['BigInt']>;
    unlockTime_gte?: InputMaybe<Scalars['BigInt']>;
    unlockTime_in?: InputMaybe<Array<Scalars['BigInt']>>;
    unlockTime_lt?: InputMaybe<Scalars['BigInt']>;
    unlockTime_lte?: InputMaybe<Scalars['BigInt']>;
    unlockTime_not?: InputMaybe<Scalars['BigInt']>;
    unlockTime_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    updatedAt?: InputMaybe<Scalars['Int']>;
    updatedAt_gt?: InputMaybe<Scalars['Int']>;
    updatedAt_gte?: InputMaybe<Scalars['Int']>;
    updatedAt_in?: InputMaybe<Array<Scalars['Int']>>;
    updatedAt_lt?: InputMaybe<Scalars['Int']>;
    updatedAt_lte?: InputMaybe<Scalars['Int']>;
    updatedAt_not?: InputMaybe<Scalars['Int']>;
    updatedAt_not_in?: InputMaybe<Array<Scalars['Int']>>;
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
    votingEscrowID?: InputMaybe<Scalars['String']>;
    votingEscrowID_?: InputMaybe<VotingEscrow_Filter>;
    votingEscrowID_contains?: InputMaybe<Scalars['String']>;
    votingEscrowID_contains_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_ends_with?: InputMaybe<Scalars['String']>;
    votingEscrowID_ends_with_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_gt?: InputMaybe<Scalars['String']>;
    votingEscrowID_gte?: InputMaybe<Scalars['String']>;
    votingEscrowID_in?: InputMaybe<Array<Scalars['String']>>;
    votingEscrowID_lt?: InputMaybe<Scalars['String']>;
    votingEscrowID_lte?: InputMaybe<Scalars['String']>;
    votingEscrowID_not?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_contains?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_contains_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_ends_with?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_in?: InputMaybe<Array<Scalars['String']>>;
    votingEscrowID_not_starts_with?: InputMaybe<Scalars['String']>;
    votingEscrowID_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    votingEscrowID_starts_with?: InputMaybe<Scalars['String']>;
    votingEscrowID_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum VotingEscrowLock_OrderBy {
    bias = 'bias',
    id = 'id',
    lockedBalance = 'lockedBalance',
    slope = 'slope',
    timestamp = 'timestamp',
    unlockTime = 'unlockTime',
    updatedAt = 'updatedAt',
    user = 'user',
    user__id = 'user__id',
    votingEscrowID = 'votingEscrowID',
    votingEscrowID__id = 'votingEscrowID__id',
    votingEscrowID__stakedSupply = 'votingEscrowID__stakedSupply',
}

export type VotingEscrow_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<VotingEscrow_Filter>>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    locks_?: InputMaybe<VotingEscrowLock_Filter>;
    omniLocks_?: InputMaybe<OmniVotingEscrowLock_Filter>;
    or?: InputMaybe<Array<InputMaybe<VotingEscrow_Filter>>>;
    stakedSupply?: InputMaybe<Scalars['BigDecimal']>;
    stakedSupply_gt?: InputMaybe<Scalars['BigDecimal']>;
    stakedSupply_gte?: InputMaybe<Scalars['BigDecimal']>;
    stakedSupply_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
    stakedSupply_lt?: InputMaybe<Scalars['BigDecimal']>;
    stakedSupply_lte?: InputMaybe<Scalars['BigDecimal']>;
    stakedSupply_not?: InputMaybe<Scalars['BigDecimal']>;
    stakedSupply_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum VotingEscrow_OrderBy {
    id = 'id',
    locks = 'locks',
    omniLocks = 'omniLocks',
    stakedSupply = 'stakedSupply',
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
    allow = 'allow',
    /** If the subgraph has indexing errors, data will be omitted. The default. */
    deny = 'deny',
}

export type GaugeLiquidityGaugesQueryVariables = Exact<{
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<LiquidityGauge_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<LiquidityGauge_Filter>;
}>;

export type GaugeLiquidityGaugesQuery = {
    __typename?: 'Query';
    liquidityGauges: Array<{
        __typename?: 'LiquidityGauge';
        id: string;
        poolId?: string | null | undefined;
        poolAddress: string;
        totalSupply: string;
        streamer?: string | null | undefined;
        isPreferentialGauge: boolean;
        isKilled: boolean;
        tokens?:
            | Array<{
                  __typename?: 'RewardToken';
                  id: string;
                  decimals: number;
                  symbol: string;
                  rate?: string | null | undefined;
                  periodFinish?: string | null | undefined;
              }>
            | null
            | undefined;
        shares?:
            | Array<{ __typename?: 'GaugeShare'; balance: string; user: { __typename?: 'User'; id: string } }>
            | null
            | undefined;
        gauge?: { __typename?: 'Gauge'; addedTimestamp: number } | null | undefined;
    }>;
};

export type GaugeFragment = {
    __typename?: 'LiquidityGauge';
    id: string;
    poolId?: string | null | undefined;
    poolAddress: string;
    totalSupply: string;
    streamer?: string | null | undefined;
    isPreferentialGauge: boolean;
    isKilled: boolean;
    tokens?:
        | Array<{
              __typename?: 'RewardToken';
              id: string;
              decimals: number;
              symbol: string;
              rate?: string | null | undefined;
              periodFinish?: string | null | undefined;
          }>
        | null
        | undefined;
    shares?:
        | Array<{ __typename?: 'GaugeShare'; balance: string; user: { __typename?: 'User'; id: string } }>
        | null
        | undefined;
    gauge?: { __typename?: 'Gauge'; addedTimestamp: number } | null | undefined;
};

export type GaugeLiquidityGaugeAddressesQueryVariables = Exact<{ [key: string]: never }>;

export type GaugeLiquidityGaugeAddressesQuery = {
    __typename?: 'Query';
    liquidityGauges: Array<{ __typename?: 'LiquidityGauge'; id: string }>;
};

export type GaugeUserGaugesQueryVariables = Exact<{
    userAddress: Scalars['ID'];
}>;

export type GaugeUserGaugesQuery = {
    __typename?: 'Query';
    user?:
        | {
              __typename?: 'User';
              id: string;
              gaugeShares?:
                  | Array<{
                        __typename?: 'GaugeShare';
                        balance: string;
                        gauge: {
                            __typename?: 'LiquidityGauge';
                            id: string;
                            poolId?: string | null | undefined;
                            isPreferentialGauge: boolean;
                            isKilled: boolean;
                            tokens?:
                                | Array<{
                                      __typename?: 'RewardToken';
                                      id: string;
                                      decimals: number;
                                      symbol: string;
                                      rate?: string | null | undefined;
                                      periodFinish?: string | null | undefined;
                                  }>
                                | null
                                | undefined;
                        };
                    }>
                  | null
                  | undefined;
          }
        | null
        | undefined;
};

export type GaugeSharesQueryVariables = Exact<{
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<GaugeShare_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<GaugeShare_Filter>;
}>;

export type GaugeSharesQuery = {
    __typename?: 'Query';
    gaugeShares: Array<{
        __typename?: 'GaugeShare';
        id: string;
        balance: string;
        gauge: {
            __typename?: 'LiquidityGauge';
            id: string;
            poolId?: string | null | undefined;
            poolAddress: string;
            isPreferentialGauge: boolean;
            isKilled: boolean;
        };
        user: { __typename?: 'User'; id: string };
    }>;
};

export type GaugeShareFragment = {
    __typename?: 'GaugeShare';
    id: string;
    balance: string;
    gauge: {
        __typename?: 'LiquidityGauge';
        id: string;
        poolId?: string | null | undefined;
        poolAddress: string;
        isPreferentialGauge: boolean;
        isKilled: boolean;
    };
    user: { __typename?: 'User'; id: string };
};

export type GaugeGetMetaQueryVariables = Exact<{ [key: string]: never }>;

export type GaugeGetMetaQuery = {
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

export type VotingEscrowLocksQueryVariables = Exact<{
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<VotingEscrowLock_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<VotingEscrowLock_Filter>;
}>;

export type VotingEscrowLocksQuery = {
    __typename?: 'Query';
    votingEscrowLocks: Array<{
        __typename?: 'VotingEscrowLock';
        id: string;
        lockedBalance: string;
        user: { __typename?: 'User'; id: string };
    }>;
};

export type RootGaugesQueryVariables = Exact<{
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<RootGauge_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<RootGauge_Filter>;
}>;

export type RootGaugesQuery = {
    __typename?: 'Query';
    rootGauges: Array<{
        __typename?: 'RootGauge';
        id: string;
        chain: Chain;
        recipient: string;
        gauge?: { __typename?: 'Gauge'; addedTimestamp: number } | null | undefined;
    }>;
};

export type RootGaugeFragment = {
    __typename?: 'RootGauge';
    id: string;
    chain: Chain;
    recipient: string;
    gauge?: { __typename?: 'Gauge'; addedTimestamp: number } | null | undefined;
};

export type LiquidityGaugesQueryVariables = Exact<{
    ids?: Maybe<Array<Scalars['ID']> | Scalars['ID']>;
}>;

export type LiquidityGaugesQuery = {
    __typename?: 'Query';
    liquidityGauges: Array<{ __typename?: 'LiquidityGauge'; id: string }>;
};

export const GaugeFragmentDoc = gql`
    fragment Gauge on LiquidityGauge {
        id
        poolId
        poolAddress
        totalSupply
        tokens {
            id
            decimals
            symbol
            rate
            periodFinish
        }
        shares {
            user {
                id
            }
            balance
        }
        streamer
        isPreferentialGauge
        isKilled
        gauge {
            addedTimestamp
        }
    }
`;
export const GaugeShareFragmentDoc = gql`
    fragment GaugeShare on GaugeShare {
        id
        balance
        gauge {
            id
            poolId
            poolAddress
            isPreferentialGauge
            isKilled
        }
        user {
            id
        }
    }
`;
export const RootGaugeFragmentDoc = gql`
    fragment RootGauge on RootGauge {
        id
        chain
        recipient
        gauge {
            addedTimestamp
        }
    }
`;
export const GaugeLiquidityGaugesDocument = gql`
    query GaugeLiquidityGauges(
        $first: Int = 1000
        $orderBy: LiquidityGauge_orderBy
        $orderDirection: OrderDirection
        $skip: Int = 0
        $where: LiquidityGauge_filter
    ) {
        liquidityGauges(skip: $skip, first: $first, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
            ...Gauge
        }
    }
    ${GaugeFragmentDoc}
`;
export const GaugeLiquidityGaugeAddressesDocument = gql`
    query GaugeLiquidityGaugeAddresses {
        liquidityGauges {
            id
        }
    }
`;
export const GaugeUserGaugesDocument = gql`
    query GaugeUserGauges($userAddress: ID!) {
        user(id: $userAddress) {
            id
            gaugeShares {
                balance
                gauge {
                    id
                    poolId
                    tokens {
                        id
                        decimals
                        symbol
                        rate
                        periodFinish
                    }
                    isPreferentialGauge
                    isKilled
                }
            }
        }
    }
`;
export const GaugeSharesDocument = gql`
    query GaugeShares(
        $block: Block_height
        $first: Int = 100
        $orderBy: GaugeShare_orderBy
        $orderDirection: OrderDirection
        $skip: Int = 0
        $where: GaugeShare_filter
    ) {
        gaugeShares(
            block: $block
            first: $first
            skip: $skip
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
        ) {
            ...GaugeShare
        }
    }
    ${GaugeShareFragmentDoc}
`;
export const GaugeGetMetaDocument = gql`
    query GaugeGetMeta {
        meta: _meta {
            block {
                number
            }
            deployment
            hasIndexingErrors
        }
    }
`;
export const VotingEscrowLocksDocument = gql`
    query VotingEscrowLocks(
        $block: Block_height
        $first: Int = 100
        $orderBy: VotingEscrowLock_orderBy
        $orderDirection: OrderDirection
        $skip: Int = 0
        $where: VotingEscrowLock_filter
    ) {
        votingEscrowLocks(
            block: $block
            first: $first
            skip: $skip
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
        ) {
            id
            lockedBalance
            user {
                id
            }
        }
    }
`;
export const RootGaugesDocument = gql`
    query RootGauges(
        $block: Block_height
        $first: Int = 100
        $orderBy: RootGauge_orderBy
        $orderDirection: OrderDirection
        $skip: Int = 0
        $where: RootGauge_filter
    ) {
        rootGauges(
            block: $block
            first: $first
            skip: $skip
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
        ) {
            ...RootGauge
        }
    }
    ${RootGaugeFragmentDoc}
`;
export const LiquidityGaugesDocument = gql`
    query LiquidityGauges($ids: [ID!]) {
        liquidityGauges(where: { id_in: $ids }, first: 1000) {
            id
        }
    }
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        GaugeLiquidityGauges(
            variables?: GaugeLiquidityGaugesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GaugeLiquidityGaugesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GaugeLiquidityGaugesQuery>(GaugeLiquidityGaugesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GaugeLiquidityGauges',
            );
        },
        GaugeLiquidityGaugeAddresses(
            variables?: GaugeLiquidityGaugeAddressesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GaugeLiquidityGaugeAddressesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GaugeLiquidityGaugeAddressesQuery>(GaugeLiquidityGaugeAddressesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GaugeLiquidityGaugeAddresses',
            );
        },
        GaugeUserGauges(
            variables: GaugeUserGaugesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GaugeUserGaugesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GaugeUserGaugesQuery>(GaugeUserGaugesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GaugeUserGauges',
            );
        },
        GaugeShares(
            variables?: GaugeSharesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GaugeSharesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GaugeSharesQuery>(GaugeSharesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GaugeShares',
            );
        },
        GaugeGetMeta(
            variables?: GaugeGetMetaQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GaugeGetMetaQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GaugeGetMetaQuery>(GaugeGetMetaDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GaugeGetMeta',
            );
        },
        VotingEscrowLocks(
            variables?: VotingEscrowLocksQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<VotingEscrowLocksQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<VotingEscrowLocksQuery>(VotingEscrowLocksDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'VotingEscrowLocks',
            );
        },
        RootGauges(
            variables?: RootGaugesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<RootGaugesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<RootGaugesQuery>(RootGaugesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'RootGauges',
            );
        },
        LiquidityGauges(
            variables?: LiquidityGaugesQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<LiquidityGaugesQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<LiquidityGaugesQuery>(LiquidityGaugesDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'LiquidityGauges',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
