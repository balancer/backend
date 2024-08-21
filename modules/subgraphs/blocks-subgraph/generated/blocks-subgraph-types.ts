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

export type Block = {
    __typename?: 'Block';
    /**  address of the beneficiary to whom the mining rewards were given  */
    author: Scalars['Bytes'];
    /**  the minimum gas fee a user must pay to include a transaction in the block  */
    baseFeePerGas?: Maybe<Scalars['BigInt']>;
    /**  number of leading zeroes that are required in the resulting block hash for it to be considered valid - PoW only */
    difficulty: Scalars['BigInt'];
    /**  maximum gas allowed in this block  */
    gasLimit: Scalars['BigInt'];
    /**  the actual amount of gas used in this block  */
    gasUsed: Scalars['BigInt'];
    /**  the block hash  */
    hash: Scalars['Bytes'];
    /**  the block hash  */
    id: Scalars['ID'];
    /**  the block number  */
    number: Scalars['BigInt'];
    /**  hash of the parent block  */
    parentHash: Scalars['Bytes'];
    /**  hash of the transaction receipts trie  */
    receiptsRoot: Scalars['Bytes'];
    /**  the size of the block in bytes  */
    size?: Maybe<Scalars['BigInt']>;
    /**  root hash for the global state after applying changes in this block  */
    stateRoot: Scalars['Bytes'];
    /**  the block time  */
    timestamp: Scalars['BigInt'];
    /**  the sum of the Ethash mining difficulty for all blocks up to some specific point in the blockchain  */
    totalDifficulty: Scalars['BigInt'];
    /**  root hash of the transactions in the payload  */
    transactionsRoot: Scalars['Bytes'];
    /**  hash of the uncle block */
    unclesHash: Scalars['Bytes'];
};

export type BlockChangedFilter = {
    number_gte: Scalars['Int'];
};

