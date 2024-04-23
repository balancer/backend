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

-- AddForeignKey
ALTER TABLE "PrismaPriceRateProviderData" ADD CONSTRAINT "PrismaPriceRateProviderData_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;
