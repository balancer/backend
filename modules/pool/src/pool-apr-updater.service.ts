import { prisma } from '../../util/prisma-client';
import { prismaPoolWithExpandedNesting } from '../../../prisma/prisma-types';
import { PoolAprService } from '../pool-types';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

export class PoolAprUpdaterService {
    constructor(private readonly aprServices: PoolAprService[]) {}

    public async updatePoolAprs() {
        const pools = await prisma.prismaPool.findMany(prismaPoolWithExpandedNesting);

        for (const aprService of this.aprServices) {
            await aprService.updateAprForPools(pools);
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
    }
}
