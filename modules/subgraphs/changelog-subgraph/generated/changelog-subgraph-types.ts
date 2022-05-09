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

export type BlockChangedFilter = {
    number_gte: Scalars['Int'];
};

export type Block_Height = {
    hash?: InputMaybe<Scalars['Bytes']>;
    number?: InputMaybe<Scalars['Int']>;
    number_gte?: InputMaybe<Scalars['Int']>;
};

export type EntityChangeEvent = {
    action: Scalars['String'];
    block: Scalars['BigInt'];
    id: Scalars['Bytes'];
    timestamp: Scalars['BigInt'];
};

export type EntityChangeEvent_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    action?: InputMaybe<Scalars['String']>;
    action_contains?: InputMaybe<Scalars['String']>;
    action_contains_nocase?: InputMaybe<Scalars['String']>;
    action_ends_with?: InputMaybe<Scalars['String']>;
    action_ends_with_nocase?: InputMaybe<Scalars['String']>;
    action_gt?: InputMaybe<Scalars['String']>;
    action_gte?: InputMaybe<Scalars['String']>;
    action_in?: InputMaybe<Array<Scalars['String']>>;
    action_lt?: InputMaybe<Scalars['String']>;
    action_lte?: InputMaybe<Scalars['String']>;
    action_not?: InputMaybe<Scalars['String']>;
    action_not_contains?: InputMaybe<Scalars['String']>;
    action_not_contains_nocase?: InputMaybe<Scalars['String']>;
    action_not_ends_with?: InputMaybe<Scalars['String']>;
    action_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    action_not_in?: InputMaybe<Array<Scalars['String']>>;
    action_not_starts_with?: InputMaybe<Scalars['String']>;
    action_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    action_starts_with?: InputMaybe<Scalars['String']>;
    action_starts_with_nocase?: InputMaybe<Scalars['String']>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum EntityChangeEvent_OrderBy {
    Action = 'action',
    Block = 'block',
    Id = 'id',
    Timestamp = 'timestamp',
}

export type FarmChangeEvent = EntityChangeEvent & {
    __typename?: 'FarmChangeEvent';
    action: Scalars['String'];
    block: Scalars['BigInt'];
    farmId: Scalars['Int'];
    id: Scalars['Bytes'];
    timestamp: Scalars['BigInt'];
};

export type FarmChangeEvent_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    action?: InputMaybe<Scalars['String']>;
    action_contains?: InputMaybe<Scalars['String']>;
    action_contains_nocase?: InputMaybe<Scalars['String']>;
    action_ends_with?: InputMaybe<Scalars['String']>;
    action_ends_with_nocase?: InputMaybe<Scalars['String']>;
    action_gt?: InputMaybe<Scalars['String']>;
    action_gte?: InputMaybe<Scalars['String']>;
    action_in?: InputMaybe<Array<Scalars['String']>>;
    action_lt?: InputMaybe<Scalars['String']>;
    action_lte?: InputMaybe<Scalars['String']>;
    action_not?: InputMaybe<Scalars['String']>;
    action_not_contains?: InputMaybe<Scalars['String']>;
    action_not_contains_nocase?: InputMaybe<Scalars['String']>;
    action_not_ends_with?: InputMaybe<Scalars['String']>;
    action_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    action_not_in?: InputMaybe<Array<Scalars['String']>>;
    action_not_starts_with?: InputMaybe<Scalars['String']>;
    action_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    action_starts_with?: InputMaybe<Scalars['String']>;
    action_starts_with_nocase?: InputMaybe<Scalars['String']>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    farmId?: InputMaybe<Scalars['Int']>;
    farmId_gt?: InputMaybe<Scalars['Int']>;
    farmId_gte?: InputMaybe<Scalars['Int']>;
    farmId_in?: InputMaybe<Array<Scalars['Int']>>;
    farmId_lt?: InputMaybe<Scalars['Int']>;
    farmId_lte?: InputMaybe<Scalars['Int']>;
    farmId_not?: InputMaybe<Scalars['Int']>;
    farmId_not_in?: InputMaybe<Array<Scalars['Int']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum FarmChangeEvent_OrderBy {
    Action = 'action',
    Block = 'block',
    FarmId = 'farmId',
    Id = 'id',
    Timestamp = 'timestamp',
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type PoolChangeEvent = EntityChangeEvent & {
    __typename?: 'PoolChangeEvent';
    action: Scalars['String'];
    block: Scalars['BigInt'];
    id: Scalars['Bytes'];
    poolId: Scalars['Bytes'];
    timestamp: Scalars['BigInt'];
};

export type PoolChangeEvent_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    action?: InputMaybe<Scalars['String']>;
    action_contains?: InputMaybe<Scalars['String']>;
    action_contains_nocase?: InputMaybe<Scalars['String']>;
    action_ends_with?: InputMaybe<Scalars['String']>;
    action_ends_with_nocase?: InputMaybe<Scalars['String']>;
    action_gt?: InputMaybe<Scalars['String']>;
    action_gte?: InputMaybe<Scalars['String']>;
    action_in?: InputMaybe<Array<Scalars['String']>>;
    action_lt?: InputMaybe<Scalars['String']>;
    action_lte?: InputMaybe<Scalars['String']>;
    action_not?: InputMaybe<Scalars['String']>;
    action_not_contains?: InputMaybe<Scalars['String']>;
    action_not_contains_nocase?: InputMaybe<Scalars['String']>;
    action_not_ends_with?: InputMaybe<Scalars['String']>;
    action_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
    action_not_in?: InputMaybe<Array<Scalars['String']>>;
    action_not_starts_with?: InputMaybe<Scalars['String']>;
    action_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
    action_starts_with?: InputMaybe<Scalars['String']>;
    action_starts_with_nocase?: InputMaybe<Scalars['String']>;
    block?: InputMaybe<Scalars['BigInt']>;
    block_gt?: InputMaybe<Scalars['BigInt']>;
    block_gte?: InputMaybe<Scalars['BigInt']>;
    block_in?: InputMaybe<Array<Scalars['BigInt']>>;
    block_lt?: InputMaybe<Scalars['BigInt']>;
    block_lte?: InputMaybe<Scalars['BigInt']>;
    block_not?: InputMaybe<Scalars['BigInt']>;
    block_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    id?: InputMaybe<Scalars['Bytes']>;
    id_contains?: InputMaybe<Scalars['Bytes']>;
    id_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id_not?: InputMaybe<Scalars['Bytes']>;
    id_not_contains?: InputMaybe<Scalars['Bytes']>;
    id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    poolId?: InputMaybe<Scalars['Bytes']>;
    poolId_contains?: InputMaybe<Scalars['Bytes']>;
    poolId_in?: InputMaybe<Array<Scalars['Bytes']>>;
    poolId_not?: InputMaybe<Scalars['Bytes']>;
    poolId_not_contains?: InputMaybe<Scalars['Bytes']>;
    poolId_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum PoolChangeEvent_OrderBy {
    Action = 'action',
    Block = 'block',
    Id = 'id',
    PoolId = 'poolId',
    Timestamp = 'timestamp',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    entityChangeEvent?: Maybe<EntityChangeEvent>;
    entityChangeEvents: Array<EntityChangeEvent>;
    farmChangeEvent?: Maybe<FarmChangeEvent>;
    farmChangeEvents: Array<FarmChangeEvent>;
    poolChangeEvent?: Maybe<PoolChangeEvent>;
    poolChangeEvents: Array<PoolChangeEvent>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryEntityChangeEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryEntityChangeEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<EntityChangeEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<EntityChangeEvent_Filter>;
};

export type QueryFarmChangeEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryFarmChangeEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<FarmChangeEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<FarmChangeEvent_Filter>;
};

