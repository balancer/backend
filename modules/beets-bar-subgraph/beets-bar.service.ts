import { GraphQLClient } from 'graphql-request';
import { env } from '../../app/env';
import { subgraphLoadAll, subgraphLoadAllAtBlock, subgraphPurgeCacheKeyAtBlock } from '../util/subgraph-util';
import {
    BeetsBarFragment,
    BeetsBarUserFragment,
    BeetsBarUsersQueryVariables,
    getSdk,
} from './generated/beets-bar-subgraph-types';

const ALL_USERS_CACHE_KEY = 'beets-bar-subgraph_all-users';

export class BeetsBarSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(env.BEETS_BAR_SUBGRAPH);
    }

    public async getPortfolioData(
        userAddress: string,
        previousBlockNumber: number,
    ): Promise<{
        beetsBar: BeetsBarFragment;
        previousBeetsBar: BeetsBarFragment;
        beetsBarUser: BeetsBarUserFragment | null;
        previousBeetsBarUser: BeetsBarUserFragment | null;
    }> {
        const { beetsBarUser, beetsBar, previousBeetsBarUser, previousBeetsBar } = await this.sdk.BeetsBarPortfolioData(
            {
                barId: env.FBEETS_ADDRESS,
                userAddress,
                previousBlockNumber,
            },
        );

        return {
            beetsBar: beetsBar || this.emptyBeetsBar,
            beetsBarUser: beetsBarUser || null,
            previousBeetsBar: previousBeetsBar || this.emptyBeetsBar,
            previousBeetsBarUser: previousBeetsBarUser || null,
        };
    }

    public async getBeetsBar(block?: number): Promise<BeetsBarFragment> {
        const { bar } = await this.sdk.GetBeetsBar({ id: env.FBEETS_ADDRESS, block: { number: block } });

        if (!bar) {
            return this.emptyBeetsBar;
        }

        return bar;
    }

    public async getAllUsers(args: BeetsBarUsersQueryVariables): Promise<BeetsBarUserFragment[]> {
        return subgraphLoadAll<BeetsBarUserFragment>(this.sdk.BeetsBarUsers, 'users', args);
    }

    public async getUserAtBlock(address: string, block: number): Promise<BeetsBarUserFragment | null> {
        const users = await this.getAllUsersAtBlock(block);

        return users.find((user) => user.id === address) || null;
    }

    public async getAllUsersAtBlock(block: number): Promise<BeetsBarUserFragment[]> {
        return subgraphLoadAllAtBlock<BeetsBarUserFragment>(
            this.sdk.BeetsBarUsers,
            'users',
            block,
            ALL_USERS_CACHE_KEY,
        );
    }

    public async clearCacheAtBlock(block: number) {
        await subgraphPurgeCacheKeyAtBlock(ALL_USERS_CACHE_KEY, block);
    }

    private get sdk() {
        return getSdk(this.client);
    }

    private get emptyBeetsBar(): BeetsBarFragment {
        return {
            id: env.FBEETS_ADDRESS,
            address: env.FBEETS_ADDRESS,
            block: '',
            decimals: 19,
            fBeetsBurned: '0',
            fBeetsMinted: '0',
            name: '',
            ratio: '1',
            sharedVestingTokenRevenue: '0',
            symbol: 'fBEETS',
            timestamp: '',
            totalSupply: '0',
            vestingToken: '0',
            vestingTokenStaked: '0',
        };
    }
}

export const beetsBarService = new BeetsBarSubgraphService();
