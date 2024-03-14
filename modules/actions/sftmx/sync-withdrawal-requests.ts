import { Address } from 'viem';
import { SftmxSubgraphService } from '../../sources/subgraphs/sftmx-subgraph/sftmx.service';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

export async function syncWithdrawalRequests(
    stakingContractAddress: Address,
    sftmxSubgraphClient: SftmxSubgraphService,
) {
    const latestSyncedRequest = await prisma.prismaSftmxWithdrawalRequest.findFirst({
        orderBy: {
            requestTimestamp: 'desc',
        },
    });

    const allWithdrawalRequests = await sftmxSubgraphClient.getAllWithdrawalRequestsAfter(
        latestSyncedRequest?.requestTimestamp ?? 0,
    );

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
