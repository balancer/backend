import { prisma } from '../../../prisma/prisma-client';
import { poolWithTokens } from '../../../prisma/prisma-types';
import { PoolAprService } from '../pool-types';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { networkContext } from '../../network/network-context.service';
import { Chain } from '@prisma/client';

export class PoolAprUpdaterService {
    constructor() {}

    private get aprServices(): PoolAprService[] {
        return networkContext.config.poolAprServices;
    }

    public async updatePoolAprs(chain: Chain) {
        const pools = await prisma.prismaPool.findMany({
            ...poolWithTokens,
            where: { chain: chain },
        });

        const failedAprServices = [];
        for (const aprService of this.aprServices) {
            try {
                await aprService.updateAprForPools(pools);
            } catch (e) {
                console.error(`Error during APR update of aprService:`, e);
                failedAprServices.push(aprService.getAprServiceName());
            }
        }

        const aprItems = await prisma.prismaPoolAprItem.findMany({
            where: {
                chain: chain,
                type: {
                    notIn: [
                        'SURPLUS',
                        'SURPLUS_30D',
                        'SURPLUS_7D',
                        'SWAP_FEE_30D',
                        'SWAP_FEE_7D',
                        'SWAP_FEE',
                        'DYNAMIC_SWAP_FEE_24H',
                    ],
                },
            },
            select: { poolId: true, apr: true },
        });

        const grouped = _.groupBy(aprItems, 'poolId');
        let operations: any[] = [];

        // Select / update aprs in Dynamic Data
        const dynamicData = await prisma.prismaPoolDynamicData
            .findMany({
                where: { chain: chain },
                select: { id: true, apr: true },
            })
            .then((data) => _.keyBy(data, 'id'));

        //store the total APR on the dynamic data so we can sort by it
        for (const poolId in grouped) {
            const apr = _.sumBy(grouped[poolId], (item) => item.apr);
            if (dynamicData[poolId].apr !== apr) {
                operations.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: poolId, chain: chain } },
                        data: { apr },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations);
        if (failedAprServices.length > 0) {
            throw new Error(`The following APR services failed: ${failedAprServices}`);
        }
    }

    // Debugging function to update the total APR of a pool
    // This is not used in production, but can be used to fix the total APR of a pool
    async updateTotalApr(id: string, chain: Chain) {
        const items = await prisma.prismaPoolAprItem.findMany({
            where: {
                poolId: id,
                chain: chain,
                type: {
                    notIn: [
                        'SURPLUS',
                        'SURPLUS_30D',
                        'SURPLUS_7D',
                        'SWAP_FEE_30D',
                        'SWAP_FEE_7D',
                        'DYNAMIC_SWAP_FEE_24H',
                    ],
                },
            },
            select: { apr: true, id: true, title: true },
        });

        console.log(
            `Updating total APR for pool ${id} on chain ${chain}`,
            items.map((item) => item.title),
            items.map((item) => item.id),
            items.map((item) => item.apr),
            items.map((item) => item.apr).reduce((a, b) => a + b, 0),
        );

        const apr = _.sumBy(items, (item) => item.apr);

        await prisma.prismaPoolDynamicData.update({
            where: { id_chain: { id, chain } },
            data: { apr },
        });
    }

    public async reloadAllPoolAprs(chain: Chain) {
        await prisma.prismaPoolAprRange.deleteMany({ where: { chain: chain } });
        await prisma.prismaPoolAprItem.deleteMany({ where: { chain: chain } });
        await this.updatePoolAprs(chain);
    }
}
