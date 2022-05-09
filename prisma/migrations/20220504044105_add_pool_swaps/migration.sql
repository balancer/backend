/*
  Warnings:

  - Changed the type of `totalLiquidity` on the `PrismaPoolDynamicData` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `volume24h` on the `PrismaPoolDynamicData` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fees24h` on the `PrismaPoolDynamicData` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `balanceUSD` on the `PrismaPoolTokenDynamicData` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" DROP COLUMN "totalLiquidity",
ADD COLUMN     "totalLiquidity" DOUBLE PRECISION NOT NULL,
DROP COLUMN "volume24h",
ADD COLUMN     "volume24h" DOUBLE PRECISION NOT NULL,
DROP COLUMN "fees24h",
ADD COLUMN     "fees24h" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "PrismaPoolTokenDynamicData" DROP COLUMN "balanceUSD",
ADD COLUMN     "balanceUSD" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "PrismaPoolSwap" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "tokenIn" TEXT NOT NULL,
    "tokenInSym" TEXT NOT NULL,
    "tokenOut" TEXT NOT NULL,
    "tokenOutSym" TEXT NOT NULL,
    "tokenAmountIn" TEXT NOT NULL,
    "tokenAmountOut" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "tx" TEXT NOT NULL,
    "valueUSD" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PrismaPoolSwap_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaPoolSwap" ADD CONSTRAINT "PrismaPoolSwap_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
