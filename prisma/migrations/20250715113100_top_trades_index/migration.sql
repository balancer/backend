-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_poolId_chain_valueUSD_idx" ON "PartitionedPoolEvent"("poolId", "chain", "valueUSD" DESC) where type = 'SWAP'