export type QueryPoolChangeEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolChangeEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolChangeEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolChangeEvent_Filter>;
};

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    entityChangeEvent?: Maybe<EntityChangeEvent>;
    entityChangeEvents: Array<EntityChangeEvent>;
    farmChangeEvent?: Maybe<FarmChangeEvent>;
    farmChangeEvents: Array<FarmChangeEvent>;
    poolChangeEvent?: Maybe<PoolChangeEvent>;
    poolChangeEvents: Array<PoolChangeEvent>;
};

export type Subscription_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type SubscriptionEntityChangeEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionEntityChangeEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<EntityChangeEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<EntityChangeEvent_Filter>;
};

export type SubscriptionFarmChangeEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionFarmChangeEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<FarmChangeEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<FarmChangeEvent_Filter>;
};

export type SubscriptionPoolChangeEventArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPoolChangeEventsArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<PoolChangeEvent_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<PoolChangeEvent_Filter>;
};

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

export type GetChangeEventsQueryVariables = Exact<{
    minBlockNumber: Scalars['BigInt'];
}>;

export type GetChangeEventsQuery = {
    __typename?: 'Query';
    entityChangeEvents: Array<
        | { __typename: 'FarmChangeEvent'; farmId: number; action: string; block: string }
        | { __typename: 'PoolChangeEvent'; poolId: string; action: string; block: string }
    >;
};

export type GetPoolChangeEventsQueryVariables = Exact<{
    minBlockNumber: Scalars['BigInt'];
}>;

export type GetPoolChangeEventsQuery = {
    __typename?: 'Query';
    poolChangeEvents: Array<{ __typename: 'PoolChangeEvent'; action: string; poolId: string; block: string }>;
};

export type GetFarmChangeEventsQueryVariables = Exact<{
    minBlockNumber: Scalars['BigInt'];
}>;

export type GetFarmChangeEventsQuery = {
    __typename?: 'Query';
    farmChangeEvents: Array<{ __typename: 'FarmChangeEvent'; action: string; farmId: number; block: string }>;
};

export const GetChangeEventsDocument = gql`
    query GetChangeEvents($minBlockNumber: BigInt!) {
        entityChangeEvents(where: { block_gte: $minBlockNumber }) {
            __typename
            action
            block
            ... on PoolChangeEvent {
                poolId
            }
            ... on FarmChangeEvent {
                farmId
            }
        }
    }
`;
export const GetPoolChangeEventsDocument = gql`
    query GetPoolChangeEvents($minBlockNumber: BigInt!) {
        poolChangeEvents(where: { block_gte: $minBlockNumber }) {
            __typename
            action
            poolId
            block
        }
    }
`;
export const GetFarmChangeEventsDocument = gql`
    query GetFarmChangeEvents($minBlockNumber: BigInt!) {
        farmChangeEvents(where: { block_gte: $minBlockNumber }) {
            __typename
            action
            farmId
            block
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
        GetChangeEvents(
            variables: GetChangeEventsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GetChangeEventsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GetChangeEventsQuery>(GetChangeEventsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GetChangeEvents',
            );
        },
        GetPoolChangeEvents(
            variables: GetPoolChangeEventsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GetPoolChangeEventsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GetPoolChangeEventsQuery>(GetPoolChangeEventsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GetPoolChangeEvents',
            );
        },
        GetFarmChangeEvents(
            variables: GetFarmChangeEventsQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GetFarmChangeEventsQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GetFarmChangeEventsQuery>(GetFarmChangeEventsDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GetFarmChangeEvents',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
