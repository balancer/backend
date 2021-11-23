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

export type Bar = {
    __typename?: 'Bar';
    address: Scalars['Bytes'];
    block: Scalars['BigInt'];
    decimals: Scalars['Int'];
    fBeetsBurned: Scalars['BigDecimal'];
    fBeetsMinted: Scalars['BigDecimal'];
    id: Scalars['ID'];
    name: Scalars['String'];
    ratio: Scalars['BigDecimal'];
    sharedVestingTokenRevenue: Scalars['BigDecimal'];
    symbol: Scalars['String'];
    timestamp: Scalars['BigInt'];
    totalSupply: Scalars['BigDecimal'];
    users: Array<User>;
    vestingToken: Scalars['Bytes'];
    vestingTokenStaked: Scalars['BigDecimal'];
};

export type BarUsersArgs = {
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<User_Filter>;
};

export type Bar_Filter = {
    address?: Maybe<Scalars['Bytes']>;
    address_contains?: Maybe<Scalars['Bytes']>;
    address_in?: Maybe<Array<Scalars['Bytes']>>;
    address_not?: Maybe<Scalars['Bytes']>;
    address_not_contains?: Maybe<Scalars['Bytes']>;
    address_not_in?: Maybe<Array<Scalars['Bytes']>>;
    block?: Maybe<Scalars['BigInt']>;
    block_gt?: Maybe<Scalars['BigInt']>;
    block_gte?: Maybe<Scalars['BigInt']>;
    block_in?: Maybe<Array<Scalars['BigInt']>>;
    block_lt?: Maybe<Scalars['BigInt']>;
    block_lte?: Maybe<Scalars['BigInt']>;
    block_not?: Maybe<Scalars['BigInt']>;
    block_not_in?: Maybe<Array<Scalars['BigInt']>>;
    decimals?: Maybe<Scalars['Int']>;
    decimals_gt?: Maybe<Scalars['Int']>;
    decimals_gte?: Maybe<Scalars['Int']>;
    decimals_in?: Maybe<Array<Scalars['Int']>>;
    decimals_lt?: Maybe<Scalars['Int']>;
    decimals_lte?: Maybe<Scalars['Int']>;
    decimals_not?: Maybe<Scalars['Int']>;
    decimals_not_in?: Maybe<Array<Scalars['Int']>>;
    fBeetsBurned?: Maybe<Scalars['BigDecimal']>;
    fBeetsBurned_gt?: Maybe<Scalars['BigDecimal']>;
    fBeetsBurned_gte?: Maybe<Scalars['BigDecimal']>;
    fBeetsBurned_in?: Maybe<Array<Scalars['BigDecimal']>>;
    fBeetsBurned_lt?: Maybe<Scalars['BigDecimal']>;
    fBeetsBurned_lte?: Maybe<Scalars['BigDecimal']>;
    fBeetsBurned_not?: Maybe<Scalars['BigDecimal']>;
    fBeetsBurned_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    fBeetsMinted?: Maybe<Scalars['BigDecimal']>;
    fBeetsMinted_gt?: Maybe<Scalars['BigDecimal']>;
    fBeetsMinted_gte?: Maybe<Scalars['BigDecimal']>;
    fBeetsMinted_in?: Maybe<Array<Scalars['BigDecimal']>>;
    fBeetsMinted_lt?: Maybe<Scalars['BigDecimal']>;
    fBeetsMinted_lte?: Maybe<Scalars['BigDecimal']>;
    fBeetsMinted_not?: Maybe<Scalars['BigDecimal']>;
    fBeetsMinted_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
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
    ratio?: Maybe<Scalars['BigDecimal']>;
    ratio_gt?: Maybe<Scalars['BigDecimal']>;
    ratio_gte?: Maybe<Scalars['BigDecimal']>;
    ratio_in?: Maybe<Array<Scalars['BigDecimal']>>;
    ratio_lt?: Maybe<Scalars['BigDecimal']>;
    ratio_lte?: Maybe<Scalars['BigDecimal']>;
    ratio_not?: Maybe<Scalars['BigDecimal']>;
    ratio_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    sharedVestingTokenRevenue?: Maybe<Scalars['BigDecimal']>;
    sharedVestingTokenRevenue_gt?: Maybe<Scalars['BigDecimal']>;
    sharedVestingTokenRevenue_gte?: Maybe<Scalars['BigDecimal']>;
    sharedVestingTokenRevenue_in?: Maybe<Array<Scalars['BigDecimal']>>;
    sharedVestingTokenRevenue_lt?: Maybe<Scalars['BigDecimal']>;
    sharedVestingTokenRevenue_lte?: Maybe<Scalars['BigDecimal']>;
    sharedVestingTokenRevenue_not?: Maybe<Scalars['BigDecimal']>;
    sharedVestingTokenRevenue_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
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
    timestamp?: Maybe<Scalars['BigInt']>;
    timestamp_gt?: Maybe<Scalars['BigInt']>;
    timestamp_gte?: Maybe<Scalars['BigInt']>;
    timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: Maybe<Scalars['BigInt']>;
    timestamp_lte?: Maybe<Scalars['BigInt']>;
    timestamp_not?: Maybe<Scalars['BigInt']>;
    timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
    totalSupply?: Maybe<Scalars['BigDecimal']>;
    totalSupply_gt?: Maybe<Scalars['BigDecimal']>;
    totalSupply_gte?: Maybe<Scalars['BigDecimal']>;
    totalSupply_in?: Maybe<Array<Scalars['BigDecimal']>>;
    totalSupply_lt?: Maybe<Scalars['BigDecimal']>;
    totalSupply_lte?: Maybe<Scalars['BigDecimal']>;
    totalSupply_not?: Maybe<Scalars['BigDecimal']>;
    totalSupply_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vestingToken?: Maybe<Scalars['Bytes']>;
    vestingTokenStaked?: Maybe<Scalars['BigDecimal']>;
    vestingTokenStaked_gt?: Maybe<Scalars['BigDecimal']>;
    vestingTokenStaked_gte?: Maybe<Scalars['BigDecimal']>;
    vestingTokenStaked_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vestingTokenStaked_lt?: Maybe<Scalars['BigDecimal']>;
    vestingTokenStaked_lte?: Maybe<Scalars['BigDecimal']>;
    vestingTokenStaked_not?: Maybe<Scalars['BigDecimal']>;
    vestingTokenStaked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vestingToken_contains?: Maybe<Scalars['Bytes']>;
    vestingToken_in?: Maybe<Array<Scalars['Bytes']>>;
    vestingToken_not?: Maybe<Scalars['Bytes']>;
    vestingToken_not_contains?: Maybe<Scalars['Bytes']>;
    vestingToken_not_in?: Maybe<Array<Scalars['Bytes']>>;
};

