ALTER TABLE "PoolEvent" RENAME TO "PrismaPoolEvent";

-- AlterTable
ALTER TABLE "PrismaPoolEvent" RENAME CONSTRAINT "PoolEvent_pkey" TO "PrismaPoolEvent_pkey";

-- RenameIndex
ALTER INDEX "PoolEvent_blockNumber_idx" RENAME TO "PrismaPoolEvent_blockNumber_idx";

-- RenameIndex
ALTER INDEX "PoolEvent_chain_idx" RENAME TO "PrismaPoolEvent_chain_idx";

-- RenameIndex
ALTER INDEX "PoolEvent_chain_poolId_idx" RENAME TO "PrismaPoolEvent_chain_poolId_idx";

-- RenameIndex
ALTER INDEX "PoolEvent_logIndex_idx" RENAME TO "PrismaPoolEvent_logIndex_idx";

-- RenameIndex
ALTER INDEX "PoolEvent_type_idx" RENAME TO "PrismaPoolEvent_type_idx";

-- RenameIndex
ALTER INDEX "PoolEvent_userAddress_idx" RENAME TO "PrismaPoolEvent_userAddress_idx";
