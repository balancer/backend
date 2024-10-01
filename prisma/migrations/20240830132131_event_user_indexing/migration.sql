-- DropIndex
DROP INDEX "PartitionedPoolEvent_poolId_idx";

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_chain_poolId_userAddress_idx" ON "PartitionedPoolEvent"("chain", "poolId", "userAddress");
