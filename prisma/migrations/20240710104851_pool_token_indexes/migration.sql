-- CreateIndex
CREATE INDEX "PrismaPoolToken_poolId_chain_idx" ON "PrismaPoolToken"("poolId", "chain");

-- CreateIndex
CREATE INDEX "PrismaPoolToken_address_chain_idx" ON "PrismaPoolToken"("address", "chain");

-- CreateIndex
CREATE INDEX "PrismaPoolToken_nestedPoolId_chain_idx" ON "PrismaPoolToken"("nestedPoolId", "chain");
