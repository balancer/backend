-- CreateIndex
CREATE INDEX "PrismaToken_address_chain_idx" ON "PrismaToken"("address", "chain");

-- CreateIndex
CREATE INDEX "PrismaTokenDynamicData_tokenAddress_chain_idx" ON "PrismaTokenDynamicData"("tokenAddress", "chain");
