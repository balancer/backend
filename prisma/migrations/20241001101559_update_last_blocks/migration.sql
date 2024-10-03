-- Read latest block numbers grouped by chain with the filter on protocolVersion = 1 from pool events table
WITH "LatestBlockNumbers" AS (
    SELECT
        chain,
        MAX("blockNumber") AS "latestBlockNumber"
    FROM
        "PartitionedPoolEvent"
    WHERE
        "protocolVersion" = 1
		AND type IN ('JOIN', 'EXIT')
    GROUP BY
        chain
)
INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT
    'COW_AMM_JOIN_EXITS' AS category,
    chain,
    "latestBlockNumber"
FROM
    "LatestBlockNumbers"
ON CONFLICT (category, chain)
DO UPDATE SET "blockNumber" = EXCLUDED."blockNumber";

WITH "LatestBlockNumbers" AS (
    SELECT
        chain,
        MAX("blockNumber") AS "latestBlockNumber"
    FROM
        "PartitionedPoolEvent"
    WHERE
        "protocolVersion" = 1
		AND type IN ('SWAP')
    GROUP BY
        chain
)
INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT
    'COW_AMM_SWAPS' AS category,
    chain,
    "latestBlockNumber"
FROM
    "LatestBlockNumbers"
ON CONFLICT (category, chain)
DO UPDATE SET "blockNumber" = EXCLUDED."blockNumber";

WITH "LatestTimestamp" AS (
    SELECT
        chain,
        MAX("timestamp") AS "latestTimestamp"
    FROM
        "PrismaPoolSnapshot"
    WHERE
        "protocolVersion" = 1
    GROUP BY
        chain
)
INSERT INTO "PrismaLastBlockSynced" (category, chain, "blockNumber")
SELECT
    'COW_AMM_SNAPSHOTS' AS category,
    chain,
    "latestTimestamp"
FROM
    "LatestTimestamp"
ON CONFLICT (category, chain)
DO UPDATE SET "blockNumber" = EXCLUDED."blockNumber";
