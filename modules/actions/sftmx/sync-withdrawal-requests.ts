import { Address } from 'viem';
import { SftmxSubgraphService } from '../../sources/subgraphs/sftmx-subgraph/sftmx.service';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

export async function syncWithdrawalRequests(
    stakingContractAddress: Address,
    sftmxSubgraphClient: SftmxSubgraphService,
) {
    const allWithdrawalRequests = await sftmxSubgraphClient.getAllWithdrawawlRequestsWithPaging();

    const operations = [];
    for (const request of allWithdrawalRequests) {
        const requestData = {
            id: request.id,
            ftmStakingId: stakingContractAddress,
            user: request.user.id,
            amountSftmx: request.amount,
            isWithdrawn: request.isWithdrawn,
            requestTimestamp: request.requestTime,
        };
        operations.push(
            prisma.prismaSftmxWithdrawalRequest.upsert({
                where: { id: requestData.id },
                create: requestData,
                update: requestData,
            }),
        );
    }
    await prismaBulkExecuteOperations(operations);
}
