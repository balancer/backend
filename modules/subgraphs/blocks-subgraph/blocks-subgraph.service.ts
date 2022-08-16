import { GraphQLClient } from 'graphql-request';
import {
    Block_OrderBy,
    BlockFragment,
    BlocksQuery,
    BlocksQueryVariables,
    getSdk,
    OrderDirection,
} from './generated/blocks-subgraph-types';
import {
    fiveMinutesInSeconds,
    getDailyTimestampsForDays,
    getDailyTimestampsWithBuffer,
    oneDayInMinutes,
    secondsPerDay,
    secondsPerYear,
} from '../../common/time';
import { subgraphLoadAll } from '../subgraph-util';
import moment from 'moment-timezone';
import { networkConfig } from '../../config/network-config';
import { Cache, CacheClass } from 'memory-cache';

const DAILY_BLOCKS_CACHE_KEY = 'block-subgraph_daily-blocks';
const AVG_BLOCK_TIME_CACHE_PREFIX = 'block-subgraph:average-block-time';
const BLOCK_24H_AGO = 'block-subgraph:block-24h-ago';

/*const BLOCK_TIME_MAP: { [chainId: string]: number } = {
    '250': 1,
    '4': 15,
};*/

export class BlocksSubgraphService {
    private cache: CacheClass<string, any>;
    private readonly client: GraphQLClient;

    constructor() {
        this.cache = new Cache<string, any>();
        this.client = new GraphQLClient(networkConfig.subgraphs.blocks);
    }

    public async getAverageBlockTime(): Promise<number> {
        const avgBlockTime = await this.cache.get(AVG_BLOCK_TIME_CACHE_PREFIX);

        if (avgBlockTime !== null) {
            return parseFloat(avgBlockTime);
        }

        return this.cacheAverageBlockTime();
    }

    public async cacheAverageBlockTime(): Promise<number> {
        const start = moment().startOf('hour').subtract(6, 'hours').unix();
        const end = moment().startOf('hour').unix();

        let blocks: BlockFragment[] = [];

        for (let i = 0; i < 6; i++) {
            const result = await this.sdk.Blocks({
                first: 1000,
                skip: i * 1000,
                orderBy: Block_OrderBy.Number,
                orderDirection: OrderDirection.Desc,
                where: { timestamp_gt: `${start}`, timestamp_lt: `${end}` },
            });

            if (result.blocks.length === 0) {
                break;
            }

            blocks = [...blocks, ...result.blocks];
        }

        if (blocks.length === 0) {
            console.error('Unable to retrieve the blocks, returning a default value of 1 second per block');
            return 1;
        }

        let timestamp: null | number = null;
        let averageBlockTime = 0;

        for (const block of blocks) {
            if (timestamp !== null) {
                const difference = timestamp - parseInt(block.timestamp);

                averageBlockTime = averageBlockTime + difference;
            }

            timestamp = parseInt(block.timestamp);
        }

        await this.cache.put(AVG_BLOCK_TIME_CACHE_PREFIX, `${averageBlockTime / blocks.length}`);

        return averageBlockTime / blocks.length;
    }

    public async getBlocks(args: BlocksQueryVariables): Promise<BlocksQuery> {
        return this.sdk.Blocks(args);
    }

    public async getLatestBlock(): Promise<number> {
        const { blocks } = await this.getBlocks({
            first: 1,
            orderBy: Block_OrderBy.Number,
            orderDirection: OrderDirection.Desc,
        });

        return blocks.length > 0 ? parseInt(blocks[0].number) : 0;
    }

    public async getAllBlocks(args: BlocksQueryVariables): Promise<BlockFragment[]> {
        return subgraphLoadAll<BlockFragment>(this.sdk.Blocks, 'blocks', args);
    }

    /*public async getHourlyBlocks(numDays: number): Promise<BlockFragment[]> {
        const timestampsWithBuffer = getHourlyTimestampsWithBuffer(numDays);
        const timestamps = getHourlyTimestampsForDays(numDays);
        const blocks: BlockFragment[] = [];

        const allBlocks = await this.getAllBlocks({
            orderDirection: OrderDirection.Desc,
            orderBy: Block_OrderBy.Timestamp,
            where: {
                timestamp_in: timestampsWithBuffer.map((timestamp) => `${timestamp}`),
            },
        });

        for (const timestamp of timestamps) {
            const closest = allBlocks.reduce((a, b) => {
                return Math.abs(parseInt(b.timestamp) - timestamp) < Math.abs(parseInt(a.timestamp) - timestamp)
                    ? b
                    : a;
            });

            //filter out any matches that are further than 5 minutes away.e
            if (Math.abs(timestamp - parseInt(closest.timestamp)) < fiveMinutesInSeconds) {
                blocks.push({ ...closest, timestamp: `${timestamp}` });
            }
        }

        return blocks;
    }*/

