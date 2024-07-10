/*
  Warnings:

  - The values [PHANTOM_STABLE_BOOSTED] on the enum `PrismaPoolAprType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
DELETE FROM "PrismaPoolAprItem" where type = 'PHANTOM_STABLE_BOOSTED';
CREATE TYPE "PrismaPoolAprType_new" AS ENUM ('SWAP_FEE', 'NATIVE_REWARD', 'THIRD_PARTY_REWARD', 'IB_YIELD', 'VOTING', 'LOCKING', 'AURA', 'MERKL');
ALTER TABLE "PrismaPoolAprItem" ALTER COLUMN "type" TYPE "PrismaPoolAprType_new" USING ("type"::text::"PrismaPoolAprType_new");
ALTER TYPE "PrismaPoolAprType" RENAME TO "PrismaPoolAprType_old";
ALTER TYPE "PrismaPoolAprType_new" RENAME TO "PrismaPoolAprType";
DROP TYPE "PrismaPoolAprType_old";
COMMIT;
