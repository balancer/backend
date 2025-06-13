-- CreateIndex
CREATE INDEX IF NOT EXISTS "PartitionedPoolEvent_chain_userAddress_idx" ON "PartitionedPoolEvent"("chain", "userAddress");
