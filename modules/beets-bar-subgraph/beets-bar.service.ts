import { GraphQLClient } from 'graphql-request';
import { env } from '../../app/env';
import { subgraphLoadAll, subgraphPurgeCacheKeyAtBlock } from '../util/subgraph-util';
import {
    BeetsBarFragment,
    BeetsBarUserFragment,
    BeetsBarUsersQueryVariables,
    getSdk,
} from './generated/beets-bar-subgraph-types';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import { Cache, CacheClass } from 'memory-cache';
import { twentyFourHoursInMs } from '../util/time';

const ALL_USERS_CACHE_KEY = 'beets-bar-subgraph_all-users';
const BEETS_BAR_CACHE_KEY_PREFIX = 'beets-bar:';
const FBEETS_APR_CACHE_KEY = 'beets-bar:getFbeetsApr';

export class BeetsBarSubgraphService {
    cache: CacheClass<string, any>;
    private readonly client: GraphQLClient;

    constructor() {
        this.cache = new Cache<string, any>();
        this.client = new GraphQLClient(env.BEETS_BAR_SUBGRAPH);
    }

    public async getFbeetsApr(): Promise<number> {
        const cached = this.cache.get(FBEETS_APR_CACHE_KEY) as number | null;

        if (cached !== null) {
            return cached;
        }

        return this.cacheFbeetsApr();
    }

    public async cacheFbeetsApr(): Promise<number> {
        const blocks = await blocksSubgraphService.getDailyBlocks(30);
        const block = blocks[blocks.length - 1]; //take the block from 30 days ago

        const { beetsBar, previousBeetsBar } = await this.sdk.BeetsBarData({
            barId: env.FBEETS_ADDRESS,
            previousBlockNumber: parseFloat(block.number),
        });
        const ratio = parseFloat(beetsBar?.ratio || '0');
        const prevRatio = parseFloat(previousBeetsBar?.ratio || '1');

        const diff = ratio - prevRatio;
        const estimatedYield = diff * 12;

        this.cache.put(FBEETS_APR_CACHE_KEY, estimatedYield / prevRatio, twentyFourHoursInMs);

        return estimatedYield / prevRatio;
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
        const cached = this.cache.get(`${BEETS_BAR_CACHE_KEY_PREFIX}:${block}`) as BeetsBarFragment | null;

        if (cached) {
            return cached;
        }

        const { bar } = await this.sdk.GetBeetsBar({ id: env.FBEETS_ADDRESS, block: { number: block } });

        this.cache.put(`${BEETS_BAR_CACHE_KEY_PREFIX}:${block}`, bar ?? this.emptyBeetsBar, twentyFourHoursInMs);

        if (!bar) {
            return this.emptyBeetsBar;
        }

        return bar;
    }

    public async getAllUsers(args: BeetsBarUsersQueryVariables): Promise<BeetsBarUserFragment[]> {
        return subgraphLoadAll<BeetsBarUserFragment>(this.sdk.BeetsBarUsers, 'users', args);
    }

    public async getUserAtBlock(address: string, block: number): Promise<BeetsBarUserFragment | null> {
        const { users } = await this.sdk.BeetsBarUsers({ where: { address }, block: { number: block } });

        return users.find((user) => user.id === address) || null;
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
