-- CreateTable
CREATE TABLE "PrismaUserWalletBalance" (
    "id" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAddress" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,

    CONSTRAINT "PrismaUserWalletBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaUserStakedBalance" (
    "id" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAddress" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "stakingId" TEXT NOT NULL,

    CONSTRAINT "PrismaUserStakedBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaUserPoolSyncStatus" (
    "id" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "PrismaUserPoolSyncStatus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_stakingId_fkey" FOREIGN KEY ("stakingId") REFERENCES "PrismaPoolStaking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
