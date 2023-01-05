import * as Sentry from '@sentry/node';
import { prisma } from '../../../prisma/prisma-client';
import { prismaPoolWithExpandedNesting } from '../../../prisma/prisma-types';
import { PoolAprService } from '../pool-types';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

export class PoolAprUpdaterService {
    constructor(private readonly aprServices: PoolAprService[]) {}

    public async updatePoolAprs() {
        const pools = await prisma.prismaPool.findMany(prismaPoolWithExpandedNesting);

        const failedAprServices = [];
        for (const aprService of this.aprServices) {
            try {
                await aprService.updateAprForPools(pools);
            } catch (e) {
                console.log(`Error during APR update of aprService:`, e);
                Sentry.captureException(e);
                failedAprServices.push(aprService.getAprServiceName());
            }
        }

        const aprItems = await prisma.prismaPoolAprItem.findMany({
            select: { poolId: true, apr: true },
        });

        const grouped = _.groupBy(aprItems, 'poolId');
        let operations: any[] = [];

        //store the total APR on the dynamic data so we can sort by it
        for (const poolId in grouped) {
            operations.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id: poolId },
                    data: { apr: _.sumBy(grouped[poolId], (item) => item.apr) },
                }),
            );
        }

        await prismaBulkExecuteOperations(operations);
        if (failedAprServices.length > 0) {
            throw new Error(`The following APR services failed: ${failedAprServices}`);
        }
    }

    public async realodAllPoolAprs() {
        await prisma.prismaPoolAprItem.deleteMany({});
        await this.updatePoolAprs();
    }
}
