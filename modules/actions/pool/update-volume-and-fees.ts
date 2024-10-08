import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import moment from 'moment';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { SwapEvent } from '../../../prisma/prisma-types';
import { capturesYield } from '../../pool/lib/pool-utils';

/**
 * Updates 24h and 48h volume and fees for the pools provided based on swaps in the DB. Updates it for all pools if no poolIds provided.
 * Also updates yieldCapture for 24h and 48h based on the current total yield APR and the average totalLiquidity from now and 24 hours ago.
 *
 * @param poolIds
 * @param chain
 */
export async function updateVolumeAndFees(chain: Chain, poolIds?: string[]) {
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
    await updateYieldCaptureForAllPools(chain);
}

/*
    We approximate the yield fee capture of the last 24h by taking the current total yield APR and apply it to the average totalLiquidity from now and 24 hours ago.
    We approximate the yield fee capture of the last 48h by taking the current total yield APR and apply it to the totalLiquidity from 24 hours ago.
*/
async function updateYieldCaptureForAllPools(chain: Chain) {
    const pools = await prisma.prismaPool.findMany({
        where: { chain: chain },
        include: {
            dynamicData: true,
            aprItems: true,
        },
    });
    const operations: any[] = [];

    for (const pool of pools) {
        if (pool.dynamicData?.totalLiquidity && capturesYield(pool)) {
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            const totalLiquidity24hAgo = pool.dynamicData.totalLiquidity24hAgo;
            let userYieldApr = 0;

            // we approximate total APR by summing it up, as APRs are usually small, this is good enough
            // we need IB yield APR (such as sFTMx) as well as phantom stable APR, which is set for phantom stable pools
            // we need any phantom stable pool or weighted pool that has either a phantom stable nested, which has no apr type set (done by boosted-pool-apr.service.ts)
            pool.aprItems.forEach((aprItem) => {
                if (aprItem.type === 'IB_YIELD' || aprItem.type === null) {
                    userYieldApr += aprItem.apr;
                }
            });

            const liquidityAverage24h = (totalLiquidity + totalLiquidity24hAgo) / 2;
            const yieldForUser48h = ((totalLiquidity24hAgo * userYieldApr) / 365) * 2;
            const yieldForUser24h = (liquidityAverage24h * userYieldApr) / 365;

            const protocolYieldFeePercentage = parseFloat(pool.dynamicData.protocolYieldFee || '0');
            const protocolSwapFeePercentage = parseFloat(pool.dynamicData.protocolSwapFee || '0');

            let yieldCapture24h =
                pool.type === 'META_STABLE'
                    ? yieldForUser24h / (1 - protocolSwapFeePercentage)
                    : yieldForUser24h / (1 - protocolYieldFeePercentage);

            let yieldCapture48h =
                pool.type === 'META_STABLE'
                    ? yieldForUser48h / (1 - protocolSwapFeePercentage)
                    : yieldForUser48h / (1 - protocolYieldFeePercentage);

            // if the pool is in recovery mode, the protocol does not take any fee and therefore the user takes all yield captured
            // since this is already reflected in the aprItems of the pool, we need to set that as the totalYieldCapture
            if (pool.dynamicData.isInRecoveryMode || pool.type === 'LIQUIDITY_BOOTSTRAPPING') {
                yieldCapture24h = yieldForUser24h;
                yieldCapture48h = yieldForUser48h;
            }

            operations.push(
                prisma.prismaPoolDynamicData.update({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
                    data: { yieldCapture24h, yieldCapture48h },
                }),
            );
        }
    }

    await prismaBulkExecuteOperations(operations);
}
