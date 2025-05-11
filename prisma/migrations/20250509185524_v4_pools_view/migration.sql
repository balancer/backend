DROP VIEW IF EXISTS "pools";

CREATE VIEW "pools" AS
SELECT
    p.*,
    d."totalLiquidity",
    d."totalShares"
FROM
    "PrismaPool" p
    LEFT JOIN "PrismaPoolDynamicData" d ON p.id = d."poolId"
    AND p.chain = d.chain;