export enum Bar_OrderBy {
    Address = 'address',
    Block = 'block',
    Decimals = 'decimals',
    FBeetsBurned = 'fBeetsBurned',
    FBeetsMinted = 'fBeetsMinted',
    Id = 'id',
    Name = 'name',
    Ratio = 'ratio',
    SharedVestingTokenRevenue = 'sharedVestingTokenRevenue',
    Symbol = 'symbol',
    Timestamp = 'timestamp',
    TotalSupply = 'totalSupply',
    Users = 'users',
    VestingToken = 'vestingToken',
    VestingTokenStaked = 'vestingTokenStaked',
}

export type Block_Height = {
    hash?: Maybe<Scalars['Bytes']>;
    number?: Maybe<Scalars['Int']>;
};

export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    bar?: Maybe<Bar>;
    bars: Array<Bar>;
    user?: Maybe<User>;
    users: Array<User>;
};

export type Query_MetaArgs = {
    block?: Maybe<Block_Height>;
};

export type QueryBarArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryBarsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Bar_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Bar_Filter>;
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

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    bar?: Maybe<Bar>;
    bars: Array<Bar>;
    user?: Maybe<User>;
    users: Array<User>;
};

export type Subscription_MetaArgs = {
    block?: Maybe<Block_Height>;
};

export type SubscriptionBarArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionBarsArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Bar_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Bar_Filter>;
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

