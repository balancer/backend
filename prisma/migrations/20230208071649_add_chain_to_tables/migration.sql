/*
  Warnings:

  - The primary key for the `PrismaLastBlockSynced` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPool` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolAprItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolAprRange` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolBatchSwap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolDynamicData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolElementData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolExpandedTokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolFilter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolFilterMap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolLinearData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolLinearDynamicData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolSnapshot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolStableDynamicData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolStaking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolStakingGauge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolStakingGaugeReward` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolStakingMasterChefFarm` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolStakingMasterChefFarmRewarder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolStakingReliquaryFarm` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolStakingReliquaryFarmLevel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolSwap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaPoolTokenDynamicData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaReliquaryFarmSnapshot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaReliquaryLevelSnapshot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaReliquaryTokenBalanceSnapshot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaTokenCurrentPrice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaTokenDynamicData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaTokenPrice` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaTokenType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaUserBalanceSyncStatus` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaUserPoolBalanceSnapshot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaUserRelicSnapshot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaUserStakedBalance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PrismaUserWalletBalance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[address,chain]` on the table `PrismaPool` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aprItemId,chain]` on the table `PrismaPoolAprRange` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poolId,chain]` on the table `PrismaPoolDynamicData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poolId,chain]` on the table `PrismaPoolElementData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poolId,chain]` on the table `PrismaPoolLinearData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poolId,chain]` on the table `PrismaPoolLinearDynamicData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poolId,chain]` on the table `PrismaPoolStableDynamicData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poolId,chain]` on the table `PrismaPoolStaking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stakingId,chain]` on the table `PrismaPoolStakingGauge` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stakingId,chain]` on the table `PrismaPoolStakingMasterChefFarm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stakingId,chain]` on the table `PrismaPoolStakingReliquaryFarm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poolTokenId,chain]` on the table `PrismaPoolTokenDynamicData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenAddress,type,chain]` on the table `PrismaTokenType` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chain` to the `PrismaPoolDynamicData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chain` to the `PrismaPoolStakingReliquaryFarm` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('MAINNET', 'POLYGON', 'ARBITRUM', 'FANTOM', 'OPTIMISM');

-- DropForeignKey
ALTER TABLE "PrismaPoolAprItem" DROP CONSTRAINT "PrismaPoolAprItem_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolAprRange" DROP CONSTRAINT "PrismaPoolAprRange_aprItemId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolCategory" DROP CONSTRAINT "PrismaPoolCategory_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolDynamicData" DROP CONSTRAINT "PrismaPoolDynamicData_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolElementData" DROP CONSTRAINT "PrismaPoolElementData_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" DROP CONSTRAINT "PrismaPoolExpandedTokens_nestedPoolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" DROP CONSTRAINT "PrismaPoolExpandedTokens_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" DROP CONSTRAINT "PrismaPoolExpandedTokens_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolFilterMap" DROP CONSTRAINT "PrismaPoolFilterMap_filterId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolFilterMap" DROP CONSTRAINT "PrismaPoolFilterMap_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolLinearData" DROP CONSTRAINT "PrismaPoolLinearData_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolLinearDynamicData" DROP CONSTRAINT "PrismaPoolLinearDynamicData_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolSnapshot" DROP CONSTRAINT "PrismaPoolSnapshot_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStableDynamicData" DROP CONSTRAINT "PrismaPoolStableDynamicData_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStaking" DROP CONSTRAINT "PrismaPoolStaking_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStakingGauge" DROP CONSTRAINT "PrismaPoolStakingGauge_stakingId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStakingGaugeReward" DROP CONSTRAINT "PrismaPoolStakingGaugeReward_gaugeId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStakingMasterChefFarm" DROP CONSTRAINT "PrismaPoolStakingMasterChefFarm_stakingId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStakingMasterChefFarmRewarder" DROP CONSTRAINT "PrismaPoolStakingMasterChefFarmRewarder_farmId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStakingReliquaryFarm" DROP CONSTRAINT "PrismaPoolStakingReliquaryFarm_stakingId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStakingReliquaryFarmLevel" DROP CONSTRAINT "PrismaPoolStakingReliquaryFarmLevel_farmId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolSwap" DROP CONSTRAINT "PrismaPoolSwap_batchSwapId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolSwap" DROP CONSTRAINT "PrismaPoolSwap_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolToken" DROP CONSTRAINT "PrismaPoolToken_address_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolToken" DROP CONSTRAINT "PrismaPoolToken_nestedPoolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolToken" DROP CONSTRAINT "PrismaPoolToken_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolTokenDynamicData" DROP CONSTRAINT "PrismaPoolTokenDynamicData_poolTokenId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaReliquaryFarmSnapshot" DROP CONSTRAINT "PrismaReliquaryFarmSnapshot_farmId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaReliquaryLevelSnapshot" DROP CONSTRAINT "PrismaReliquaryLevelSnapshot_farmSnapshotId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaReliquaryTokenBalanceSnapshot" DROP CONSTRAINT "PrismaReliquaryTokenBalanceSnapshot_farmSnapshotId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenCurrentPrice" DROP CONSTRAINT "PrismaTokenCurrentPrice_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenDynamicData" DROP CONSTRAINT "PrismaTokenDynamicData_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenPrice" DROP CONSTRAINT "PrismaTokenPrice_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenType" DROP CONSTRAINT "PrismaTokenType_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserPoolBalanceSnapshot" DROP CONSTRAINT "PrismaUserPoolBalanceSnapshot_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserRelicSnapshot" DROP CONSTRAINT "PrismaUserRelicSnapshot_farmId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserStakedBalance" DROP CONSTRAINT "PrismaUserStakedBalance_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserStakedBalance" DROP CONSTRAINT "PrismaUserStakedBalance_stakingId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserStakedBalance" DROP CONSTRAINT "PrismaUserStakedBalance_tokenAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserWalletBalance" DROP CONSTRAINT "PrismaUserWalletBalance_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserWalletBalance" DROP CONSTRAINT "PrismaUserWalletBalance_tokenAddress_fkey";

-- DropIndex
DROP INDEX "PrismaPool_address_key";

-- DropIndex
DROP INDEX "PrismaPoolAprRange_aprItemId_key";

-- DropIndex
DROP INDEX "PrismaPoolDynamicData_poolId_key";

-- DropIndex
DROP INDEX "PrismaPoolElementData_poolId_key";

-- DropIndex
DROP INDEX "PrismaPoolLinearData_poolId_key";

-- DropIndex
DROP INDEX "PrismaPoolLinearDynamicData_poolId_key";

-- DropIndex
DROP INDEX "PrismaPoolStableDynamicData_poolId_key";

-- DropIndex
DROP INDEX "PrismaPoolStaking_poolId_key";

-- DropIndex
DROP INDEX "PrismaPoolStakingGauge_stakingId_key";

-- DropIndex
DROP INDEX "PrismaPoolStakingMasterChefFarm_stakingId_key";

-- DropIndex
DROP INDEX "PrismaPoolStakingReliquaryFarm_stakingId_key";

-- DropIndex
DROP INDEX "PrismaPoolTokenDynamicData_poolTokenId_key";

-- DropIndex
DROP INDEX "PrismaTokenType_tokenAddress_type_key";

-- AlterTable
ALTER TABLE "PrismaLastBlockSynced" DROP CONSTRAINT "PrismaLastBlockSynced_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaLastBlockSynced_pkey" PRIMARY KEY ("category", "chain");

-- AlterTable
ALTER TABLE "PrismaPool" DROP CONSTRAINT "PrismaPool_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPool_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolAprItem" DROP CONSTRAINT "PrismaPoolAprItem_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolAprItem_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolAprRange" DROP CONSTRAINT "PrismaPoolAprRange_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolAprRange_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolBatchSwap" DROP CONSTRAINT "PrismaPoolBatchSwap_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolBatchSwap_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolCategory" DROP CONSTRAINT "PrismaPoolCategory_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolCategory_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" DROP CONSTRAINT "PrismaPoolDynamicData_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL,
ADD CONSTRAINT "PrismaPoolDynamicData_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolElementData" DROP CONSTRAINT "PrismaPoolElementData_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolElementData_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolExpandedTokens" DROP CONSTRAINT "PrismaPoolExpandedTokens_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolExpandedTokens_pkey" PRIMARY KEY ("tokenAddress", "poolId", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolFilter" DROP CONSTRAINT "PrismaPoolFilter_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolFilter_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolFilterMap" DROP CONSTRAINT "PrismaPoolFilterMap_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolFilterMap_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolLinearData" DROP CONSTRAINT "PrismaPoolLinearData_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolLinearData_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolLinearDynamicData" DROP CONSTRAINT "PrismaPoolLinearDynamicData_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolLinearDynamicData_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolSnapshot" DROP CONSTRAINT "PrismaPoolSnapshot_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolSnapshot_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolStableDynamicData" DROP CONSTRAINT "PrismaPoolStableDynamicData_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolStableDynamicData_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolStaking" DROP CONSTRAINT "PrismaPoolStaking_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolStaking_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolStakingGauge" DROP CONSTRAINT "PrismaPoolStakingGauge_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolStakingGauge_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolStakingGaugeReward" DROP CONSTRAINT "PrismaPoolStakingGaugeReward_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolStakingGaugeReward_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolStakingMasterChefFarm" DROP CONSTRAINT "PrismaPoolStakingMasterChefFarm_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolStakingMasterChefFarm_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolStakingMasterChefFarmRewarder" DROP CONSTRAINT "PrismaPoolStakingMasterChefFarmRewarder_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolStakingMasterChefFarmRewarder_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolStakingReliquaryFarm" DROP CONSTRAINT "PrismaPoolStakingReliquaryFarm_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL,
ADD CONSTRAINT "PrismaPoolStakingReliquaryFarm_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolStakingReliquaryFarmLevel" DROP CONSTRAINT "PrismaPoolStakingReliquaryFarmLevel_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolStakingReliquaryFarmLevel_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolSwap" DROP CONSTRAINT "PrismaPoolSwap_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolSwap_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolToken" DROP CONSTRAINT "PrismaPoolToken_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolToken_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaPoolTokenDynamicData" DROP CONSTRAINT "PrismaPoolTokenDynamicData_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaPoolTokenDynamicData_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaReliquaryFarmSnapshot" DROP CONSTRAINT "PrismaReliquaryFarmSnapshot_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaReliquaryFarmSnapshot_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaReliquaryLevelSnapshot" DROP CONSTRAINT "PrismaReliquaryLevelSnapshot_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaReliquaryLevelSnapshot_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaReliquaryTokenBalanceSnapshot" DROP CONSTRAINT "PrismaReliquaryTokenBalanceSnapshot_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaReliquaryTokenBalanceSnapshot_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaToken" DROP CONSTRAINT "PrismaToken_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaToken_pkey" PRIMARY KEY ("address", "chain");

-- AlterTable
ALTER TABLE "PrismaTokenCurrentPrice" DROP CONSTRAINT "PrismaTokenCurrentPrice_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaTokenCurrentPrice_pkey" PRIMARY KEY ("tokenAddress", "chain");

-- AlterTable
ALTER TABLE "PrismaTokenDynamicData" DROP CONSTRAINT "PrismaTokenDynamicData_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaTokenDynamicData_pkey" PRIMARY KEY ("tokenAddress", "chain");

-- AlterTable
ALTER TABLE "PrismaTokenPrice" DROP CONSTRAINT "PrismaTokenPrice_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaTokenPrice_pkey" PRIMARY KEY ("tokenAddress", "timestamp", "chain");

-- AlterTable
ALTER TABLE "PrismaTokenType" DROP CONSTRAINT "PrismaTokenType_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaTokenType_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaUserBalanceSyncStatus" DROP CONSTRAINT "PrismaUserBalanceSyncStatus_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaUserBalanceSyncStatus_pkey" PRIMARY KEY ("type", "chain");

-- AlterTable
ALTER TABLE "PrismaUserPoolBalanceSnapshot" DROP CONSTRAINT "PrismaUserPoolBalanceSnapshot_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaUserPoolBalanceSnapshot_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaUserRelicSnapshot" DROP CONSTRAINT "PrismaUserRelicSnapshot_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaUserRelicSnapshot_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaUserStakedBalance" DROP CONSTRAINT "PrismaUserStakedBalance_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaUserStakedBalance_pkey" PRIMARY KEY ("id", "chain");

-- AlterTable
ALTER TABLE "PrismaUserWalletBalance" DROP CONSTRAINT "PrismaUserWalletBalance_pkey",
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT E'MAINNET',
ADD CONSTRAINT "PrismaUserWalletBalance_pkey" PRIMARY KEY ("id", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPool_address_chain_key" ON "PrismaPool"("address", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolAprRange_aprItemId_chain_key" ON "PrismaPoolAprRange"("aprItemId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolDynamicData_poolId_chain_key" ON "PrismaPoolDynamicData"("poolId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolElementData_poolId_chain_key" ON "PrismaPoolElementData"("poolId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolLinearData_poolId_chain_key" ON "PrismaPoolLinearData"("poolId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolLinearDynamicData_poolId_chain_key" ON "PrismaPoolLinearDynamicData"("poolId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStableDynamicData_poolId_chain_key" ON "PrismaPoolStableDynamicData"("poolId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStaking_poolId_chain_key" ON "PrismaPoolStaking"("poolId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStakingGauge_stakingId_chain_key" ON "PrismaPoolStakingGauge"("stakingId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStakingMasterChefFarm_stakingId_chain_key" ON "PrismaPoolStakingMasterChefFarm"("stakingId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStakingReliquaryFarm_stakingId_chain_key" ON "PrismaPoolStakingReliquaryFarm"("stakingId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolTokenDynamicData_poolTokenId_chain_key" ON "PrismaPoolTokenDynamicData"("poolTokenId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "PrismaTokenType_tokenAddress_type_chain_key" ON "PrismaTokenType"("tokenAddress", "type", "chain");

-- AddForeignKey
ALTER TABLE "PrismaPoolLinearData" ADD CONSTRAINT "PrismaPoolLinearData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolElementData" ADD CONSTRAINT "PrismaPoolElementData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolDynamicData" ADD CONSTRAINT "PrismaPoolDynamicData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStableDynamicData" ADD CONSTRAINT "PrismaPoolStableDynamicData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolLinearDynamicData" ADD CONSTRAINT "PrismaPoolLinearDynamicData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_address_chain_fkey" FOREIGN KEY ("address", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_nestedPoolId_chain_fkey" FOREIGN KEY ("nestedPoolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolTokenDynamicData" ADD CONSTRAINT "PrismaPoolTokenDynamicData_poolTokenId_chain_fkey" FOREIGN KEY ("poolTokenId", "chain") REFERENCES "PrismaPoolToken"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolSwap" ADD CONSTRAINT "PrismaPoolSwap_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolSwap" ADD CONSTRAINT "PrismaPoolSwap_batchSwapId_chain_fkey" FOREIGN KEY ("batchSwapId", "chain") REFERENCES "PrismaPoolBatchSwap"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolAprItem" ADD CONSTRAINT "PrismaPoolAprItem_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolAprRange" ADD CONSTRAINT "PrismaPoolAprRange_aprItemId_chain_fkey" FOREIGN KEY ("aprItemId", "chain") REFERENCES "PrismaPoolAprItem"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolCategory" ADD CONSTRAINT "PrismaPoolCategory_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" ADD CONSTRAINT "PrismaPoolExpandedTokens_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" ADD CONSTRAINT "PrismaPoolExpandedTokens_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" ADD CONSTRAINT "PrismaPoolExpandedTokens_nestedPoolId_chain_fkey" FOREIGN KEY ("nestedPoolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolFilterMap" ADD CONSTRAINT "PrismaPoolFilterMap_filterId_chain_fkey" FOREIGN KEY ("filterId", "chain") REFERENCES "PrismaPoolFilter"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolFilterMap" ADD CONSTRAINT "PrismaPoolFilterMap_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStaking" ADD CONSTRAINT "PrismaPoolStaking_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingMasterChefFarm" ADD CONSTRAINT "PrismaPoolStakingMasterChefFarm_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStaking"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingMasterChefFarmRewarder" ADD CONSTRAINT "PrismaPoolStakingMasterChefFarmRewarder_farmId_chain_fkey" FOREIGN KEY ("farmId", "chain") REFERENCES "PrismaPoolStakingMasterChefFarm"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingGauge" ADD CONSTRAINT "PrismaPoolStakingGauge_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStaking"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingGaugeReward" ADD CONSTRAINT "PrismaPoolStakingGaugeReward_gaugeId_chain_fkey" FOREIGN KEY ("gaugeId", "chain") REFERENCES "PrismaPoolStakingGauge"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingReliquaryFarm" ADD CONSTRAINT "PrismaPoolStakingReliquaryFarm_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStaking"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingReliquaryFarmLevel" ADD CONSTRAINT "PrismaPoolStakingReliquaryFarmLevel_farmId_chain_fkey" FOREIGN KEY ("farmId", "chain") REFERENCES "PrismaPoolStakingReliquaryFarm"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolSnapshot" ADD CONSTRAINT "PrismaPoolSnapshot_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaReliquaryFarmSnapshot" ADD CONSTRAINT "PrismaReliquaryFarmSnapshot_farmId_chain_fkey" FOREIGN KEY ("farmId", "chain") REFERENCES "PrismaPoolStakingReliquaryFarm"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaReliquaryLevelSnapshot" ADD CONSTRAINT "PrismaReliquaryLevelSnapshot_farmSnapshotId_chain_fkey" FOREIGN KEY ("farmSnapshotId", "chain") REFERENCES "PrismaReliquaryFarmSnapshot"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaReliquaryTokenBalanceSnapshot" ADD CONSTRAINT "PrismaReliquaryTokenBalanceSnapshot_farmSnapshotId_chain_fkey" FOREIGN KEY ("farmSnapshotId", "chain") REFERENCES "PrismaReliquaryFarmSnapshot"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenCurrentPrice" ADD CONSTRAINT "PrismaTokenCurrentPrice_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenPrice" ADD CONSTRAINT "PrismaTokenPrice_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenDynamicData" ADD CONSTRAINT "PrismaTokenDynamicData_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenType" ADD CONSTRAINT "PrismaTokenType_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStaking"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserPoolBalanceSnapshot" ADD CONSTRAINT "PrismaUserPoolBalanceSnapshot_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserRelicSnapshot" ADD CONSTRAINT "PrismaUserRelicSnapshot_farmId_chain_fkey" FOREIGN KEY ("farmId", "chain") REFERENCES "PrismaPoolStakingReliquaryFarm"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;
