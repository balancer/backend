import { Chain, PrismaPoolSnapshot } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { daysAgo, roundToMidnight } from '../../common/time';

export const viewSnapshotsV2 = (poolId: string, chain: Chain, since = roundToMidnight(daysAgo(30))) => {
    const snapshots = prisma.$queryRawUnsafe<PrismaPoolSnapshot[]>(`
        WITH
        -- Generate continuous daily timestamps
        daily_timestamps AS (
            SELECT extract(epoch from date_series::date)::integer AS timestamp
            FROM generate_series(
                to_timestamp(${since})::date,
                CURRENT_DATE,
                '1 day'::interval
            ) AS date_series
        ),

        -- Get most recent snapshot data for each daily timestamp
        snapshots AS (
            SELECT
                dt.timestamp AS dt_timestamp,
                -- Latest snapshot data (carries forward when missing)
                latest_snapshot.*,
                -- Check if snapshot exists for exact timestamp
                (latest_snapshot.timestamp = dt.timestamp) AS has_current_data

            FROM daily_timestamps dt

            -- Get most recent snapshot <= current timestamp
            LEFT JOIN LATERAL (
                SELECT *
                FROM "PrismaPoolSnapshot"
                WHERE "poolId" = '${poolId}'
                    AND chain = '${chain}'
                    AND timestamp <= dt.timestamp
                ORDER BY timestamp DESC
                LIMIT 1
            ) latest_snapshot ON true
        )

        SELECT
            '${poolId}' || '-' || dt_timestamp AS id,
            '${poolId}' AS "poolId",
            '${chain}' AS chain,
            dt_timestamp AS timestamp,
            COALESCE("protocolVersion", 2) AS "protocolVersion",

            -- Volume and fees only when current data exists
            CASE WHEN has_current_data THEN "volume24h" ELSE 0 END AS "volume24h",
            CASE WHEN has_current_data THEN "fees24h" ELSE 0 END AS "fees24h",

            -- Other fields with defaults
            COALESCE("totalLiquidity", 0) AS "totalLiquidity",
            COALESCE("sharePrice", 0) AS "sharePrice",
            COALESCE("surplus24h", 0) AS "surplus24h",
            COALESCE("totalShares", '0') AS "totalShares",
            COALESCE("totalSharesNum", 0) AS "totalSharesNum",
            COALESCE("totalSwapVolume", 0) AS "totalSwapVolume",
            COALESCE("totalSwapFee", 0) AS "totalSwapFee",
            COALESCE("totalSurplus", 0) AS "totalSurplus",
            COALESCE("swapsCount", 0) AS "swapsCount",
            COALESCE("holdersCount", 0) AS "holdersCount",
            COALESCE("amounts", '{}') AS "amounts",
            COALESCE("totalVolumes", '{}') AS "totalVolumes",
            COALESCE("dailyVolumes", '{}') AS "dailyVolumes",
            COALESCE("totalSwapFees", '{}') AS "totalSwapFees",
            COALESCE("dailySwapFees", '{}') AS "dailySwapFees",
            COALESCE("totalSurpluses", '{}') AS "totalSurpluses",
            COALESCE("dailySurpluses", '{}') AS "dailySurpluses",
            COALESCE("totalProtocolSwapFees", '{}') AS "totalProtocolSwapFees",
            COALESCE("dailyProtocolSwapFees", '{}') AS "dailyProtocolSwapFees",
            COALESCE("totalProtocolYieldFees", '{}') AS "totalProtocolYieldFees",
            COALESCE("dailyProtocolYieldFees", '{}') AS "dailyProtocolYieldFees"

        FROM snapshots
        ORDER BY timestamp ASC
    `);

    return snapshots;
};

