import { GraphQLClient } from 'graphql-request';
import config from '../../../config/mainnet';
import _ from 'lodash';
import {
    VotingEscrowLock_OrderBy,
    OrderDirection,
    getSdk,
    LockSnapshot,
    LockSnapshot_OrderBy,
} from './generated/veBal-locks-subgraph-types';
import moment from 'moment';

export class VeBalLocksSubgraphService {
    constructor() {}

    async getAllveBalHolders(): Promise<{ user: string; balance: string }[]> {
        const now = moment().unix();
        let locks: { user: string; balance: string }[] = [];
        const limit = 1000;
        let hasMore = true;
        let id = `0`;

        while (hasMore) {
            const response = await this.sdk.VotingEscrowLocks({
                first: limit,
                orderBy: VotingEscrowLock_OrderBy.id,
                orderDirection: OrderDirection.asc,
                where: {
                    unlockTime_gt: `${now}`,
                    id_gt: id,
                },
            });

            locks = [
                ...locks,
                ...response.votingEscrowLocks.map((lock) => ({
                    user: lock.user.id,
                    balance: lock.lockedBalance,
                })),
            ];

            if (response.votingEscrowLocks.length < limit) {
                hasMore = false;
            } else {
                id = response.votingEscrowLocks[response.votingEscrowLocks.length - 1].id;
            }
        }

        return locks;
    }

    async getAllHistoricalLocksSince(timestamp: number): Promise<LockSnapshot[]> {
        const locks: LockSnapshot[] = [];
        const limit = 1000;
        let hasMore = true;
        let id = `0`;

        while (hasMore) {
            const response = await this.sdk.LockSnapshots({
                first: limit,
                orderBy: LockSnapshot_OrderBy.id,
                orderDirection: OrderDirection.asc,
                where: {
                    id_gt: id,
                    timestamp_gte: timestamp,
                },
            });

            locks.push(...response.lockSnapshots);

            if (response.lockSnapshots.length < limit) {
                hasMore = false;
            } else {
                id = response.lockSnapshots[response.lockSnapshots.length - 1].id;
            }
        }

        return locks;
    }

    public async lastSyncedBlock() {
        const { meta } = await this.sdk.VebalGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }
        return Number(meta.block.number);
    }

    public get sdk() {
        const client = new GraphQLClient(config.subgraphs.gauge ?? '');

        return getSdk(client);
    }
}

export const veBalLocksSubgraphService = new VeBalLocksSubgraphService();
