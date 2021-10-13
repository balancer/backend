import { GraphQLClient } from 'graphql-request';
import {
    Block_OrderBy,
    BlocksQuery,
    BlocksQueryVariables,
    getSdk,
    OrderDirection,
} from './generated/blocks-subgraph-types';
import moment from 'moment-timezone';
import { env } from '../../app/env';

export class BlocksSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(env.BLOCKS_SUBGRAPH);
    }

    //TODO: cache this
    public async getAverageBlockTime(): Promise<number> {
        const start = moment().startOf('hour').subtract(6, 'hours').unix();
        const end = moment().startOf('hour').unix();

        const blocks = (
            await this.sdk.Blocks({
                first: 1000,
                skip: 0,
                orderBy: Block_OrderBy.Number,
                orderDirection: OrderDirection.Desc,
                where: { timestamp_gt: `${start}`, timestamp_lt: `${end}` },
            })
        ).blocks;

        if (blocks.length === 0) {
            console.error('Unable to retrieve the blocks, returning a default value of 1.5 seconds per block');
            return 1.5;
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

        return averageBlockTime / blocks.length;
    }

    public async getBlocks(args: BlocksQueryVariables): Promise<BlocksQuery> {
        return this.sdk.Blocks(args);
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const blocksSubgraphService = new BlocksSubgraphService();
