-- DropIndex
DROP INDEX "PartitionedPoolEvent_blockNumber_logIndex_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_blockTimestamp_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_userAddress_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_valueUSD_idx";

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_blockTimestamp_blockNumber_logIndex_idx" ON "PartitionedPoolEvent"("blockTimestamp" DESC, "blockNumber" DESC, "logIndex" DESC);
