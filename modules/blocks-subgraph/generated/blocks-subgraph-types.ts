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

export type Block = {
    __typename?: 'Block';
    author?: Maybe<Scalars['String']>;
    difficulty?: Maybe<Scalars['BigInt']>;
    gasLimit?: Maybe<Scalars['BigInt']>;
    gasUsed?: Maybe<Scalars['BigInt']>;
    id: Scalars['ID'];
    number: Scalars['BigInt'];
    parentHash?: Maybe<Scalars['String']>;
    receiptsRoot?: Maybe<Scalars['String']>;
    size?: Maybe<Scalars['BigInt']>;
    stateRoot?: Maybe<Scalars['String']>;
    timestamp: Scalars['BigInt'];
    totalDifficulty?: Maybe<Scalars['BigInt']>;
    transactionsRoot?: Maybe<Scalars['String']>;
    unclesHash?: Maybe<Scalars['String']>;
};

export type Block_Filter = {
    author?: Maybe<Scalars['String']>;
    author_contains?: Maybe<Scalars['String']>;
    author_ends_with?: Maybe<Scalars['String']>;
    author_gt?: Maybe<Scalars['String']>;
    author_gte?: Maybe<Scalars['String']>;
    author_in?: Maybe<Array<Scalars['String']>>;
    author_lt?: Maybe<Scalars['String']>;
    author_lte?: Maybe<Scalars['String']>;
    author_not?: Maybe<Scalars['String']>;
    author_not_contains?: Maybe<Scalars['String']>;
    author_not_ends_with?: Maybe<Scalars['String']>;
    author_not_in?: Maybe<Array<Scalars['String']>>;
    author_not_starts_with?: Maybe<Scalars['String']>;
    author_starts_with?: Maybe<Scalars['String']>;
    difficulty?: Maybe<Scalars['BigInt']>;
    difficulty_gt?: Maybe<Scalars['BigInt']>;
    difficulty_gte?: Maybe<Scalars['BigInt']>;
    difficulty_in?: Maybe<Array<Scalars['BigInt']>>;
    difficulty_lt?: Maybe<Scalars['BigInt']>;
    difficulty_lte?: Maybe<Scalars['BigInt']>;
    difficulty_not?: Maybe<Scalars['BigInt']>;
    difficulty_not_in?: Maybe<Array<Scalars['BigInt']>>;
    gasLimit?: Maybe<Scalars['BigInt']>;
    gasLimit_gt?: Maybe<Scalars['BigInt']>;
    gasLimit_gte?: Maybe<Scalars['BigInt']>;
    gasLimit_in?: Maybe<Array<Scalars['BigInt']>>;
    gasLimit_lt?: Maybe<Scalars['BigInt']>;
    gasLimit_lte?: Maybe<Scalars['BigInt']>;
    gasLimit_not?: Maybe<Scalars['BigInt']>;
    gasLimit_not_in?: Maybe<Array<Scalars['BigInt']>>;
    gasUsed?: Maybe<Scalars['BigInt']>;
    gasUsed_gt?: Maybe<Scalars['BigInt']>;
    gasUsed_gte?: Maybe<Scalars['BigInt']>;
    gasUsed_in?: Maybe<Array<Scalars['BigInt']>>;
    gasUsed_lt?: Maybe<Scalars['BigInt']>;
    gasUsed_lte?: Maybe<Scalars['BigInt']>;
    gasUsed_not?: Maybe<Scalars['BigInt']>;
    gasUsed_not_in?: Maybe<Array<Scalars['BigInt']>>;
    id?: Maybe<Scalars['ID']>;
    id_gt?: Maybe<Scalars['ID']>;
    id_gte?: Maybe<Scalars['ID']>;
    id_in?: Maybe<Array<Scalars['ID']>>;
    id_lt?: Maybe<Scalars['ID']>;
    id_lte?: Maybe<Scalars['ID']>;
    id_not?: Maybe<Scalars['ID']>;
    id_not_in?: Maybe<Array<Scalars['ID']>>;
    number?: Maybe<Scalars['BigInt']>;
    number_gt?: Maybe<Scalars['BigInt']>;
    number_gte?: Maybe<Scalars['BigInt']>;
    number_in?: Maybe<Array<Scalars['BigInt']>>;
    number_lt?: Maybe<Scalars['BigInt']>;
    number_lte?: Maybe<Scalars['BigInt']>;
    number_not?: Maybe<Scalars['BigInt']>;
    number_not_in?: Maybe<Array<Scalars['BigInt']>>;
    parentHash?: Maybe<Scalars['String']>;
    parentHash_contains?: Maybe<Scalars['String']>;
    parentHash_ends_with?: Maybe<Scalars['String']>;
    parentHash_gt?: Maybe<Scalars['String']>;
    parentHash_gte?: Maybe<Scalars['String']>;
    parentHash_in?: Maybe<Array<Scalars['String']>>;
    parentHash_lt?: Maybe<Scalars['String']>;
    parentHash_lte?: Maybe<Scalars['String']>;
    parentHash_not?: Maybe<Scalars['String']>;
    parentHash_not_contains?: Maybe<Scalars['String']>;
    parentHash_not_ends_with?: Maybe<Scalars['String']>;
    parentHash_not_in?: Maybe<Array<Scalars['String']>>;
    parentHash_not_starts_with?: Maybe<Scalars['String']>;
    parentHash_starts_with?: Maybe<Scalars['String']>;
    receiptsRoot?: Maybe<Scalars['String']>;
    receiptsRoot_contains?: Maybe<Scalars['String']>;
    receiptsRoot_ends_with?: Maybe<Scalars['String']>;
    receiptsRoot_gt?: Maybe<Scalars['String']>;
    receiptsRoot_gte?: Maybe<Scalars['String']>;
    receiptsRoot_in?: Maybe<Array<Scalars['String']>>;
    receiptsRoot_lt?: Maybe<Scalars['String']>;
    receiptsRoot_lte?: Maybe<Scalars['String']>;
    receiptsRoot_not?: Maybe<Scalars['String']>;
    receiptsRoot_not_contains?: Maybe<Scalars['String']>;
    receiptsRoot_not_ends_with?: Maybe<Scalars['String']>;
    receiptsRoot_not_in?: Maybe<Array<Scalars['String']>>;
    receiptsRoot_not_starts_with?: Maybe<Scalars['String']>;
    receiptsRoot_starts_with?: Maybe<Scalars['String']>;
    size?: Maybe<Scalars['BigInt']>;
    size_gt?: Maybe<Scalars['BigInt']>;
    size_gte?: Maybe<Scalars['BigInt']>;
    size_in?: Maybe<Array<Scalars['BigInt']>>;
    size_lt?: Maybe<Scalars['BigInt']>;
    size_lte?: Maybe<Scalars['BigInt']>;
    size_not?: Maybe<Scalars['BigInt']>;
    size_not_in?: Maybe<Array<Scalars['BigInt']>>;
    stateRoot?: Maybe<Scalars['String']>;
    stateRoot_contains?: Maybe<Scalars['String']>;
    stateRoot_ends_with?: Maybe<Scalars['String']>;
    stateRoot_gt?: Maybe<Scalars['String']>;
    stateRoot_gte?: Maybe<Scalars['String']>;
    stateRoot_in?: Maybe<Array<Scalars['String']>>;
    stateRoot_lt?: Maybe<Scalars['String']>;
    stateRoot_lte?: Maybe<Scalars['String']>;
    stateRoot_not?: Maybe<Scalars['String']>;
    stateRoot_not_contains?: Maybe<Scalars['String']>;
    stateRoot_not_ends_with?: Maybe<Scalars['String']>;
    stateRoot_not_in?: Maybe<Array<Scalars['String']>>;
    stateRoot_not_starts_with?: Maybe<Scalars['String']>;
    stateRoot_starts_with?: Maybe<Scalars['String']>;
    timestamp?: Maybe<Scalars['BigInt']>;
    timestamp_gt?: Maybe<Scalars['BigInt']>;
    timestamp_gte?: Maybe<Scalars['BigInt']>;
    timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: Maybe<Scalars['BigInt']>;
    timestamp_lte?: Maybe<Scalars['BigInt']>;
    timestamp_not?: Maybe<Scalars['BigInt']>;
    timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
    totalDifficulty?: Maybe<Scalars['BigInt']>;
    totalDifficulty_gt?: Maybe<Scalars['BigInt']>;
    totalDifficulty_gte?: Maybe<Scalars['BigInt']>;
    totalDifficulty_in?: Maybe<Array<Scalars['BigInt']>>;
    totalDifficulty_lt?: Maybe<Scalars['BigInt']>;
    totalDifficulty_lte?: Maybe<Scalars['BigInt']>;
    totalDifficulty_not?: Maybe<Scalars['BigInt']>;
    totalDifficulty_not_in?: Maybe<Array<Scalars['BigInt']>>;
    transactionsRoot?: Maybe<Scalars['String']>;
    transactionsRoot_contains?: Maybe<Scalars['String']>;
    transactionsRoot_ends_with?: Maybe<Scalars['String']>;
    transactionsRoot_gt?: Maybe<Scalars['String']>;
    transactionsRoot_gte?: Maybe<Scalars['String']>;
    transactionsRoot_in?: Maybe<Array<Scalars['String']>>;
    transactionsRoot_lt?: Maybe<Scalars['String']>;
    transactionsRoot_lte?: Maybe<Scalars['String']>;
    transactionsRoot_not?: Maybe<Scalars['String']>;
    transactionsRoot_not_contains?: Maybe<Scalars['String']>;
    transactionsRoot_not_ends_with?: Maybe<Scalars['String']>;
    transactionsRoot_not_in?: Maybe<Array<Scalars['String']>>;
    transactionsRoot_not_starts_with?: Maybe<Scalars['String']>;
    transactionsRoot_starts_with?: Maybe<Scalars['String']>;
    unclesHash?: Maybe<Scalars['String']>;
    unclesHash_contains?: Maybe<Scalars['String']>;
    unclesHash_ends_with?: Maybe<Scalars['String']>;
    unclesHash_gt?: Maybe<Scalars['String']>;
    unclesHash_gte?: Maybe<Scalars['String']>;
    unclesHash_in?: Maybe<Array<Scalars['String']>>;
    unclesHash_lt?: Maybe<Scalars['String']>;
    unclesHash_lte?: Maybe<Scalars['String']>;
    unclesHash_not?: Maybe<Scalars['String']>;
    unclesHash_not_contains?: Maybe<Scalars['String']>;
    unclesHash_not_ends_with?: Maybe<Scalars['String']>;
    unclesHash_not_in?: Maybe<Array<Scalars['String']>>;
    unclesHash_not_starts_with?: Maybe<Scalars['String']>;
    unclesHash_starts_with?: Maybe<Scalars['String']>;
};

