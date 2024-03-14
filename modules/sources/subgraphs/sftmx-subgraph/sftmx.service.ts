import { GraphQLClient } from 'graphql-request';
import {
    FtmStakingSnapshotFragment,
    FtmStakingSnapshot_OrderBy,
    OrderDirection,
    WithdrawalRequestFragment,
    WithdrawalRequest_OrderBy,
    getSdk,
} from './generated/sftmx-subgraph-types';

export class SftmxSubgraphService {
    private sdk: ReturnType<typeof getSdk>;

    constructor(subgraphUrl: string) {
        this.sdk = getSdk(new GraphQLClient(subgraphUrl));
    }

    public async getAllWithdrawawlRequestsWithPaging(): Promise<WithdrawalRequestFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let withdrawalRequests: WithdrawalRequestFragment[] = [];
        let id = '0x';

        while (hasMore) {
            const response = await this.sdk.WithdrawalRequests({
                where: { id_gt: id },
                orderBy: WithdrawalRequest_OrderBy.id,
                orderDirection: OrderDirection.asc,
                first: limit,
            });

            withdrawalRequests = [...withdrawalRequests, ...response.withdrawalRequests];

            if (response.withdrawalRequests.length < limit) {
                hasMore = false;
            } else {
                id = response.withdrawalRequests[response.withdrawalRequests.length - 1].id;
            }
        }

        return withdrawalRequests;
    }

    public async getAllWithdrawalRequestsAfter(timestamp: number): Promise<WithdrawalRequestFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let withdrawalRequests: WithdrawalRequestFragment[] = [];
        let id = '0x';

        while (hasMore) {
            const response = await this.sdk.WithdrawalRequests({
                where: { id_gt: id, requestTime_gt: timestamp },
                orderBy: WithdrawalRequest_OrderBy.id,
                orderDirection: OrderDirection.asc,
                first: limit,
            });

            withdrawalRequests = [...withdrawalRequests, ...response.withdrawalRequests];

            if (response.withdrawalRequests.length < limit) {
                hasMore = false;
            } else {
                id = response.withdrawalRequests[response.withdrawalRequests.length - 1].id;
            }
        }

        return withdrawalRequests;
    }

    public async getAllStakingSnapshots(): Promise<FtmStakingSnapshotFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let ftmStakingSnapshots: FtmStakingSnapshotFragment[] = [];
        let id = '0x';

        while (hasMore) {
            const response = await this.sdk.ftmStakingSnapshots({
                where: { id_gt: id },
                orderBy: FtmStakingSnapshot_OrderBy.id,
                orderDirection: OrderDirection.asc,
                first: limit,
            });

            ftmStakingSnapshots = [...ftmStakingSnapshots, ...response.ftmStakingSnapshots];

            if (response.ftmStakingSnapshots.length < limit) {
                hasMore = false;
            } else {
                id = response.ftmStakingSnapshots[response.ftmStakingSnapshots.length - 1].id;
            }
        }

        return ftmStakingSnapshots;
    }

    public async getStakingSnapshotsAfter(timestamp: number): Promise<FtmStakingSnapshotFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let ftmStakingSnapshots: FtmStakingSnapshotFragment[] = [];
        let queryTimestamp = timestamp;

        while (hasMore) {
            const response = await this.sdk.ftmStakingSnapshots({
                where: { snapshotTimestamp_gt: queryTimestamp },
                orderBy: FtmStakingSnapshot_OrderBy.snapshotTimestamp,
                orderDirection: OrderDirection.asc,
                first: limit,
            });

            ftmStakingSnapshots = [...ftmStakingSnapshots, ...response.ftmStakingSnapshots];

            if (response.ftmStakingSnapshots.length < limit) {
                hasMore = false;
            } else {
                queryTimestamp =
                    response.ftmStakingSnapshots[response.ftmStakingSnapshots.length - 1].snapshotTimestamp;
            }
        }

        return ftmStakingSnapshots;
    }
}
