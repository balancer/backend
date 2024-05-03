/*
  Warnings:

  - The values [LINEAR] on the enum `PrismaPoolType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PrismaPoolType_new" AS ENUM ('WEIGHTED', 'STABLE', 'META_STABLE', 'PHANTOM_STABLE', 'COMPOSABLE_STABLE', 'ELEMENT', 'UNKNOWN', 'LIQUIDITY_BOOTSTRAPPING', 'INVESTMENT', 'GYRO', 'GYRO3', 'GYROE', 'FX');
ALTER TABLE "PrismaPool" ALTER COLUMN "type" TYPE "PrismaPoolType_new" USING ("type"::text::"PrismaPoolType_new");
ALTER TYPE "PrismaPoolType" RENAME TO "PrismaPoolType_old";
ALTER TYPE "PrismaPoolType_new" RENAME TO "PrismaPoolType";
DROP TYPE "PrismaPoolType_old";
COMMIT;
