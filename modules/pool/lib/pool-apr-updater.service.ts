import { prisma } from '../../../prisma/prisma-client';
import { PoolForAPRs } from '../../../prisma/prisma-types';
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

    async updatePoolAprs(chain: Chain) {
        // Loading pools, their dynamic data, and tokens separately, then manually assembling them into `PoolForAPRs` objects to avoid the performance overhead of Prisma's nested includes.
        const [pools, dynamicData, tokens] = await Promise.all([
            prisma.prismaPool.findMany({
                where: { chain },
            }),
            prisma.prismaPoolDynamicData
                .findMany({ where: { chain } })
                .then((records) => _.keyBy(records, 'id') as Record<string, (typeof records)[0]>),
            prisma.prismaPoolToken
                .findMany({
                    where: { chain },
                    include: { token: true },
                })
                .then((records) => _.groupBy(records, 'poolId') as Record<string, typeof records>),
        ]);

        const poolsWithData: PoolForAPRs[] = pools
            .map((pool) => ({
                ...pool,
                dynamicData: dynamicData[pool.id],
                tokens: tokens[pool.id],
            }))
            // Filter needed for test pools on Sepolia
            .filter((pool) => pool.tokens && pool.dynamicData);

        await this.updateAprsForPools(poolsWithData);
    }

    async reloadAllPoolAprs(chain: Chain) {
        await prisma.prismaPoolAprRange.deleteMany({ where: { chain: chain } });
        await prisma.prismaPoolAprItem.deleteMany({ where: { chain: chain } });
        await this.updatePoolAprs(chain);
    }

    async updateAprsForPools(pools: PoolForAPRs[]) {
        const failedAprServices = [];

        for (const aprService of this.aprServices) {
            try {
                await aprService.updateAprForPools(pools);
            } catch (e) {
                console.error(`Error during APR update of aprService:`, e);
                failedAprServices.push(aprService.getAprServiceName());
            }
        }

        if (failedAprServices.length > 0) {
            throw new Error(`The following APR services failed: ${failedAprServices}`);
        }

        await this.updateTotalApr(pools);
    }

    private async updateTotalApr(pools: PoolForAPRs[]) {
        const items = await prisma.prismaPoolAprItem.findMany({
            where: {
                chain: pools[0].chain,
                ...(pools.length > 10 ? {} : { poolId: { in: pools.map((p) => p.id) } }),
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
        });

        const grouped = _.groupBy(items, 'poolId');
        let operations: any[] = [];

        // Select / update aprs in Dynamic Data
        const dynamicData = _.keyBy(
            pools.map((pool) => pool.dynamicData),
            'poolId',
        );

        //store the total APR on the dynamic data so we can sort by it
        for (const poolId in grouped) {
            const apr = _.sumBy(grouped[poolId], (item) => item.apr);
            if (Math.abs(dynamicData[poolId]?.apr || 0 - apr) > 0.01 && dynamicData[poolId]?.chain) {
                operations.push(
                    prisma.prismaPoolDynamicData.update({
                        where: { id_chain: { id: poolId, chain: dynamicData[poolId].chain } },
                        data: { apr },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations);
    }
}
