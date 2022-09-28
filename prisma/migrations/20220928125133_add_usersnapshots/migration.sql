-- CreateTable
CREATE TABLE "PrismaUserPoolBalanceSnapshot" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "poolToken" TEXT NOT NULL,
    "poolId" TEXT,
    "walletBalance" TEXT NOT NULL,
    "gaugeBalance" TEXT NOT NULL,
    "farmBalance" TEXT NOT NULL,
    "totalBalance" TEXT NOT NULL,
    "percentShare" TEXT NOT NULL,
    "totalValueUSD" TEXT NOT NULL,
    "fees24h" TEXT NOT NULL,

    CONSTRAINT "PrismaUserPoolBalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaUserPoolBalanceSnapshot" ADD CONSTRAINT "PrismaUserPoolBalanceSnapshot_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserPoolBalanceSnapshot" ADD CONSTRAINT "PrismaUserPoolBalanceSnapshot_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
