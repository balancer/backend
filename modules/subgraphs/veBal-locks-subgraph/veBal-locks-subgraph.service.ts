import { GraphQLClient } from 'graphql-request';
import { networkContext } from '../../network/network-context.service';
import _ from 'lodash';
import { VotingEscrowLock_OrderBy, OrderDirection, getSdk } from './generated/veBal-locks-subgraph-types';

export class VeBalLocksSubgraphService {
    constructor() {}

    // TODO needs proper paging, currently <3000 locks so it works
    async getAllveBalHolders(): Promise<{ user: string; balance: string }[]> {
        let skip = 0;
        const timestamp = String(Math.round(Date.now() / 1000));

        let locks: { user: string; balance: string }[] = [];

        // There is more than 1000 locks, so we need to paginate
        do {
            const locksQuery = await this.sdk.VotingEscrowLocks({
                first: 1000,
                skip,
                orderBy: VotingEscrowLock_OrderBy.id,
                orderDirection: OrderDirection.asc,
                where: {
                    unlockTime_gt: timestamp,
                },
            });

            locks = locks.concat(
                locksQuery.votingEscrowLocks.map((lock) => ({
                    user: lock.user.id,
                    balance: lock.lockedBalance,
                })),
            );

            if (locksQuery.votingEscrowLocks.length < 1000) {
                break;
            }

            skip += 1000;
        } while (1 === 1);

        return locks;
    }

    public get sdk() {
        const client = new GraphQLClient(networkContext.data.subgraphs.veBalLocks ?? '');

        return getSdk(client);
    }
}

export const veBalLocksSubgraphService = new VeBalLocksSubgraphService();
