import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/balancer-subgraph-types';

export type V2VaultSubgraphClient = ReturnType<typeof getV2SubgraphClient>;

export function getV2SubgraphClient(url: string) {
    const sdk = getSdk(new GraphQLClient(url));

    return {
        ...sdk,
    };
}
