/*
  Warnings:

  - The values [LINEAR_BOOSTED] on the enum `PrismaPoolAprType` will be removed. If these variants are still used in the database, this will fail.
  - The values [LINEAR_WRAPPED_TOKEN] on the enum `PrismaTokenTypeOption` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PrismaPoolAprType_new" AS ENUM ('SWAP_FEE', 'NATIVE_REWARD', 'THIRD_PARTY_REWARD', 'PHANTOM_STABLE_BOOSTED', 'IB_YIELD', 'VOTING');
ALTER TABLE "PrismaPoolAprItem" ALTER COLUMN "type" TYPE "PrismaPoolAprType_new" USING ("type"::text::"PrismaPoolAprType_new");
ALTER TYPE "PrismaPoolAprType" RENAME TO "PrismaPoolAprType_old";
ALTER TYPE "PrismaPoolAprType_new" RENAME TO "PrismaPoolAprType";
DROP TYPE "PrismaPoolAprType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PrismaTokenTypeOption_new" AS ENUM ('WHITE_LISTED', 'BPT', 'PHANTOM_BPT');
ALTER TABLE "PrismaTokenType" ALTER COLUMN "type" TYPE "PrismaTokenTypeOption_new" USING ("type"::text::"PrismaTokenTypeOption_new");
ALTER TYPE "PrismaTokenTypeOption" RENAME TO "PrismaTokenTypeOption_old";
ALTER TYPE "PrismaTokenTypeOption_new" RENAME TO "PrismaTokenTypeOption";
DROP TYPE "PrismaTokenTypeOption_old";
COMMIT;
