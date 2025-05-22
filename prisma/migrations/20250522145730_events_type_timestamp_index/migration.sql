-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_chain_type_blockTimestamp_idx" ON "PartitionedPoolEvent"("chain", "type", "blockTimestamp");
