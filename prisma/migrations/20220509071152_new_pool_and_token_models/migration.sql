/*
  Warnings:

  - Added the required column `decimals` to the `PrismaToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `close` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `high` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `low` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `open` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PrismaTokenPrice` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `price` on the `PrismaTokenPrice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PrismaLastBlockSyncedCategory" AS ENUM ('POOLS', 'FARMS');

-- CreateEnum
CREATE TYPE "PrismaPoolType" AS ENUM ('WEIGHTED', 'STABLE', 'META_STABLE', 'PHANTOM_STABLE', 'ELEMENT', 'LINEAR', 'UNKNOWN', 'LIQUIDITY_BOOTSTRAPPING', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "PrismaPoolCategoryType" AS ENUM ('INCENTIVIZED', 'BLACK_LISTED');

-- CreateEnum
CREATE TYPE "PrismaTokenTypeOption" AS ENUM ('WHITE_LISTED', 'BPT', 'PHANTOM_BPT', 'LINEAR_WRAPPED_TOKEN');

-- DropIndex
DROP INDEX "PrismaTokenPrice_tokenAddress_timestamp_key";

-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "coingeckoContractAddress" TEXT,
ADD COLUMN     "coingeckoPlatformId" TEXT,
ADD COLUMN     "decimals" INTEGER NOT NULL,
ADD COLUMN     "logoURI" TEXT;

-- AlterTable
ALTER TABLE "PrismaTokenPrice" ADD COLUMN     "close" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coingecko" BOOLEAN,
ADD COLUMN     "high" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "low" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "open" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "price",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD CONSTRAINT "PrismaTokenPrice_pkey" PRIMARY KEY ("tokenAddress", "timestamp");

-- CreateTable
CREATE TABLE "PrismaLastBlockSynced" (
    "category" "PrismaLastBlockSyncedCategory" NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "PrismaLastBlockSynced_pkey" PRIMARY KEY ("category")
);

-- CreateTable
CREATE TABLE "PrismaPool" (
    "id" TEXT NOT NULL,
    "createTime" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PrismaPoolType" NOT NULL,
    "owner" TEXT NOT NULL,
    "factory" TEXT,

    CONSTRAINT "PrismaPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolLinearData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "mainIndex" INTEGER NOT NULL,
    "wrappedIndex" INTEGER NOT NULL,

    CONSTRAINT "PrismaPoolLinearData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolElementData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "unitSeconds" TEXT NOT NULL,
    "principalToken" TEXT NOT NULL,
    "baseToken" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolElementData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolDynamicData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "swapFee" TEXT NOT NULL,
    "swapEnabled" BOOLEAN NOT NULL,
    "totalShares" TEXT NOT NULL,
    "totalLiquidity" DOUBLE PRECISION NOT NULL,
    "volume24h" DOUBLE PRECISION NOT NULL,
    "fees24h" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PrismaPoolDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolStableDynamicData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amp" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStableDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolLinearDynamicData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lowerTarget" TEXT NOT NULL,
    "upperTarget" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolLinearDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolToken" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "nestedPoolId" TEXT,

    CONSTRAINT "PrismaPoolToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolTokenDynamicData" (
    "id" TEXT NOT NULL,
    "poolTokenId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "balance" TEXT NOT NULL,
    "balanceUSD" DOUBLE PRECISION NOT NULL,
    "weight" TEXT,
    "priceRate" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolTokenDynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolSwap" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "PrismaPoolAprItem" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "isSwapApr" BOOLEAN,
    "isNativeRewardApr" BOOLEAN,
    "isThirdPartyApr" BOOLEAN,
    "parentItemId" TEXT,

    CONSTRAINT "PrismaPoolAprItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolCategory" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "category" "PrismaPoolCategoryType" NOT NULL,

    CONSTRAINT "PrismaPoolCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaTokenType" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "type" "PrismaTokenTypeOption" NOT NULL,

    CONSTRAINT "PrismaTokenType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPool_address_key" ON "PrismaPool"("address");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolLinearData_poolId_key" ON "PrismaPoolLinearData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolElementData_poolId_key" ON "PrismaPoolElementData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolDynamicData_poolId_key" ON "PrismaPoolDynamicData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStableDynamicData_poolId_key" ON "PrismaPoolStableDynamicData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolLinearDynamicData_poolId_key" ON "PrismaPoolLinearDynamicData"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolTokenDynamicData_poolTokenId_key" ON "PrismaPoolTokenDynamicData"("poolTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaTokenType_tokenAddress_type_key" ON "PrismaTokenType"("tokenAddress", "type");

-- AddForeignKey
ALTER TABLE "PrismaPoolLinearData" ADD CONSTRAINT "PrismaPoolLinearData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolElementData" ADD CONSTRAINT "PrismaPoolElementData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolDynamicData" ADD CONSTRAINT "PrismaPoolDynamicData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStableDynamicData" ADD CONSTRAINT "PrismaPoolStableDynamicData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolLinearDynamicData" ADD CONSTRAINT "PrismaPoolLinearDynamicData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_nestedPoolId_fkey" FOREIGN KEY ("nestedPoolId") REFERENCES "PrismaPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolTokenDynamicData" ADD CONSTRAINT "PrismaPoolTokenDynamicData_poolTokenId_fkey" FOREIGN KEY ("poolTokenId") REFERENCES "PrismaPoolToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolSwap" ADD CONSTRAINT "PrismaPoolSwap_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolAprItem" ADD CONSTRAINT "PrismaPoolAprItem_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolAprItem" ADD CONSTRAINT "PrismaPoolAprItem_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "PrismaPoolAprItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolCategory" ADD CONSTRAINT "PrismaPoolCategory_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenType" ADD CONSTRAINT "PrismaTokenType_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "PrismaToken"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
