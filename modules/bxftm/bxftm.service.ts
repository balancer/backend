import { Prisma, PrismaBxFtmWithdrawalRequest } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { GqlBxFtmWithdrawalRequests, QueryBxftmGetWithdrawalRequestsArgs } from '../../schema';
import { networkContext } from '../network/network-context.service';
import { BxftmSubgraphService } from '../subgraphs/bxftm-subgraph/bxftm.service';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';

export class BxFtmService {
    constructor(private readonly bxFtmSubgraphService: BxftmSubgraphService) {}

    public async getWithdrawalRequests(user: string): Promise<GqlBxFtmWithdrawalRequests[]> {
        const balances = await prisma.prismaBxFtmWithdrawalRequest.findMany({
            where: {
                user: user,
            },
        });
        return balances;
    }

    public async syncWithdrawalRequests() {
        const allWithdrawalRequests = await this.bxFtmSubgraphService.getAllWithdrawawlRequestsWithPaging();

        const operations = [];
        for (const request of allWithdrawalRequests) {
            const requestData = {
                id: request.id,
                user: request.user.id,
                amount: request.amount,
                isWithdrawn: request.isWithdrawn,
                requestTimestamp: request.requestTime,
            };
            operations.push(
                prisma.prismaBxFtmWithdrawalRequest.upsert({
                    where: { id: requestData.id },
                    create: requestData,
                    update: requestData,
                }),
            );
        }
        await prismaBulkExecuteOperations(operations);
    }
}

export const bxFtmService = new BxFtmService(networkContext.services.bxFtmSubgraphService!);
