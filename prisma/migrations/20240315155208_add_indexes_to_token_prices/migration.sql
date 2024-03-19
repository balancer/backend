-- CreateIndex
CREATE INDEX "PrismaTokenPrice_timestamp_chain_idx" ON "PrismaTokenPrice"("timestamp", "chain");

-- CreateIndex
CREATE INDEX "PrismaTokenPrice_tokenAddress_idx" ON "PrismaTokenPrice"("tokenAddress");
