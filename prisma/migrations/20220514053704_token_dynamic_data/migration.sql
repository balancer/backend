-- CreateTable
CREATE TABLE "PrismaTokenDynamicData" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "ath" DOUBLE PRECISION NOT NULL,
    "atl" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION NOT NULL,
    "fdv" DOUBLE PRECISION NOT NULL,
    "high24h" DOUBLE PRECISION NOT NULL,
    "low24h" DOUBLE PRECISION NOT NULL,
    "priceChange24h" DOUBLE PRECISION NOT NULL,
    "priceChangePercent24h" DOUBLE PRECISION NOT NULL,
    "priceChangePercent7d" DOUBLE PRECISION NOT NULL,
    "priceChangePercent14d" DOUBLE PRECISION NOT NULL,
    "priceChangePercent30d" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PrismaTokenDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaTokenDynamicData_tokenAddress_key" ON "PrismaTokenDynamicData"("tokenAddress");

-- AddForeignKey
ALTER TABLE "PrismaTokenDynamicData" ADD CONSTRAINT "PrismaTokenDynamicData_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
