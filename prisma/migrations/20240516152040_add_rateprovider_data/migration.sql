-- CreateTable
CREATE TABLE "PrismaPriceRateProviderData" (
    "chain" "Chain" NOT NULL,
    "rateProviderAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL,
    "name" TEXT,
    "summary" TEXT,
    "reviewUrl" TEXT,

    CONSTRAINT "PrismaPriceRateProviderData_pkey" PRIMARY KEY ("chain","rateProviderAddress")
);

-- CreateIndex
CREATE INDEX "PrismaPriceRateProviderData_chain_rateProviderAddress_idx" ON "PrismaPriceRateProviderData"("chain", "rateProviderAddress");

-- CreateIndex
CREATE INDEX "PrismaPriceRateProviderData_tokenAddress_idx" ON "PrismaPriceRateProviderData"("tokenAddress");
