import { GraphQLClient } from 'graphql-request';
import { subgraphLoadAll } from '../subgraph-util';
import {
    BeetsBarFragment,
    BeetsBarUserFragment,
    BeetsBarUsersQueryVariables,
    getSdk,
} from './generated/beets-bar-subgraph-types';
import { Cache, CacheClass } from 'memory-cache';
import { twentyFourHoursInMs } from '../../common/time';
import { networkConfig } from '../../config/network-config';

const ALL_USERS_CACHE_KEY = 'beets-bar-subgraph_all-users';
const BEETS_BAR_CACHE_KEY_PREFIX = 'beets-bar:';
const BEETS_BAR_NOW_CACHE_KEY = 'beets-bar-now';

export class BeetsBarSubgraphService {
    cache: CacheClass<string, any>;
    private readonly client: GraphQLClient;

    constructor(private readonly fbeetsAddress: string, beetsBarSubgraph: string) {
        this.cache = new Cache<string, any>();
        this.client = new GraphQLClient(beetsBarSubgraph);
    }

    public async getMetadata() {
        const { meta } = await this.sdk.BeetsBarGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }

        return meta;
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
                barId: this.fbeetsAddress,
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
        if (block) {
            const cached = this.cache.get(`${BEETS_BAR_CACHE_KEY_PREFIX}:${block}`) as BeetsBarFragment | null;

            if (cached) {
                return cached;
            }
        }

        const { bar } = await this.sdk.GetBeetsBar({ id: this.fbeetsAddress, block: { number: block } });

        this.cache.put(`${BEETS_BAR_CACHE_KEY_PREFIX}:${block}`, bar ?? this.emptyBeetsBar, twentyFourHoursInMs);

        if (!bar) {
            return this.emptyBeetsBar;
        }

        return bar;
    }

    public async getBeetsBarNow(): Promise<BeetsBarFragment> {
        const cached = this.cache.get(`${BEETS_BAR_NOW_CACHE_KEY}`) as BeetsBarFragment | null;

        if (cached) {
            return cached;
        }

        const { bar } = await this.sdk.GetBeetsBar({ id: this.fbeetsAddress });

        if (!bar) {
            return this.emptyBeetsBar;
        }

        this.cache.put(`${BEETS_BAR_NOW_CACHE_KEY}`, bar, 60000);

        return bar;
    }

    public async getUser(userAddress: string): Promise<BeetsBarUserFragment | null> {
        const { users } = await this.sdk.BeetsBarUsers({ where: { address: userAddress.toLowerCase() } });

        return users[0] || null;
    }

    public async getAllUsers(args: BeetsBarUsersQueryVariables): Promise<BeetsBarUserFragment[]> {
        return subgraphLoadAll<BeetsBarUserFragment>(this.sdk.BeetsBarUsers, 'users', args);
    }

    public async getUserAtBlock(address: string, block: number): Promise<BeetsBarUserFragment | null> {
        const cachedUsers = this.cache.get(`${ALL_USERS_CACHE_KEY}:${block}`) as BeetsBarUserFragment[] | null;

        if (cachedUsers) {
            return cachedUsers.find((user) => user.id === address) || null;
        }

        const users = await this.getAllUsers({ block: { number: block } });

        this.cache.put(`${ALL_USERS_CACHE_KEY}:${block}`, users, twentyFourHoursInMs);

        return users.find((user) => user.id === address) || null;
    }

    private get sdk() {
        return getSdk(this.client);
    }

    private get emptyBeetsBar(): BeetsBarFragment {
        return {
            id: this.fbeetsAddress,
            address: this.fbeetsAddress,
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

export const beetsBarService = new BeetsBarSubgraphService(
    networkConfig.fbeets?.address ?? '',
    networkConfig.subgraphs.beetsBar ?? '',
);
