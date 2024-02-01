-- Migrate pool data from tables to JSON columns
WITH json_data as (
    (
        SELECT t.id, jsonb(row_to_json(t)) - 'id' - 'chain' - 'poolId' as json
        FROM (
            SELECT *
            FROM "PrismaPoolGyroData"
        ) t
    )
    UNION
    (
        SELECT t.id, jsonb(row_to_json(t)) - 'id' - 'chain' - 'poolId' as json
        FROM (
            SELECT *
            FROM "PrismaPoolLinearData"
        ) t
    )
    UNION
    (
        SELECT t.id, jsonb(row_to_json(t)) - 'id' - 'chain' - 'poolId' as json
        FROM (
            SELECT *
            FROM "PrismaPoolElementData"
        ) t
    )
)
UPDATE "PrismaPool"
SET "staticTypeData" = json
FROM json_data
WHERE "PrismaPool".id = json_data.id;

-- Remove old tables
DROP TABLE "PrismaPoolGyroData";
DROP TABLE "PrismaPoolLinearData";
DROP TABLE "PrismaPoolElementData";
