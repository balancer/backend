import { GraphQLClient } from 'graphql-request';
import { env } from '../../app/env';
import { subgraphLoadAll } from '../util/subgraph-util';
import {
    getSdk,
    LockerPartialFragment,
    QueryLockersArgs,
    QueryRewardTokensArgs,
    QueryUserArgs,
    QueryUsersArgs,
    RewardTokensQuery,
    UserPartialFragment,
    UserQuery,
    UsersQuery,
} from './generated/locking-subgraph-types';

export class LockingSubgraph {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(env.LOCKING_SUBGRAPH);
    }

    public async getLocker(args: QueryLockersArgs): Promise<LockerPartialFragment> {
        const response = await this.sdk.Lockers(args);

        if (!response || response.lockers.length === 0) {
            throw new Error('Missing locker');
        }

        //There is only ever one
        return response.lockers[0];
    }

    public async getUsers(args: QueryUsersArgs): Promise<UsersQuery> {
        return this.sdk.Users(args);
    }

    public async getAllUsers(args: QueryUsersArgs): Promise<UserPartialFragment[]> {
        return subgraphLoadAll(this.sdk.Users, 'users', args);
    }

    public async getUser(args: QueryUserArgs): Promise<UserQuery> {
        return this.sdk.User(args);
    }

    public async getRewardTokens(args: QueryRewardTokensArgs): Promise<RewardTokensQuery> {
        return this.sdk.RewardTokens(args);
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const lockingSubgraph = new LockingSubgraph();
