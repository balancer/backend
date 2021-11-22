import { GraphQLClient } from 'graphql-request';
import { env } from '../../app/env';
import { subgraphLoadAll } from '../util/subgraph-util';
import {
    BeetsBarUserFragment,
    BeetsBarUsersQueryVariables,
    GetBeetsBarQuery,
    GetBeetsBarQueryVariables,
    getSdk,
} from './generated/beets-bar-subgraph-types';

export class BeetsBarSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(env.BEETS_BAR_SUBGRAPH);
    }

    public async getBeetsBar(args: GetBeetsBarQueryVariables): Promise<GetBeetsBarQuery> {
        return this.sdk.GetBeetsBar(args);
    }

    public async getAllUsers(args: BeetsBarUsersQueryVariables): Promise<BeetsBarUserFragment[]> {
        return subgraphLoadAll<BeetsBarUserFragment>(this.sdk.BeetsBarUsers, 'tokenPrices', args);
    }

    private get sdk() {
        return getSdk(this.client);
    }
}

export const beetsBarService = new BeetsBarSubgraphService();
