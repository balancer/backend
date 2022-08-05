/*
  Warnings:

  - You are about to drop the `PrismaBalancerPool` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaBalancerPoolShareSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaBalancerPoolSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaBalancerPoolTokenSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaBeetsBarSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaBeetsBarUserSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaBlock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaFarm` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaFarmUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaFarmUserSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaTokenData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolShareSnapshot" DROP CONSTRAINT "PrismaBalancerPoolShareSnapshot_blockNumber_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolShareSnapshot" DROP CONSTRAINT "PrismaBalancerPoolShareSnapshot_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolShareSnapshot" DROP CONSTRAINT "PrismaBalancerPoolShareSnapshot_poolSnapshotId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolShareSnapshot" DROP CONSTRAINT "PrismaBalancerPoolShareSnapshot_userAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolSnapshot" DROP CONSTRAINT "PrismaBalancerPoolSnapshot_blockNumber_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolSnapshot" DROP CONSTRAINT "PrismaBalancerPoolSnapshot_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolTokenSnapshot" DROP CONSTRAINT "PrismaBalancerPoolTokenSnapshot_address_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolTokenSnapshot" DROP CONSTRAINT "PrismaBalancerPoolTokenSnapshot_blockNumber_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolTokenSnapshot" DROP CONSTRAINT "PrismaBalancerPoolTokenSnapshot_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBalancerPoolTokenSnapshot" DROP CONSTRAINT "PrismaBalancerPoolTokenSnapshot_snapshotId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBeetsBarSnapshot" DROP CONSTRAINT "PrismaBeetsBarSnapshot_blockNumber_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBeetsBarUserSnapshot" DROP CONSTRAINT "PrismaBeetsBarUserSnapshot_address_fkey";

-- DropForeignKey
ALTER TABLE "PrismaBeetsBarUserSnapshot" DROP CONSTRAINT "PrismaBeetsBarUserSnapshot_blockNumber_fkey";

-- DropForeignKey
ALTER TABLE "PrismaFarm" DROP CONSTRAINT "PrismaFarm_poolId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaFarmUser" DROP CONSTRAINT "PrismaFarmUser_farmId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaFarmUser" DROP CONSTRAINT "PrismaFarmUser_userAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaFarmUserSnapshot" DROP CONSTRAINT "PrismaFarmUserSnapshot_blockNumber_fkey";

-- DropForeignKey
ALTER TABLE "PrismaFarmUserSnapshot" DROP CONSTRAINT "PrismaFarmUserSnapshot_farmId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaFarmUserSnapshot" DROP CONSTRAINT "PrismaFarmUserSnapshot_farmUserId_fkey";

-- DropForeignKey
ALTER TABLE "PrismaFarmUserSnapshot" DROP CONSTRAINT "PrismaFarmUserSnapshot_userAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenData" DROP CONSTRAINT "PrismaTokenData_tokenAddress_fkey";

-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "description" TEXT,
ADD COLUMN     "discordUrl" TEXT,
ADD COLUMN     "telegramUrl" TEXT,
ADD COLUMN     "twitterUsername" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

-- DropTable
DROP TABLE "PrismaBalancerPool";

-- DropTable
DROP TABLE "PrismaBalancerPoolShareSnapshot";

-- DropTable
DROP TABLE "PrismaBalancerPoolSnapshot";

-- DropTable
DROP TABLE "PrismaBalancerPoolTokenSnapshot";

-- DropTable
DROP TABLE "PrismaBeetsBarSnapshot";

-- DropTable
DROP TABLE "PrismaBeetsBarUserSnapshot";

-- DropTable
DROP TABLE "PrismaBlock";

-- DropTable
DROP TABLE "PrismaFarm";

-- DropTable
DROP TABLE "PrismaFarmUser";

-- DropTable
DROP TABLE "PrismaFarmUserSnapshot";

-- DropTable
DROP TABLE "PrismaTokenData";
