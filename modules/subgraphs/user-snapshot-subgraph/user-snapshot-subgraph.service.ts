import { Cache, CacheClass } from 'memory-cache';
import { GraphQLClient } from 'graphql-request';
import {
    getSdk,
    OrderDirection,
    QueryUserBalanceSnapshotsArgs,
    UserBalanceSnapshot_OrderBy,
    UserBalanceSnapshotsQuery,
} from './generated/user-snapshot-subgraph-types';
import { networkContext } from '../../network/network-context.service';

export class UserSnapshotSubgraphService {
    private readonly cache: CacheClass<string, any>;

    constructor() {
        this.cache = new Cache<string, any>();
    }

    public async getMetadata() {
        const { meta } = await this.sdk.UserSnapshotGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }

        return meta;
    }

    public async userBalanceSnapshots(args: QueryUserBalanceSnapshotsArgs): Promise<UserBalanceSnapshotsQuery> {
        return this.sdk.UserBalanceSnapshots(args);
    }

    public async getUserBalanceSnapshotsForUserAndRange(
        fromTimestamp: number,
        toTimestamp: number,
        userAddress: string,
    ): Promise<UserBalanceSnapshotsQuery> {
        let allSnapshots: UserBalanceSnapshotsQuery = {
            snapshots: [],
        };
        do {
            const result = await this.sdk.UserBalanceSnapshots({
                where: { timestamp_gte: fromTimestamp, timestamp_lte: toTimestamp, user: userAddress.toLowerCase() },
                first: 1000,
                orderBy: UserBalanceSnapshot_OrderBy.Timestamp,
                orderDirection: OrderDirection.Asc,
            });
            if (result.snapshots.length === 0) {
                break;
            }
            allSnapshots.snapshots.push(...result.snapshots);
            fromTimestamp = result.snapshots[result.snapshots.length - 1].timestamp + 1;
        } while (true);

        return allSnapshots;
    }

    public get sdk() {
        const client = new GraphQLClient(networkContext.data.subgraphs.userBalances);

        return getSdk(client);
    }
}

export const userSnapshotSubgraphService = new UserSnapshotSubgraphService();
