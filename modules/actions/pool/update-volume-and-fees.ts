import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import moment from 'moment';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { SwapEvent } from '../../../prisma/prisma-types';

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
            dynamicData: true,
        },
    });

    const swapEvents = await prisma.prismaPoolEvent.findMany({
        where: {
            chain,
            poolId: { in: pools.map((pool) => pool.id) },
            type: 'SWAP',
            blockTimestamp: { gte: twoDaysAgo },
        },
    });

    const operations: any[] = [];

    for (const pool of pools) {
        const volume24h = _.sumBy(
            swapEvents.filter((swap) => swap.blockTimestamp >= yesterday && swap.poolId === pool.id),
            (swap) => swap.valueUSD,
        );

        const fees24h = _.sumBy(
            swapEvents.filter((swap) => swap.blockTimestamp >= yesterday && swap.poolId === pool.id),
            (swap) => parseFloat((swap as SwapEvent).payload.fee.valueUSD),
        );

        const surplus24h = _.sumBy(
            swapEvents.filter((swap) => swap.blockTimestamp >= yesterday && swap.poolId === pool.id),
            (swap) => parseFloat((swap as SwapEvent).payload.surplus?.valueUSD || '0'),
        );

        const volume48h = _.sumBy(
            swapEvents.filter((swap) => swap.poolId === pool.id),
            (swap) => swap.valueUSD,
        );

        const fees48h = _.sumBy(
            swapEvents.filter((swap) => swap.poolId === pool.id),
            (swap) => parseFloat((swap as SwapEvent).payload.fee.valueUSD),
        );

        const surplus48h = _.sumBy(
            swapEvents.filter((swap) => swap.poolId === pool.id),
            (swap) => parseFloat((swap as SwapEvent).payload.surplus?.valueUSD || '0'),
        );

        if (
            pool.dynamicData &&
            (pool.dynamicData.volume24h !== volume24h ||
                pool.dynamicData.fees24h !== fees24h ||
                pool.dynamicData.surplus24h !== surplus24h ||
                pool.dynamicData.volume48h !== volume48h ||
                pool.dynamicData.fees48h !== fees48h ||
                pool.dynamicData.surplus48h !== surplus48h)
        ) {
            operations.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
                    data: { volume24h, fees24h, volume48h, fees48h, surplus24h, surplus48h },
                }),
            );
        }
    }

    await prismaBulkExecuteOperations(operations);
}
