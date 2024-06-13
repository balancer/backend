import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import moment from 'moment';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

/**
 * Updates 24h and 48h volume and fees for the pools provided based on swaps in the DB. Updates it for all pools if no poolIds provided.
 *
 * @param poolIds
 * @param chain
 */
export async function updateVolumeAndFees(chain = 'SEPOLIA' as Chain, poolIds?: string[]) {
    const yesterday = moment().subtract(1, 'day').unix();
    const twoDaysAgo = moment().subtract(2, 'day').unix();
    const pools = await prisma.prismaPool.findMany({
        where: poolIds ? { id: { in: poolIds }, chain: chain } : { chain: chain },
        include: {
            swaps: { where: { timestamp: { gte: twoDaysAgo } } },
            dynamicData: true,
        },
    });
    const operations: any[] = [];

    for (const pool of pools) {
        const volume24h = _.sumBy(
            pool.swaps.filter((swap) => swap.timestamp >= yesterday),
            (swap) => (swap.tokenIn === pool.address || swap.tokenOut === pool.address ? 0 : swap.valueUSD),
        );
        const fees24h = parseFloat(pool.dynamicData?.swapFee || '0') * volume24h;

        const volume48h = _.sumBy(pool.swaps, (swap) =>
            swap.tokenIn === pool.address || swap.tokenOut === pool.address ? 0 : swap.valueUSD,
        );
        const fees48h = parseFloat(pool.dynamicData?.swapFee || '0') * volume48h;

        if (
            pool.dynamicData &&
            (pool.dynamicData.volume24h !== volume24h ||
                pool.dynamicData.fees24h !== fees24h ||
                pool.dynamicData.volume48h !== volume48h ||
                pool.dynamicData.fees48h !== fees48h)
        ) {
            operations.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
                    data: { volume24h, fees24h, volume48h, fees48h },
                }),
            );
        }
    }

    await prismaBulkExecuteOperations(operations);
}
