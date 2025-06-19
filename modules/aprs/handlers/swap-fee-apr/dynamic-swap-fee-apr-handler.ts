import { prisma } from '../../../../prisma/prisma-client';
import { Chain, PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { daysAgo } from '../../../common/time';
import { AprHandler, PoolAPRData } from '../../types';

type PoolSwapFeeData = {
    poolId: string;
    chain: Chain;
    fees_24h: number;
};

const query = (chain: Chain, timestamp: number) => `
    SELECT
        "poolId",
        chain,
        SUM((payload->'dynamicFee'->>'valueUSD')::numeric) AS fees_24h
    FROM
        "PartitionedPoolEvent"
    WHERE
        "blockTimestamp" >= ${timestamp}
    AND chain = '${chain}'
    AND type = 'SWAP'
    GROUP BY
        1, 2
`;

const MAX_DB_INT = 9223372036854775807;

export class DynamicSwapFeeAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'DynamicSwapFeeAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const chain = pools[0].chain;
        const yesterday = daysAgo(1);

        const [dynamicData, existingAprItems] = await Promise.all([
            prisma.prismaPoolDynamicData.findMany({
                where: { chain, poolId: { in: pools.map((pool) => pool.id) } },
            }),
            prisma.prismaPoolAprItem
                .findMany({ select: { id: true, apr: true }, where: { chain, type: 'DYNAMIC_SWAP_FEE_24H' } })
                .then((records) => Object.fromEntries(records.map((item) => [item.id, item.apr]))),
        ]);

        // Fetch the swap fees for the last 30 days
        const swapFeeData = await prisma.$queryRawUnsafe<PoolSwapFeeData[]>(query(chain, yesterday));

        // Map the swap fee data to the pool id
        const swapFeeDataMap = swapFeeData.reduce((acc, data) => {
            acc[data.poolId] = data;
            return acc;
        }, {} as Record<string, PoolSwapFeeData>);

        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = ([] = dynamicData
            .map((pool) => {
                let apr_24h = 0;
                let protocolFee = parseFloat(pool.aggregateSwapFee);

                if (pool.isInRecoveryMode) {
                    protocolFee = 0;
                }

                if (pool.totalLiquidity > 0 && swapFeeDataMap[pool.poolId]) {
                    apr_24h = ((swapFeeDataMap[pool.poolId].fees_24h * 365) / pool.totalLiquidity) * (1 - protocolFee);
                }
                if (apr_24h > MAX_DB_INT) {
                    apr_24h = 0;
                }

                const id = `${pool.poolId}-dynamic-swap-apr-24h`;

                if (Math.abs(existingAprItems[id] || 0 - apr_24h) > 0.0001) {
                    return {
                        id,
                        chain,
                        poolId: pool.poolId,
                        title: 'Dynamic swap fees APR',
                        apr: apr_24h,
                        type: PrismaPoolAprType.DYNAMIC_SWAP_FEE_24H,
                        rewardTokenAddress: null,
                        rewardTokenSymbol: null,
                        group: null,
                    };
                } else {
                    return null;
                }
            })
            .filter((pool): pool is NonNullable<typeof pool> => !!pool));

        return aprItems;
    }
}
