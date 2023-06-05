import { GraphQLClient } from 'graphql-request';
import { networkContext } from '../../network/network-context.service';
import _ from 'lodash';
import { VotingEscrowLock_OrderBy, OrderDirection, getSdk } from './generated/veBal-locks-subgraph-types';
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

    public get sdk() {
        const client = new GraphQLClient(networkContext.data.subgraphs.veBalLocks ?? '');

        return getSdk(client);
    }
}

export const veBalLocksSubgraphService = new VeBalLocksSubgraphService();
