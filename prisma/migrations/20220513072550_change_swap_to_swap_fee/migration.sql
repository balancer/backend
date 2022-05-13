/*
  Warnings:

  - The values [SWAP] on the enum `PrismaPoolAprType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PrismaPoolAprType_new" AS ENUM ('SWAP_FEE', 'NATIVE_REWARD', 'THIRD_PARTY_REWARD', 'LINEAR_BOOSTED', 'PHANTOM_STABLE_BOOSTED');
ALTER TABLE "PrismaPoolAprItem" ALTER COLUMN "type" TYPE "PrismaPoolAprType_new" USING ("type"::text::"PrismaPoolAprType_new");
ALTER TYPE "PrismaPoolAprType" RENAME TO "PrismaPoolAprType_old";
ALTER TYPE "PrismaPoolAprType_new" RENAME TO "PrismaPoolAprType";
DROP TYPE "PrismaPoolAprType_old";
COMMIT;
