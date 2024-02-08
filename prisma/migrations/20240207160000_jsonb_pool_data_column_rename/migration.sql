-- Remove old tables
ALTER TABLE "PrismaPool" RENAME COLUMN "staticTypeData" TO "typeData";