export type Block_Filter = {
    /** Filter for the block changed event. */
    _change_block?: InputMaybe<BlockChangedFilter>;
    and?: InputMaybe<Array<InputMaybe<Block_Filter>>>;
    author?: InputMaybe<Scalars['Bytes']>;
    author_contains?: InputMaybe<Scalars['Bytes']>;
    author_gt?: InputMaybe<Scalars['Bytes']>;
    author_gte?: InputMaybe<Scalars['Bytes']>;
    author_in?: InputMaybe<Array<Scalars['Bytes']>>;
    author_lt?: InputMaybe<Scalars['Bytes']>;
    author_lte?: InputMaybe<Scalars['Bytes']>;
    author_not?: InputMaybe<Scalars['Bytes']>;
    author_not_contains?: InputMaybe<Scalars['Bytes']>;
    author_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    baseFeePerGas?: InputMaybe<Scalars['BigInt']>;
    baseFeePerGas_gt?: InputMaybe<Scalars['BigInt']>;
    baseFeePerGas_gte?: InputMaybe<Scalars['BigInt']>;
    baseFeePerGas_in?: InputMaybe<Array<Scalars['BigInt']>>;
    baseFeePerGas_lt?: InputMaybe<Scalars['BigInt']>;
    baseFeePerGas_lte?: InputMaybe<Scalars['BigInt']>;
    baseFeePerGas_not?: InputMaybe<Scalars['BigInt']>;
    baseFeePerGas_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    difficulty?: InputMaybe<Scalars['BigInt']>;
    difficulty_gt?: InputMaybe<Scalars['BigInt']>;
    difficulty_gte?: InputMaybe<Scalars['BigInt']>;
    difficulty_in?: InputMaybe<Array<Scalars['BigInt']>>;
    difficulty_lt?: InputMaybe<Scalars['BigInt']>;
    difficulty_lte?: InputMaybe<Scalars['BigInt']>;
    difficulty_not?: InputMaybe<Scalars['BigInt']>;
    difficulty_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    gasLimit?: InputMaybe<Scalars['BigInt']>;
    gasLimit_gt?: InputMaybe<Scalars['BigInt']>;
    gasLimit_gte?: InputMaybe<Scalars['BigInt']>;
    gasLimit_in?: InputMaybe<Array<Scalars['BigInt']>>;
    gasLimit_lt?: InputMaybe<Scalars['BigInt']>;
    gasLimit_lte?: InputMaybe<Scalars['BigInt']>;
    gasLimit_not?: InputMaybe<Scalars['BigInt']>;
    gasLimit_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    gasUsed?: InputMaybe<Scalars['BigInt']>;
    gasUsed_gt?: InputMaybe<Scalars['BigInt']>;
    gasUsed_gte?: InputMaybe<Scalars['BigInt']>;
    gasUsed_in?: InputMaybe<Array<Scalars['BigInt']>>;
    gasUsed_lt?: InputMaybe<Scalars['BigInt']>;
    gasUsed_lte?: InputMaybe<Scalars['BigInt']>;
    gasUsed_not?: InputMaybe<Scalars['BigInt']>;
    gasUsed_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    hash?: InputMaybe<Scalars['Bytes']>;
    hash_contains?: InputMaybe<Scalars['Bytes']>;
    hash_gt?: InputMaybe<Scalars['Bytes']>;
    hash_gte?: InputMaybe<Scalars['Bytes']>;
    hash_in?: InputMaybe<Array<Scalars['Bytes']>>;
    hash_lt?: InputMaybe<Scalars['Bytes']>;
    hash_lte?: InputMaybe<Scalars['Bytes']>;
    hash_not?: InputMaybe<Scalars['Bytes']>;
    hash_not_contains?: InputMaybe<Scalars['Bytes']>;
    hash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    id?: InputMaybe<Scalars['ID']>;
    id_gt?: InputMaybe<Scalars['ID']>;
    id_gte?: InputMaybe<Scalars['ID']>;
    id_in?: InputMaybe<Array<Scalars['ID']>>;
    id_lt?: InputMaybe<Scalars['ID']>;
    id_lte?: InputMaybe<Scalars['ID']>;
    id_not?: InputMaybe<Scalars['ID']>;
    id_not_in?: InputMaybe<Array<Scalars['ID']>>;
    number?: InputMaybe<Scalars['BigInt']>;
    number_gt?: InputMaybe<Scalars['BigInt']>;
    number_gte?: InputMaybe<Scalars['BigInt']>;
    number_in?: InputMaybe<Array<Scalars['BigInt']>>;
    number_lt?: InputMaybe<Scalars['BigInt']>;
    number_lte?: InputMaybe<Scalars['BigInt']>;
    number_not?: InputMaybe<Scalars['BigInt']>;
    number_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    or?: InputMaybe<Array<InputMaybe<Block_Filter>>>;
    parentHash?: InputMaybe<Scalars['Bytes']>;
    parentHash_contains?: InputMaybe<Scalars['Bytes']>;
    parentHash_gt?: InputMaybe<Scalars['Bytes']>;
    parentHash_gte?: InputMaybe<Scalars['Bytes']>;
    parentHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
    parentHash_lt?: InputMaybe<Scalars['Bytes']>;
    parentHash_lte?: InputMaybe<Scalars['Bytes']>;
    parentHash_not?: InputMaybe<Scalars['Bytes']>;
    parentHash_not_contains?: InputMaybe<Scalars['Bytes']>;
    parentHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    receiptsRoot?: InputMaybe<Scalars['Bytes']>;
    receiptsRoot_contains?: InputMaybe<Scalars['Bytes']>;
    receiptsRoot_gt?: InputMaybe<Scalars['Bytes']>;
    receiptsRoot_gte?: InputMaybe<Scalars['Bytes']>;
    receiptsRoot_in?: InputMaybe<Array<Scalars['Bytes']>>;
    receiptsRoot_lt?: InputMaybe<Scalars['Bytes']>;
    receiptsRoot_lte?: InputMaybe<Scalars['Bytes']>;
    receiptsRoot_not?: InputMaybe<Scalars['Bytes']>;
    receiptsRoot_not_contains?: InputMaybe<Scalars['Bytes']>;
    receiptsRoot_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    size?: InputMaybe<Scalars['BigInt']>;
    size_gt?: InputMaybe<Scalars['BigInt']>;
    size_gte?: InputMaybe<Scalars['BigInt']>;
    size_in?: InputMaybe<Array<Scalars['BigInt']>>;
    size_lt?: InputMaybe<Scalars['BigInt']>;
    size_lte?: InputMaybe<Scalars['BigInt']>;
    size_not?: InputMaybe<Scalars['BigInt']>;
    size_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    stateRoot?: InputMaybe<Scalars['Bytes']>;
    stateRoot_contains?: InputMaybe<Scalars['Bytes']>;
    stateRoot_gt?: InputMaybe<Scalars['Bytes']>;
    stateRoot_gte?: InputMaybe<Scalars['Bytes']>;
    stateRoot_in?: InputMaybe<Array<Scalars['Bytes']>>;
    stateRoot_lt?: InputMaybe<Scalars['Bytes']>;
    stateRoot_lte?: InputMaybe<Scalars['Bytes']>;
    stateRoot_not?: InputMaybe<Scalars['Bytes']>;
    stateRoot_not_contains?: InputMaybe<Scalars['Bytes']>;
    stateRoot_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    timestamp?: InputMaybe<Scalars['BigInt']>;
    timestamp_gt?: InputMaybe<Scalars['BigInt']>;
    timestamp_gte?: InputMaybe<Scalars['BigInt']>;
    timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
    timestamp_lt?: InputMaybe<Scalars['BigInt']>;
    timestamp_lte?: InputMaybe<Scalars['BigInt']>;
    timestamp_not?: InputMaybe<Scalars['BigInt']>;
    timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    totalDifficulty?: InputMaybe<Scalars['BigInt']>;
    totalDifficulty_gt?: InputMaybe<Scalars['BigInt']>;
    totalDifficulty_gte?: InputMaybe<Scalars['BigInt']>;
    totalDifficulty_in?: InputMaybe<Array<Scalars['BigInt']>>;
    totalDifficulty_lt?: InputMaybe<Scalars['BigInt']>;
    totalDifficulty_lte?: InputMaybe<Scalars['BigInt']>;
    totalDifficulty_not?: InputMaybe<Scalars['BigInt']>;
    totalDifficulty_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
    transactionsRoot?: InputMaybe<Scalars['Bytes']>;
    transactionsRoot_contains?: InputMaybe<Scalars['Bytes']>;
    transactionsRoot_gt?: InputMaybe<Scalars['Bytes']>;
    transactionsRoot_gte?: InputMaybe<Scalars['Bytes']>;
    transactionsRoot_in?: InputMaybe<Array<Scalars['Bytes']>>;
    transactionsRoot_lt?: InputMaybe<Scalars['Bytes']>;
    transactionsRoot_lte?: InputMaybe<Scalars['Bytes']>;
    transactionsRoot_not?: InputMaybe<Scalars['Bytes']>;
    transactionsRoot_not_contains?: InputMaybe<Scalars['Bytes']>;
    transactionsRoot_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
    unclesHash?: InputMaybe<Scalars['Bytes']>;
    unclesHash_contains?: InputMaybe<Scalars['Bytes']>;
    unclesHash_gt?: InputMaybe<Scalars['Bytes']>;
    unclesHash_gte?: InputMaybe<Scalars['Bytes']>;
    unclesHash_in?: InputMaybe<Array<Scalars['Bytes']>>;
    unclesHash_lt?: InputMaybe<Scalars['Bytes']>;
    unclesHash_lte?: InputMaybe<Scalars['Bytes']>;
    unclesHash_not?: InputMaybe<Scalars['Bytes']>;
    unclesHash_not_contains?: InputMaybe<Scalars['Bytes']>;
    unclesHash_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
};

