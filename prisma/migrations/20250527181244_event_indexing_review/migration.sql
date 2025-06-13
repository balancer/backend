-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_chain_type_blockTimestamp_blockNumber__idx" ON "PartitionedPoolEvent"("chain", "type", "blockTimestamp" DESC, "blockNumber" DESC, "logIndex" DESC);

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_chain_poolId_blockTimestamp_blockNumbe_idx" ON "PartitionedPoolEvent"("chain", "poolId", "blockTimestamp" DESC, "blockNumber" DESC, "logIndex" DESC);

-- DropIndex
DROP INDEX "PartitionedPoolEvent_blockTimestamp_blockNumber_logIndex_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_chain_poolId_userAddress_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_chain_type_blockTimestamp_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_protocolVersion_idx";

-- DropIndex
DROP INDEX "PartitionedPoolEvent_type_idx";
