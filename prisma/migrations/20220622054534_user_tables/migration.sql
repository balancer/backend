-- CreateEnum
CREATE TYPE "PrismaUserBalanceType" AS ENUM ('WALLET', 'STAKED');

-- CreateTable
CREATE TABLE "PrismaUserWalletBalance" (
    "id" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "balanceNum" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAddress" TEXT NOT NULL,
    "poolId" TEXT,
    "tokenAddress" TEXT NOT NULL,

    CONSTRAINT "PrismaUserWalletBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaUserStakedBalance" (
    "id" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "balanceNum" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAddress" TEXT NOT NULL,
    "poolId" TEXT,
    "tokenAddress" TEXT NOT NULL,
    "stakingId" TEXT NOT NULL,

    CONSTRAINT "PrismaUserStakedBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaUserBalanceSyncStatus" (
    "type" "PrismaUserBalanceType" NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "PrismaUserBalanceSyncStatus_pkey" PRIMARY KEY ("type")
);

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_stakingId_fkey" FOREIGN KEY ("stakingId") REFERENCES "PrismaPoolStaking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
