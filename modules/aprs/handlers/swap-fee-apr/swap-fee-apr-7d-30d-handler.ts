import { PoolAprService } from '../../pool-types';
import { PoolForAPRs } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { Chain, PrismaPoolAprItem, PrismaPoolAprType, PrismaPoolType } from '@prisma/client';
import { daysAgo, roundToMidnight } from '../../../common/time';
import _ from 'lodash';
import { AprHandler, PoolAPRData } from '../../types';

type PoolSwapFeeData = {
    poolId: string;
    chain: Chain;
    fees_30d: number;
    fees_7d: number;
};

const fetchSwapFeeData = async (chain: Chain) => {
    const [snapshots30d, snapshots7d] = await Promise.all([
        prisma.prismaPoolSnapshot.findMany({
            where: {
                chain,
                timestamp: roundToMidnight(daysAgo(30)),
            },
            select: {
                poolId: true,
                totalSwapFee: true,
            },
        }),
        prisma.prismaPoolSnapshot.findMany({
            where: {
                chain,
                timestamp: roundToMidnight(daysAgo(7)),
            },
            select: {
                poolId: true,
                totalSwapFee: true,
            },
        }),
    ]);

    const poolIds = _.uniq([
        ...snapshots30d.map((snapshot) => snapshot.poolId),
        ...snapshots7d.map((snapshot) => snapshot.poolId),
    ]);

    const swapFeeData: PoolSwapFeeData[] = poolIds.map((poolId) => {
        const snapshot30d = snapshots30d.find((s) => s.poolId === poolId);
        const snapshot7d = snapshots7d.find((s) => s.poolId === poolId);

        return {
            poolId,
            chain,
            fees_30d: snapshot30d ? snapshot30d.totalSwapFee : 0,
            fees_7d: snapshot7d ? snapshot7d.totalSwapFee : 0,
        };
    });

    return swapFeeData;
};

const MAX_DB_INT = 9223372036854775807;

export class SwapFeeApr7d30dHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'SwapFeeApr7d30dHandler';
    }

    // This service is used outside of main APRs look, only for 7,30 day swap fee aprs.
    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        // It will receive one pool only, because data is refetched in the body later
        const chain = pools[0].chain;

        // Get pool type map
        const [typeMap, dynamicData, currentAprs] = await Promise.all([
            prisma.prismaPool.findMany({ select: { id: true, type: true }, where: { chain } }).then((records) =>
                records.reduce((acc, pool) => {
                    acc[pool.id] = pool.type;
                    return acc;
                }, {} as Record<string, PrismaPoolType>),
            ),
            prisma.prismaPoolDynamicData.findMany({ where: { chain } }),
            prisma.prismaPoolAprItem
                .findMany({
                    select: { id: true, apr: true },
                    where: { chain, type: { in: ['SWAP_FEE_7D', 'SWAP_FEE_30D'] } },
                })
                .then((records) => Object.fromEntries(records.map((item) => [item.id, item.apr]))),
        ]);

        // Fetch the swap fees for the last 30 days
        const swapFeeData = await fetchSwapFeeData(chain);

        // Map the swap fee data to the pool id
        const swapFeeDataMap = swapFeeData.reduce((acc, data) => {
            acc[data.poolId] = data;
            return acc;
        }, {} as Record<string, PoolSwapFeeData>);

        const aprItems = dynamicData.flatMap((pool) => {
            let apr_7d = 0;
            let apr_30d = 0;

            if (pool.totalLiquidity > 0 && swapFeeDataMap[pool.poolId]) {
                apr_7d = (swapFeeDataMap[pool.poolId].fees_7d * 365) / 7 / pool.totalLiquidity;
                apr_30d = (swapFeeDataMap[pool.poolId].fees_30d * 365) / 30 / pool.totalLiquidity;
            }

            let protocolFee = parseFloat(pool.protocolSwapFee);

            if (typeMap[pool.poolId] === 'GYROE') {
                // Gyro has custom protocol fee structure
                protocolFee = parseFloat(pool.protocolYieldFee || '0');
            }
            if (pool.isInRecoveryMode || typeMap[pool.poolId] === 'LIQUIDITY_BOOTSTRAPPING') {
                // pool does not collect any protocol fees
                protocolFee = 0;
            }

            apr_7d = apr_7d * (1 - protocolFee);
            apr_30d = apr_30d * (1 - protocolFee);

            if (apr_7d > MAX_DB_INT) {
                apr_7d = 0;
            }
            if (apr_30d > MAX_DB_INT) {
                apr_30d = 0;
            }

            return [
                ...(Math.abs((currentAprs[`${pool.poolId}-swap-apr-7d`] || 0) - apr_7d) > 0.0001
                    ? [
                          {
                              id: `${pool.poolId}-swap-apr-7d`,
                              chain,
                              poolId: pool.poolId,
                              title: 'Swap fees APR (7d)',
                              apr: apr_7d,
                              type: PrismaPoolAprType.SWAP_FEE_7D,
                              rewardTokenAddress: null,
                              rewardTokenSymbol: null,
                              group: null,
                          },
                      ]
                    : []),
                ...(Math.abs((currentAprs[`${pool.poolId}-swap-apr-30d`] || 0) - apr_30d) > 0.0001
                    ? [
                          {
                              id: `${pool.poolId}-swap-apr-30d`,
                              chain,
                              poolId: pool.poolId,
                              title: 'Swap fees APR (30d)',
                              apr: apr_30d,
                              type: PrismaPoolAprType.SWAP_FEE_30D,
                              rewardTokenAddress: null,
                              rewardTokenSymbol: null,
                              group: null,
                          },
                      ]
                    : []),
            ];
        });

        return aprItems;
    }
}
