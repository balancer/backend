import { Prisma, Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';

export const getSnapshotData = async (daysBack: number, chain: Chain, poolId: string) => {
    const query = Prisma.sql`
      WITH start_date AS (
          SELECT
              date_trunc('day', NOW() - INTERVAL '${Prisma.raw(daysBack.toString())} days') AS start_day,
              EXTRACT(epoch FROM date_trunc('day', NOW() - INTERVAL '${Prisma.raw(daysBack.toString())} days'))::int AS start_timestamp
      ),
      base_snapshots AS (
          SELECT
              "poolId",
              "totalLiquidity" as base_tvl,
              "totalSwapVolume" as base_volume,
              timestamp,
              ROW_NUMBER() OVER (PARTITION BY "poolId" ORDER BY timestamp DESC) as rn
          FROM "PrismaPoolSnapshot"
          WHERE "poolId" = ${poolId}
              AND chain = ${chain}::"Chain"
              AND timestamp < (SELECT start_timestamp FROM start_date)
      ),
      base_snapshot AS (
          SELECT "poolId", base_tvl, base_volume, timestamp
          FROM base_snapshots
          WHERE rn = 1
      ),
      daily_volumes AS (
          SELECT
              date_trunc('day', to_timestamp("blockTimestamp")) AS day,
              "poolId" as pool_id,
              COUNT(*) AS total_swaps,
              SUM("valueUSD") AS daily_volume
          FROM "PartitionedPoolEvent"
          WHERE type = 'SWAP'
              AND chain = ${chain}::"Chain"
              AND "poolId" = ${poolId}
              AND "blockTimestamp" >= (SELECT start_timestamp FROM start_date)
              AND "blockTimestamp" <= EXTRACT(epoch FROM NOW())::int
          GROUP BY 1, 2
      ),
      daily_tvls AS (
          SELECT
              date_trunc('day', to_timestamp("blockTimestamp")) AS day,
              "poolId" as pool_id,
              SUM(CASE WHEN type = 'JOIN' THEN "valueUSD" ELSE -"valueUSD" END) AS daily_balance_change
          FROM "PartitionedPoolEvent"
          WHERE type IN ('JOIN', 'EXIT')
              AND chain = ${chain}::"Chain"
              AND "poolId" = ${poolId}
              AND "blockTimestamp" >= (SELECT start_timestamp FROM start_date)
              AND "blockTimestamp" <= EXTRACT(epoch FROM NOW())::int
          GROUP BY 1, 2
      ),
      aggregated_stats AS (
          SELECT
              COALESCE(dv.pool_id, dt.pool_id) AS pool_id,
              EXTRACT(epoch from COALESCE(dv.day, dt.day))::int AS timestamp,
              COALESCE(dv.total_swaps, 0) AS total_swaps,
              COALESCE(dv.daily_volume, 0) AS daily_volume,
              COALESCE(bs.base_volume, 0) +
                  SUM(COALESCE(dv.daily_volume, 0)) OVER (PARTITION BY COALESCE(dv.pool_id, dt.pool_id) ORDER BY COALESCE(dv.day, dt.day) ASC) AS cumulative_volume,
              COALESCE(bs.base_tvl, 0) +
                  SUM(COALESCE(dt.daily_balance_change, 0)) OVER (PARTITION BY COALESCE(dv.pool_id, dt.pool_id) ORDER BY COALESCE(dv.day, dt.day) ASC) AS tvl
          FROM daily_volumes dv
          FULL OUTER JOIN daily_tvls dt ON dv.day = dt.day AND dv.pool_id = dt.pool_id
          LEFT JOIN base_snapshot bs ON bs."poolId" = COALESCE(dv.pool_id, dt.pool_id)
      )
      SELECT
          s.daily_volume as "volume24h",
          s.daily_volume * COALESCE(CAST(p."swapFee" AS FLOAT), 0) as "fees24h",
          s.cumulative_volume as "totalSwapVolume",
          s.cumulative_volume * COALESCE(CAST(p."swapFee" AS FLOAT), 0) as "totalSwapFee",
          s.total_swaps as "swapsCount",
          s.tvl as "totalLiquidity",
          s.timestamp,
          s.pool_id,
          p.chain
      FROM aggregated_stats s
      JOIN "PrismaPoolDynamicData" p ON p.id = s.pool_id AND p.chain = ${chain}::"Chain"
  `;

    const result = await prisma.$queryRaw(query);

    return result as {
        volume24h: number;
        fees24h: number;
        totalSwapVolume: number;
        totalSwapFee: number;
        swapsCount: number;
        totalLiquidity: number;
        timestamp: number;
        pool_id: string;
        chain: Chain;
    }[];
};
