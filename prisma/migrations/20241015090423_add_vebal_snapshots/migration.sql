-- CreateTable
CREATE TABLE "PrismaVeBalUserBalanceSnapshot" (
    "userAddress" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "bias" TEXT NOT NULL,
    "slope" TEXT NOT NULL,
    "balance" TEXT NOT NULL,

    CONSTRAINT "PrismaVeBalUserBalanceSnapshot_pkey" PRIMARY KEY ("userAddress","timestamp")
);

-- AddForeignKey
ALTER TABLE "PrismaVeBalUserBalanceSnapshot" ADD CONSTRAINT "PrismaVeBalUserBalanceSnapshot_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
