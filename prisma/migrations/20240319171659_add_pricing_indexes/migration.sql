-- DropIndex
DROP INDEX "PrismaTokenPrice_timestamp_chain_idx";

-- CreateIndex
CREATE INDEX "PrismaTokenCurrentPrice_tokenAddress_idx" ON "PrismaTokenCurrentPrice"("tokenAddress");

-- CreateIndex
CREATE INDEX "PrismaTokenCurrentPrice_chain_idx" ON "PrismaTokenCurrentPrice"("chain");

-- CreateIndex
CREATE INDEX "PrismaTokenPrice_timestamp_idx" ON "PrismaTokenPrice"("timestamp");

-- CreateIndex
CREATE INDEX "PrismaTokenPrice_chain_idx" ON "PrismaTokenPrice"("chain");