export type Block_Height = {
    hash?: InputMaybe<Scalars['Bytes']>;
    number?: InputMaybe<Scalars['Int']>;
    number_gte?: InputMaybe<Scalars['Int']>;
};

export enum Block_OrderBy {
    Author = 'author',
    BaseFeePerGas = 'baseFeePerGas',
    Difficulty = 'difficulty',
    GasLimit = 'gasLimit',
    GasUsed = 'gasUsed',
    Hash = 'hash',
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

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export type Query = {
    __typename?: 'Query';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    block?: Maybe<Block>;
    blocks: Array<Block>;
};

export type Query_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type QueryBlockArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBlocksArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Block_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Block_Filter>;
};

export type Subscription = {
    __typename?: 'Subscription';
    /** Access to subgraph metadata */
    _meta?: Maybe<_Meta_>;
    block?: Maybe<Block>;
    blocks: Array<Block>;
};

export type Subscription_MetaArgs = {
    block?: InputMaybe<Block_Height>;
};

export type SubscriptionBlockArgs = {
    block?: InputMaybe<Block_Height>;
    id: Scalars['ID'];
    subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionBlocksArgs = {
    block?: InputMaybe<Block_Height>;
    first?: InputMaybe<Scalars['Int']>;
    orderBy?: InputMaybe<Block_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    skip?: InputMaybe<Scalars['Int']>;
    subgraphError?: _SubgraphErrorPolicy_;
    where?: InputMaybe<Block_Filter>;
};

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

export type BlockFragment = { __typename?: 'Block'; id: string; number: string; timestamp: string };

export const BlockFragmentDoc = gql`
    fragment Block on Block {
        id
        number
        timestamp
    }
`;
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
            ...Block
        }
    }
    ${BlockFragmentDoc}
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
