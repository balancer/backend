import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/types';

/**
 * Builds a client based on subgraph URL.
 *
 * @param subgraphUrl - url of the subgraph
 * @returns sdk - generated sdk for the subgraph
 */
export const getPoolsSubgraphClient = (subgraphUrl: string) => {
    const client = new GraphQLClient(subgraphUrl);
    const sdk = getSdk(client);

    return sdk;
};

export type V3PoolsSubgraphClient = ReturnType<typeof getPoolsSubgraphClient>;
