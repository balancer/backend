/*
  Warnings:

  - Added the required column `order` to the `PartitionedPoolEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PartitionedPoolEvent_blockNumber_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_chain_blockNumber_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_chain_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_chain_poolId_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_logIndex_idx";

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_poolId_idx" ON "PartitionedPoolEvent"("poolId");

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_blockNumber_logIndex_idx" ON "PartitionedPoolEvent"("blockNumber" DESC, "logIndex" DESC);