export type User = {
    __typename?: 'User';
    address: Scalars['Bytes'];
    bar?: Maybe<Bar>;
    block: Scalars['BigInt'];
    fBeets: Scalars['BigDecimal'];
    id: Scalars['ID'];
    timestamp: Scalars['BigInt'];
    vestingTokenHarvested: Scalars['BigDecimal'];
    vestingTokenIn: Scalars['BigDecimal'];
    vestingTokenOut: Scalars['BigDecimal'];
};

export type User_Filter = {
    address?: Maybe<Scalars['Bytes']>;
    address_contains?: Maybe<Scalars['Bytes']>;
    address_in?: Maybe<Array<Scalars['Bytes']>>;
    address_not?: Maybe<Scalars['Bytes']>;
    address_not_contains?: Maybe<Scalars['Bytes']>;
    address_not_in?: Maybe<Array<Scalars['Bytes']>>;
    bar?: Maybe<Scalars['String']>;
    bar_contains?: Maybe<Scalars['String']>;
    bar_ends_with?: Maybe<Scalars['String']>;
    bar_gt?: Maybe<Scalars['String']>;
    bar_gte?: Maybe<Scalars['String']>;
    bar_in?: Maybe<Array<Scalars['String']>>;
    bar_lt?: Maybe<Scalars['String']>;
    bar_lte?: Maybe<Scalars['String']>;
    bar_not?: Maybe<Scalars['String']>;
    bar_not_contains?: Maybe<Scalars['String']>;
    bar_not_ends_with?: Maybe<Scalars['String']>;
    bar_not_in?: Maybe<Array<Scalars['String']>>;
    bar_not_starts_with?: Maybe<Scalars['String']>;
    bar_starts_with?: Maybe<Scalars['String']>;
    block?: Maybe<Scalars['BigInt']>;
    block_gt?: Maybe<Scalars['BigInt']>;
    block_gte?: Maybe<Scalars['BigInt']>;
    block_in?: Maybe<Array<Scalars['BigInt']>>;
    block_lt?: Maybe<Scalars['BigInt']>;
    block_lte?: Maybe<Scalars['BigInt']>;
    block_not?: Maybe<Scalars['BigInt']>;
    block_not_in?: Maybe<Array<Scalars['BigInt']>>;
    fBeets?: Maybe<Scalars['BigDecimal']>;
    fBeets_gt?: Maybe<Scalars['BigDecimal']>;
    fBeets_gte?: Maybe<Scalars['BigDecimal']>;
    fBeets_in?: Maybe<Array<Scalars['BigDecimal']>>;
    fBeets_lt?: Maybe<Scalars['BigDecimal']>;
    fBeets_lte?: Maybe<Scalars['BigDecimal']>;
    fBeets_not?: Maybe<Scalars['BigDecimal']>;
    fBeets_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    timestamp?: Maybe<Scalars['BigInt']>;
    timestamp_gt?: Maybe<Scalars['BigInt']>;
    timestamp_gte?: Maybe<Scalars['BigInt']>;
    timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: Maybe<Scalars['BigInt']>;
    timestamp_lte?: Maybe<Scalars['BigInt']>;
    timestamp_not?: Maybe<Scalars['BigInt']>;
    timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
    vestingTokenHarvested?: Maybe<Scalars['BigDecimal']>;
    vestingTokenHarvested_gt?: Maybe<Scalars['BigDecimal']>;
    vestingTokenHarvested_gte?: Maybe<Scalars['BigDecimal']>;
    vestingTokenHarvested_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vestingTokenHarvested_lt?: Maybe<Scalars['BigDecimal']>;
    vestingTokenHarvested_lte?: Maybe<Scalars['BigDecimal']>;
    vestingTokenHarvested_not?: Maybe<Scalars['BigDecimal']>;
    vestingTokenHarvested_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vestingTokenIn?: Maybe<Scalars['BigDecimal']>;
    vestingTokenIn_gt?: Maybe<Scalars['BigDecimal']>;
    vestingTokenIn_gte?: Maybe<Scalars['BigDecimal']>;
    vestingTokenIn_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vestingTokenIn_lt?: Maybe<Scalars['BigDecimal']>;
    vestingTokenIn_lte?: Maybe<Scalars['BigDecimal']>;
    vestingTokenIn_not?: Maybe<Scalars['BigDecimal']>;
    vestingTokenIn_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vestingTokenOut?: Maybe<Scalars['BigDecimal']>;
    vestingTokenOut_gt?: Maybe<Scalars['BigDecimal']>;
    vestingTokenOut_gte?: Maybe<Scalars['BigDecimal']>;
    vestingTokenOut_in?: Maybe<Array<Scalars['BigDecimal']>>;
    vestingTokenOut_lt?: Maybe<Scalars['BigDecimal']>;
    vestingTokenOut_lte?: Maybe<Scalars['BigDecimal']>;
    vestingTokenOut_not?: Maybe<Scalars['BigDecimal']>;
    vestingTokenOut_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum User_OrderBy {
    Address = 'address',
    Bar = 'bar',
    Block = 'block',
    FBeets = 'fBeets',
    Id = 'id',
    Timestamp = 'timestamp',
    VestingTokenHarvested = 'vestingTokenHarvested',
    VestingTokenIn = 'vestingTokenIn',
    VestingTokenOut = 'vestingTokenOut',
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

export type GetBeetsBarQueryVariables = Exact<{
    id: Scalars['ID'];
    block?: Maybe<Block_Height>;
}>;

export type GetBeetsBarQuery = {
    __typename?: 'Query';
    bar?:
        | {
              __typename?: 'Bar';
              id: string;
              address: string;
              block: string;
              decimals: number;
              fBeetsBurned: string;
              fBeetsMinted: string;
              name: string;
              ratio: string;
              sharedVestingTokenRevenue: string;
              symbol: string;
              timestamp: string;
              totalSupply: string;
              vestingToken: string;
              vestingTokenStaked: string;
          }
        | null
        | undefined;
};

export type GetBeetsBarUserQueryVariables = Exact<{
    id: Scalars['ID'];
    block?: Maybe<Block_Height>;
}>;

export type GetBeetsBarUserQuery = {
    __typename?: 'Query';
    user?:
        | {
              __typename?: 'User';
              id: string;
              address: string;
              block: string;
              fBeets: string;
              timestamp: string;
              vestingTokenHarvested: string;
              vestingTokenIn: string;
              vestingTokenOut: string;
          }
        | null
        | undefined;
};

export type BeetsBarUsersQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<User_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<User_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BeetsBarUsersQuery = {
    __typename?: 'Query';
    users: Array<{
        __typename?: 'User';
        id: string;
        address: string;
        block: string;
        fBeets: string;
        timestamp: string;
        vestingTokenHarvested: string;
        vestingTokenIn: string;
        vestingTokenOut: string;
    }>;
};

export type BeetsBarFragment = {
    __typename?: 'Bar';
    id: string;
    address: string;
    block: string;
    decimals: number;
    fBeetsBurned: string;
    fBeetsMinted: string;
    name: string;
    ratio: string;
    sharedVestingTokenRevenue: string;
    symbol: string;
    timestamp: string;
    totalSupply: string;
    vestingToken: string;
    vestingTokenStaked: string;
};

export type BeetsBarUserFragment = {
    __typename?: 'User';
    id: string;
    address: string;
    block: string;
    fBeets: string;
    timestamp: string;
    vestingTokenHarvested: string;
    vestingTokenIn: string;
    vestingTokenOut: string;
};

export type BeetsBarPortfolioDataQueryVariables = Exact<{
    barId: Scalars['ID'];
    userAddress: Scalars['ID'];
    previousBlockNumber: Scalars['Int'];
}>;

export type BeetsBarPortfolioDataQuery = {
    __typename?: 'Query';
    beetsBar?:
        | {
              __typename?: 'Bar';
              id: string;
              address: string;
              block: string;
              decimals: number;
              fBeetsBurned: string;
              fBeetsMinted: string;
              name: string;
              ratio: string;
              sharedVestingTokenRevenue: string;
              symbol: string;
              timestamp: string;
              totalSupply: string;
              vestingToken: string;
              vestingTokenStaked: string;
          }
        | null
        | undefined;
    previousBeetsBar?:
        | {
              __typename?: 'Bar';
              id: string;
              address: string;
              block: string;
              decimals: number;
              fBeetsBurned: string;
              fBeetsMinted: string;
              name: string;
              ratio: string;
              sharedVestingTokenRevenue: string;
              symbol: string;
              timestamp: string;
              totalSupply: string;
              vestingToken: string;
              vestingTokenStaked: string;
          }
        | null
        | undefined;
    beetsBarUser?:
        | {
              __typename?: 'User';
              id: string;
              address: string;
              block: string;
              fBeets: string;
              timestamp: string;
              vestingTokenHarvested: string;
              vestingTokenIn: string;
              vestingTokenOut: string;
          }
        | null
        | undefined;
    previousBeetsBarUser?:
        | {
              __typename?: 'User';
              id: string;
              address: string;
              block: string;
              fBeets: string;
              timestamp: string;
              vestingTokenHarvested: string;
              vestingTokenIn: string;
              vestingTokenOut: string;
          }
        | null
        | undefined;
};

export const BeetsBarFragmentDoc = gql`
    fragment BeetsBar on Bar {
        id
        address
        block
        decimals
        fBeetsBurned
        fBeetsMinted
        name
        ratio
        sharedVestingTokenRevenue
        symbol
        timestamp
        totalSupply
        vestingToken
        vestingTokenStaked
    }
`;
export const BeetsBarUserFragmentDoc = gql`
    fragment BeetsBarUser on User {
        id
        address
        block
        fBeets
        timestamp
        vestingTokenHarvested
        vestingTokenIn
        vestingTokenOut
    }
`;
export const GetBeetsBarDocument = gql`
    query GetBeetsBar($id: ID!, $block: Block_height) {
        bar(id: $id, block: $block) {
            ...BeetsBar
        }
    }
    ${BeetsBarFragmentDoc}
`;
export const GetBeetsBarUserDocument = gql`
    query GetBeetsBarUser($id: ID!, $block: Block_height) {
        user(id: $id, block: $block) {
            ...BeetsBarUser
        }
    }
    ${BeetsBarUserFragmentDoc}
`;
export const BeetsBarUsersDocument = gql`
    query BeetsBarUsers(
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
            ...BeetsBarUser
        }
    }
    ${BeetsBarUserFragmentDoc}
`;
export const BeetsBarPortfolioDataDocument = gql`
    query BeetsBarPortfolioData($barId: ID!, $userAddress: ID!, $previousBlockNumber: Int!) {
        beetsBar: bar(id: $barId) {
            ...BeetsBar
        }
        previousBeetsBar: bar(id: $barId, block: { number: $previousBlockNumber }) {
            ...BeetsBar
        }
        beetsBarUser: user(id: $userAddress) {
            ...BeetsBarUser
        }
        previousBeetsBarUser: user(id: $userAddress, block: { number: $previousBlockNumber }) {
            ...BeetsBarUser
        }
    }
    ${BeetsBarFragmentDoc}
    ${BeetsBarUserFragmentDoc}
`;

export type SdkFunctionWrapper = <T>(
    action: (requestHeaders?: Record<string, string>) => Promise<T>,
    operationName: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        GetBeetsBar(
            variables: GetBeetsBarQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GetBeetsBarQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GetBeetsBarQuery>(GetBeetsBarDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GetBeetsBar',
            );
        },
        GetBeetsBarUser(
            variables: GetBeetsBarUserQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<GetBeetsBarUserQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<GetBeetsBarUserQuery>(GetBeetsBarUserDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'GetBeetsBarUser',
            );
        },
        BeetsBarUsers(
            variables?: BeetsBarUsersQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BeetsBarUsersQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BeetsBarUsersQuery>(BeetsBarUsersDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BeetsBarUsers',
            );
        },
        BeetsBarPortfolioData(
            variables: BeetsBarPortfolioDataQueryVariables,
            requestHeaders?: Dom.RequestInit['headers'],
        ): Promise<BeetsBarPortfolioDataQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BeetsBarPortfolioDataQuery>(BeetsBarPortfolioDataDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'BeetsBarPortfolioData',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
