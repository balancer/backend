/*
  Warnings:

  - The values [FEATURED,HOME_FEATURED] on the enum `PrismaPoolCategoryType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PrismaPoolCategoryType_new" AS ENUM ('INCENTIVIZED', 'BLACK_LISTED');
ALTER TABLE "PrismaPoolCategory" ALTER COLUMN "category" TYPE "PrismaPoolCategoryType_new" USING ("category"::text::"PrismaPoolCategoryType_new");
ALTER TYPE "PrismaPoolCategoryType" RENAME TO "PrismaPoolCategoryType_old";
ALTER TYPE "PrismaPoolCategoryType_new" RENAME TO "PrismaPoolCategoryType";
DROP TYPE "PrismaPoolCategoryType_old";
COMMIT;