export type Block_Height = {
    hash?: Maybe<Scalars['Bytes']>;
    number?: Maybe<Scalars['Int']>;
};

export enum Block_OrderBy {
    Author = 'author',
    Difficulty = 'difficulty',
    GasLimit = 'gasLimit',
    GasUsed = 'gasUsed',
    Id = 'id',
    Number = 'number',
    ParentHash = 'parentHash',
    ReceiptsRoot = 'receiptsRoot',
    Size = 'size',
    StateRoot = 'stateRoot',
    Timestamp = 'timestamp',
    TotalDifficulty = 'totalDifficulty',
    TransactionsRoot = 'transactionsRoot',
    UnclesHash = 'unclesHash',
}

export type Mutation = {
    __typename?: 'Mutation';
    someMutation: Scalars['Boolean'];
};

export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
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
    block?: Maybe<Block>;
    blocks: Array<Block>;
    portfolioGetPortfolio: Portfolio;
};

export type Query_MetaArgs = {
    block?: Maybe<Block_Height>;
};

export type QueryBlockArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type QueryBlocksArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Block_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Block_Filter>;
};

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    block?: Maybe<Block>;
    blocks: Array<Block>;
};

export type Subscription_MetaArgs = {
    block?: Maybe<Block_Height>;
};