    public async getBlockFrom24HoursAgo(): Promise<BlockFragment> {
        const cached = this.cache.get(BLOCK_24H_AGO);

        if (cached) {
            return cached;
        }

        return this.cacheBlockFrom24HoursAgo();
    }

    public async cacheBlockFrom24HoursAgo(): Promise<BlockFragment> {
        const blockTime = networkConfig.avgBlockSpeed;

        const args: BlocksQueryVariables = {
            orderDirection: OrderDirection.Desc,
            orderBy: Block_OrderBy.Timestamp,
            where: {
                timestamp_gte: `${moment
                    .tz('GMT')
                    .subtract(1, 'day')
                    .subtract(10 * blockTime, 'seconds')
                    .unix()}`,
                timestamp_lte: `${moment
                    .tz('GMT')
                    .subtract(1, 'day')
                    .add(10 * blockTime, 'seconds')
                    .unix()}`,
            },
        };

        const allBlocks = await this.getAllBlocks(args);

        if (allBlocks.length > 0) {
            this.cache.put(BLOCK_24H_AGO, allBlocks[0], 15 * 1000);
        }

        return allBlocks[0];
    }

    public async getBlockForTimestamp(timestamp: number): Promise<BlockFragment> {
        const blockTime = networkConfig.avgBlockSpeed;

        const args: BlocksQueryVariables = {
            orderDirection: OrderDirection.Desc,
            orderBy: Block_OrderBy.Timestamp,
            where: {
                timestamp_gt: `${timestamp - 4 * blockTime}`,
                timestamp_lt: `${timestamp + 4 * blockTime}`,
            },
        };

        const allBlocks = await this.getAllBlocks(args);

        return allBlocks[0];
    }

    public async getDailyBlocks(numDays: number): Promise<BlockFragment[]> {
        const today = moment.tz('GMT').format('YYYY-MM-DD');
        const maxDays = moment.tz('GMT').diff(moment.tz(networkConfig.subgraphs.startDate, 'GMT'), 'days');
        numDays = maxDays < numDays ? maxDays : numDays;

        const timestampsWithBuffer = getDailyTimestampsWithBuffer(numDays);

        const timestamps = getDailyTimestampsForDays(numDays);
        const blocks: BlockFragment[] = [];
        const args = {
            orderDirection: OrderDirection.Desc,
            orderBy: Block_OrderBy.Timestamp,
            where: {
                timestamp_in: timestampsWithBuffer.map((timestamp) => `${timestamp}`),
            },
        };

        const cacheResult: BlockFragment[] = await this.cache.get(`${DAILY_BLOCKS_CACHE_KEY}:${today}:${numDays}`);

        if (cacheResult) {
            return cacheResult;
        }

        const allBlocks = await this.getAllBlocks(args);

        for (const timestamp of timestamps) {
            const closest = allBlocks.reduce((a, b) => {
                return Math.abs(parseInt(b.timestamp) - timestamp) < Math.abs(parseInt(a.timestamp) - timestamp)
                    ? b
                    : a;
            });

            //filter out any matches that are further than 5 minutes away.e
            if (Math.abs(timestamp - parseInt(closest.timestamp)) < fiveMinutesInSeconds) {
                blocks.push({ ...closest, timestamp: `${timestamp}` });
            }
        }

        await this.cache.put(`${DAILY_BLOCKS_CACHE_KEY}:${today}:${numDays}`, blocks, oneDayInMinutes);

        return blocks;
    }

    public async getBlocksPerDay() {
        const blockTime = await this.getAverageBlockTime();

        return secondsPerDay / blockTime;
    }

    public async getBlocksPerYear() {
        const blockTime = await this.getAverageBlockTime();

        return secondsPerYear / blockTime;
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const blocksSubgraphService = new BlocksSubgraphService();
