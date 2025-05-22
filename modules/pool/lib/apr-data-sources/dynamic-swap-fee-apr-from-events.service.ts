import { PoolAprService } from '../../pool-types';
import { PoolForAPRs } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { Chain, PrismaPoolType } from '@prisma/client';
import { daysAgo } from '../../../common/time';

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

export class DynamicSwapFeeFromEventsAprService implements PoolAprService {
    public getAprServiceName(): string {
        return 'DynamicSwapFeeAprService';
    }

    public async updateAprForPools(pools: PoolForAPRs[]): Promise<void> {
        const chain = pools[0].chain;
        const yesterday = daysAgo(1);

        const typeMap = pools.reduce((acc, pool) => {
            acc[pool.id] = pool.type;
            return acc;
        }, {} as Record<string, PrismaPoolType>);

        const dynamicData = await prisma.prismaPoolDynamicData.findMany({
            where: { chain, poolId: { in: pools.map((pool) => pool.id) } },
        });

        // Fetch the swap fees for the last 30 days
        const swapFeeData = await prisma.$queryRawUnsafe<PoolSwapFeeData[]>(query(chain, yesterday));

        // Map the swap fee data to the pool id
        const swapFeeDataMap = swapFeeData.reduce((acc, data) => {
            acc[data.poolId] = data;
            return acc;
        }, {} as Record<string, PoolSwapFeeData>);

        const operations = dynamicData.map((pool) => {
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

            return prisma.prismaPoolAprItem.upsert({
                where: { id_chain: { id: `${pool.poolId}-dynamic-swap-apr-24h`, chain } },
                create: {
                    id: `${pool.poolId}-dynamic-swap-apr-24h`,
                    chain,
                    poolId: pool.poolId,
                    title: 'Dynamic swap fees APR',
                    apr: apr_24h,
                    type: 'DYNAMIC_SWAP_FEE_24H',
                },
                update: { apr: apr_24h },
            });
        });

        await prismaBulkExecuteOperations(operations);
    }
}