export type SubscriptionBlockArgs = {
    block?: Maybe<Block_Height>;
    id: Scalars['ID'];
};

export type SubscriptionBlocksArgs = {
    block?: Maybe<Block_Height>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Block_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    skip?: Maybe<Scalars['Int']>;
    where?: Maybe<Block_Filter>;
};

export type TranslatedString = {
    __typename?: 'TranslatedString';
    de: Scalars['String'];
    en: Scalars['String'];
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

export type BlocksQueryVariables = Exact<{
    skip?: Maybe<Scalars['Int']>;
    first?: Maybe<Scalars['Int']>;
    orderBy?: Maybe<Block_OrderBy>;
    orderDirection?: Maybe<OrderDirection>;
    where?: Maybe<Block_Filter>;
    block?: Maybe<Block_Height>;
}>;

export type BlocksQuery = {
    __typename?: 'Query';
    blocks: Array<{ __typename?: 'Block'; id: string; number: string; timestamp: string }>;
};

export const BlocksDocument = gql`
    query Blocks(
        $skip: Int
        $first: Int
        $orderBy: Block_orderBy
        $orderDirection: OrderDirection
        $where: Block_filter
        $block: Block_height
    ) {
        blocks(
            skip: $skip
            first: $first
            orderBy: $orderBy
            orderDirection: $orderDirection
            where: $where
            block: $block
        ) {
            id
            number
            timestamp
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
        Blocks(variables?: BlocksQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<BlocksQuery> {
            return withWrapper(
                (wrappedRequestHeaders) =>
                    client.request<BlocksQuery>(BlocksDocument, variables, {
                        ...requestHeaders,
                        ...wrappedRequestHeaders,
                    }),
                'Blocks',
            );
        },
    };
}
export type Sdk = ReturnType<typeof getSdk>;
