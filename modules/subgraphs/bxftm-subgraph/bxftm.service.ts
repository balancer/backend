import { GraphQLClient } from 'graphql-request';
import {
    OrderDirection,
    WithdrawalRequestFragment,
    WithdrawalRequest_OrderBy,
    getSdk,
} from './generated/bxftm-subgraph-types';

export class BxftmSubgraphService {
    private sdk: ReturnType<typeof getSdk>;

    constructor(subgraphUrl: string) {
        this.sdk = getSdk(new GraphQLClient(subgraphUrl));
    }

    public async getAllWithdrawawlRequestsWithPaging(): Promise<WithdrawalRequestFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let withdrawalRequests: WithdrawalRequestFragment[] = [];
        let id = '0';

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
}
