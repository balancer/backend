-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "PrismaLastBlockSyncedCategory" ADD VALUE 'COW_AMM_JOIN_EXITS';
ALTER TYPE "PrismaLastBlockSyncedCategory" ADD VALUE 'COW_AMM_SWAPS';
ALTER TYPE "PrismaLastBlockSyncedCategory" ADD VALUE 'COW_AMM_SNAPSHOTS';

-- In case of rollback, the following SQL can be used to revert the changes:
-- ALTER TYPE "PrismaLastBlockSyncedCategory" RENAME TO "PrismaLastBlockSyncedCategory_old";
-- DROP TYPE "PrismaLastBlockSyncedCategory" CASCADE;
-- CREATE TYPE "PrismaLastBlockSyncedCategory" AS ENUM ('POOLS', 'FARMS', 'COW_AMM_POOLS');
-- ALTER TABLE "PrismaLastBlockSynced" ADD COLUMN category "PrismaLastBlockSyncedCategory";
