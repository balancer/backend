-- CreateIndex
CREATE INDEX "PrismaPoolEvent_chain_blockNumber_idx" ON "PrismaPoolEvent"("chain", "blockNumber" DESC);
