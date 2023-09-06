import * as Sentry from '@sentry/node';
import { prisma } from '../../../prisma/prisma-client';
import { poolWithTokens } from '../../../prisma/prisma-types';
import { PoolAprService } from '../pool-types';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { networkContext } from '../../network/network-context.service';

export class PoolAprUpdaterService {
    constructor() {}

    private get aprServices(): PoolAprService[] {
        return networkContext.config.poolAprServices;
    }

    public async updatePoolAprs() {
        const pools = await prisma.prismaPool.findMany({
            ...poolWithTokens,
            where: { chain: networkContext.chain },
        });

        const failedAprServices = [];
        for (const aprService of this.aprServices) {
            try {
                await aprService.updateAprForPools(pools);
            } catch (e) {
                console.error(`Error during APR update of aprService:`, e);
                Sentry.captureException(e);
                failedAprServices.push(aprService.getAprServiceName());
            }
        }

        const aprItems = await prisma.prismaPoolAprItem.findMany({
            where: { chain: networkContext.chain },
            select: { poolId: true, apr: true },
        });

        const grouped = _.groupBy(aprItems, 'poolId');
        let operations: any[] = [];

        //store the total APR on the dynamic data so we can sort by it
        for (const poolId in grouped) {
            operations.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id_chain: { id: poolId, chain: networkContext.chain } },
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
        await prisma.prismaPoolAprRange.deleteMany({ where: { chain: networkContext.chain } });
        await prisma.prismaPoolAprItem.deleteMany({ where: { chain: networkContext.chain } });
        await this.updatePoolAprs();
    }
}
