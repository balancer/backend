import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithTokens } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { Chain, PrismaPoolType } from '@prisma/client';

type PoolSwapFeeData = {
    poolId: string;
    chain: Chain;
    fees_30d: number;
    fees_7d: number;
    fees_24h: number;
};

const query = (chain: Chain) => `WITH fee_data AS (
    SELECT 
        "poolId",
        chain,
        "blockTimestamp" as ts,
        (payload->'fee'->>'valueUSD')::numeric AS fee_value
    FROM 
        "PartitionedPoolEvent"
    WHERE 
        "blockTimestamp" >= extract(epoch from now() - interval '30 days')::int  -- Only include the last 30 days
    AND chain = '${chain}'
    AND type = 'SWAP'
)
SELECT 
    "poolId",
    chain,
    SUM(fee_value) AS fees_30d,
    SUM(CASE when ts > extract(epoch FROM now() - interval '7 days')::int then fee_value else 0 end) AS fees_7d,
    SUM(CASE when ts > extract(epoch FROM now() - interval '1 day')::int then fee_value else 0 end) AS fees_24h
FROM 
    fee_data
GROUP BY 
    1, 2`;

const MAX_DB_INT = 9223372036854775807;

export class SwapFeeFromEventsAprService implements PoolAprService {
    public getAprServiceName(): string {
        return 'SwapFeeAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
        const chain = pools[0].chain;

        const typeMap = pools.reduce((acc, pool) => {
            acc[pool.id] = pool.type;
            return acc;
        }, {} as Record<string, PrismaPoolType>);

        const dynamicData = await prisma.prismaPoolDynamicData.findMany({
            where: { chain, poolId: { in: pools.map((pool) => pool.id) } },
        });

        // Fetch the swap fees for the last 30 days
        const swapFeeData = await prisma.$queryRawUnsafe<PoolSwapFeeData[]>(query(chain));

        // Map the swap fee data to the pool id
        const swapFeeDataMap = swapFeeData.reduce((acc, data) => {
            acc[data.poolId] = data;
            return acc;
        }, {} as Record<string, PoolSwapFeeData>);

        const operations = dynamicData.flatMap((pool) => {
            let apr_24h = 0;
            let apr_7d = 0;
            let apr_30d = 0;

            if (pool.totalLiquidity > 0 && swapFeeDataMap[pool.poolId]) {
                apr_24h = (pool.fees24h * 365) / pool.totalLiquidity;
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

            apr_24h = apr_24h * (1 - protocolFee);
            apr_7d = apr_7d * (1 - protocolFee);
            apr_30d = apr_30d * (1 - protocolFee);

            if (apr_24h > MAX_DB_INT) {
                apr_24h = 0;
            }
            if (apr_7d > MAX_DB_INT) {
                apr_7d = 0;
            }
            if (apr_30d > MAX_DB_INT) {
                apr_30d = 0;
            }

            return [
                prisma.prismaPoolAprItem.upsert({
                    where: { id_chain: { id: `${pool.poolId}-swap-apr`, chain } },
                    create: {
                        id: `${pool.poolId}-swap-apr`,
                        chain,
                        poolId: pool.poolId,
                        title: 'Swap fees APR',
                        apr: apr_24h,
                        type: 'SWAP_FEE',
                    },
                    update: { apr: apr_24h },
                }),
                prisma.prismaPoolAprItem.upsert({
                    where: { id_chain: { id: `${pool.poolId}-swap-apr-24h`, chain } },
                    create: {
                        id: `${pool.poolId}-swap-apr-24h`,
                        chain,
                        poolId: pool.poolId,
                        title: 'Swap fees APR (24h)',
                        apr: apr_24h,
                        type: 'SWAP_FEE_24H',
                    },
                    update: { apr: apr_24h },
                }),
                prisma.prismaPoolAprItem.upsert({
                    where: { id_chain: { id: `${pool.poolId}-swap-apr-7d`, chain } },
                    create: {
                        id: `${pool.poolId}-swap-apr-7d`,
                        chain,
                        poolId: pool.poolId,
                        title: 'Swap fees APR (7d)',
                        apr: apr_7d,
                        type: 'SWAP_FEE_7D',
                    },
                    update: { apr: apr_7d },
                }),
                prisma.prismaPoolAprItem.upsert({
                    where: { id_chain: { id: `${pool.poolId}-swap-apr-30d`, chain } },
                    create: {
                        id: `${pool.poolId}-swap-apr-30d`,
                        chain,
                        poolId: pool.poolId,
                        title: 'Swap fees APR (30d)',
                        apr: apr_30d,
                        type: 'SWAP_FEE_30D',
                    },
                    update: { apr: apr_30d },
                }),
            ];
        });

        await prismaBulkExecuteOperations(operations);
    }
}
