-- Remove old tables
ALTER TABLE "PrismaPool" RENAME COLUMN "staticTypeData" TO type_data;
