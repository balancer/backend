/*
  Warnings:

  - You are about to drop the column `rewarder` on the `PrismaPoolStaking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrismaPoolStaking" DROP COLUMN "rewarder";

-- AlterTable
ALTER TABLE "PrismaPoolSwap" ADD COLUMN     "batchSwapId" TEXT,
ADD COLUMN     "batchSwapIdx" INTEGER;

-- CreateTable
CREATE TABLE "PrismaPoolBatchSwap" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "tokenIn" TEXT NOT NULL,
    "tokenOut" TEXT NOT NULL,
    "tokenAmountIn" TEXT NOT NULL,
    "tokenAmountOut" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "tx" TEXT NOT NULL,
    "valueUSD" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PrismaPoolBatchSwap_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaPoolSwap" ADD CONSTRAINT "PrismaPoolSwap_batchSwapId_fkey" FOREIGN KEY ("batchSwapId") REFERENCES "PrismaPoolBatchSwap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
