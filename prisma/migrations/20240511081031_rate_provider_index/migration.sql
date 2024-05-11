-- DropForeignKey
ALTER TABLE "PrismaPriceRateProviderData" DROP CONSTRAINT "PrismaPriceRateProviderData_tokenAddress_chain_fkey";

-- CreateIndex
CREATE INDEX "PrismaPriceRateProviderData_chain_rateProviderAddress_idx" ON "PrismaPriceRateProviderData"("chain", "rateProviderAddress");

-- CreateIndex
CREATE INDEX "PrismaPriceRateProviderData_tokenAddress_idx" ON "PrismaPriceRateProviderData"("tokenAddress");

-- AddForeignKey
ALTER TABLE "PrismaPriceRateProviderData" ADD CONSTRAINT "PrismaPriceRateProviderData_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE CASCADE ON UPDATE CASCADE;
