-- DropIndex
DROP INDEX "PrismaPoolSnapshot_poolId_chain_idx";

-- DropIndex
DROP INDEX "PrismaPoolSnapshot_timestamp_idx";

-- CreateIndex
CREATE INDEX "PrismaPoolSnapshot_poolId_chain_timestamp_idx" ON "PrismaPoolSnapshot"("poolId", "chain", "timestamp" DESC);