export const viewSnapshotsV2WithPricing = (poolId: string, chain: Chain, since = roundToMidnight(daysAgo(30))) => {
    const poolAddress = poolId.substring(0, 42);

    const snapshots = prisma.$queryRawUnsafe<PrismaPoolSnapshot[]>(`
        WITH
        -- Generate continuous daily timestamps
        daily_timestamps AS (
            SELECT extract(epoch from date_series::date)::integer AS timestamp
            FROM generate_series(
                to_timestamp(${since})::date,
                CURRENT_DATE,
                '1 day'::interval
            ) AS date_series
        ),

        -- Get most recent snapshot data for each daily timestamp
        snapshots_with_prices AS (
            SELECT
                dt.timestamp AS dt_timestamp,
                -- Latest snapshot data (carries forward when missing)
                latest_snapshot.*,
                -- Token price for sharePrice calculation
                latest_price.price AS token_price,
                -- Check if snapshot exists for exact timestamp
                (latest_snapshot.timestamp = dt.timestamp) AS has_current_data

            FROM daily_timestamps dt

            -- Get most recent snapshot <= current timestamp
            LEFT JOIN LATERAL (
                SELECT *
                FROM "PrismaPoolSnapshot"
                WHERE "poolId" = '${poolId}'
                    AND chain = '${chain}'
                    AND timestamp <= dt.timestamp
                ORDER BY timestamp DESC
                LIMIT 1
            ) latest_snapshot ON true

            -- Get most recent token price <= current timestamp
            LEFT JOIN LATERAL (
                SELECT price
                FROM "PrismaTokenPrice"
                WHERE "tokenAddress" = '${poolAddress}'
                    AND chain = '${chain}'
                    AND timestamp <= dt.timestamp
                ORDER BY timestamp DESC
                LIMIT 1
            ) latest_price ON true
        )

        SELECT
            '${poolId}' || '-' || dt_timestamp AS id,
            '${poolId}' AS "poolId",
            '${chain}' AS chain,
            dt_timestamp AS timestamp,
            COALESCE("protocolVersion", 2) AS "protocolVersion",

            -- Calculated fields using token price when available
            CASE
                WHEN token_price IS NOT NULL
                THEN COALESCE("totalSharesNum", 0) * token_price
                ELSE COALESCE("totalLiquidity", 0)
            END AS "totalLiquidity",

            CASE
                WHEN token_price IS NOT NULL THEN token_price
                WHEN "totalSharesNum" > 0 AND "totalLiquidity" > 0
                THEN "totalLiquidity" / "totalSharesNum"
                ELSE 0
            END AS "sharePrice",

            -- Volume and fees only when current data exists
            CASE WHEN has_current_data THEN "volume24h" ELSE 0 END AS "volume24h",
            CASE WHEN has_current_data THEN "fees24h" ELSE 0 END AS "fees24h",

            -- Other fields with defaults
            COALESCE("surplus24h", 0) AS "surplus24h",
            COALESCE("totalShares", '0') AS "totalShares",
            COALESCE("totalSharesNum", 0) AS "totalSharesNum",
            COALESCE("totalSwapVolume", 0) AS "totalSwapVolume",
            COALESCE("totalSwapFee", 0) AS "totalSwapFee",
            COALESCE("totalSurplus", 0) AS "totalSurplus",
            COALESCE("swapsCount", 0) AS "swapsCount",
            COALESCE("holdersCount", 0) AS "holdersCount",
            COALESCE("amounts", '{}') AS "amounts",
            COALESCE("totalVolumes", '{}') AS "totalVolumes",
            COALESCE("dailyVolumes", '{}') AS "dailyVolumes",
            COALESCE("totalSwapFees", '{}') AS "totalSwapFees",
            COALESCE("dailySwapFees", '{}') AS "dailySwapFees",
            COALESCE("totalSurpluses", '{}') AS "totalSurpluses",
            COALESCE("dailySurpluses", '{}') AS "dailySurpluses",
            COALESCE("totalProtocolSwapFees", '{}') AS "totalProtocolSwapFees",
            COALESCE("dailyProtocolSwapFees", '{}') AS "dailyProtocolSwapFees",
            COALESCE("totalProtocolYieldFees", '{}') AS "totalProtocolYieldFees",
            COALESCE("dailyProtocolYieldFees", '{}') AS "dailyProtocolYieldFees"

        FROM snapshots_with_prices
        ORDER BY timestamp ASC
    `);

    return snapshots;
};
