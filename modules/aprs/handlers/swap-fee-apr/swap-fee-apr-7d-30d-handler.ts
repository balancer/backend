import { prisma } from '../../../../prisma/prisma-client';
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

        // Fetch the swap fees for the last 30 days
        const swapFeeData = await fetchSwapFeeData(chain);

        // Map the swap fee data to the pool id
        const swapFeeDataMap = swapFeeData.reduce(
            (acc, data) => {
                acc[data.poolId] = data;
                return acc;
            },
            {} as Record<string, PoolSwapFeeData>,
        );

        const typeMap = Object.fromEntries(pools.map((pool) => [pool.id, pool.type]));

        const aprItems = pools.flatMap((pool) => {
            if (!pool.dynamicData) return [];
            let apr_7d = 0;
            let apr_30d = 0;

            if (pool.dynamicData.totalLiquidity > 0 && swapFeeDataMap[pool.id]) {
                apr_7d = (swapFeeDataMap[pool.id].fees_7d * 365) / 7 / pool.dynamicData.totalLiquidity;
                apr_30d = (swapFeeDataMap[pool.id].fees_30d * 365) / 30 / pool.dynamicData.totalLiquidity;
            }

            let protocolFee = parseFloat(pool.dynamicData.protocolSwapFee);

            if (typeMap[pool.id] === 'GYROE') {
                // Gyro has custom protocol fee structure
                protocolFee = parseFloat(pool.dynamicData.protocolYieldFee || '0');
            }
            if (pool.dynamicData.isInRecoveryMode || typeMap[pool.id] === 'LIQUIDITY_BOOTSTRAPPING') {
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
                {
                    id: `${pool.id}-swap-apr-7d`,
                    chain,
                    poolId: pool.id,
                    title: 'Swap fees APR (7d)',
                    apr: apr_7d,
                    type: PrismaPoolAprType.SWAP_FEE_7D,
                    rewardTokenAddress: null,
                    rewardTokenSymbol: null,
                },
                {
                    id: `${pool.id}-swap-apr-30d`,
                    chain,
                    poolId: pool.id,
                    title: 'Swap fees APR (30d)',
                    apr: apr_30d,
                    type: PrismaPoolAprType.SWAP_FEE_30D,
                    rewardTokenAddress: null,
                    rewardTokenSymbol: null,
                },
            ];
        });

        return aprItems;
    }
}
