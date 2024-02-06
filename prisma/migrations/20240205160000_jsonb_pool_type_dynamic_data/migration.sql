-- Migrate pool data from tables to JSON columns
WITH stable_data as (
    SELECT t.id, jsonb(row_to_json(t)) - 'id' as json
    FROM (
        SELECT id, amp
        FROM "PrismaPoolStableDynamicData"
    ) t
)
UPDATE "PrismaPool"
SET "staticTypeData" = "staticTypeData" || json
FROM stable_data
WHERE "PrismaPool".id = stable_data.id;

WITH linear_data as (
    SELECT t.id, jsonb(row_to_json(t)) - 'id' as json
    FROM (
        SELECT id, "lowerTarget", "upperTarget"
        FROM "PrismaPoolLinearDynamicData"
    ) t
)
UPDATE "PrismaPool"
SET "staticTypeData" = "staticTypeData" || json
FROM linear_data
WHERE "PrismaPool".id = linear_data.id;

-- Remove old tables
DROP TABLE "PrismaPoolLinearDynamicData";
DROP TABLE "PrismaPoolStableDynamicData";
