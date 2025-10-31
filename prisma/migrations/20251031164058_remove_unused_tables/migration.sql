/*
  Warnings:

  - You are about to drop the column `amounts` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `dailyProtocolSwapFees` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `dailyProtocolYieldFees` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `dailySurpluses` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `dailySwapFees` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `dailyVolumes` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `holdersCount` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalProtocolSwapFees` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalProtocolYieldFees` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalSurplus` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalSurpluses` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalSwapFee` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalSwapFees` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalSwapVolume` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalVolumes` on the `PrismaPoolSnapshot` table. All the data in the column will be lost.
  - You are about to drop the `PrismaReliquaryTokenBalanceSnapshot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrismaReliquaryTokenBalanceSnapshot" DROP CONSTRAINT "PrismaReliquaryTokenBalanceSnapshot_farmSnapshotId_chain_fkey";

-- AlterTable
ALTER TABLE "PrismaPoolSnapshot" DROP COLUMN "amounts",
DROP COLUMN "dailyProtocolSwapFees",
DROP COLUMN "dailyProtocolYieldFees",
DROP COLUMN "dailySurpluses",
DROP COLUMN "dailySwapFees",
DROP COLUMN "dailyVolumes",
DROP COLUMN "holdersCount",
DROP COLUMN "totalProtocolSwapFees",
DROP COLUMN "totalProtocolYieldFees",
DROP COLUMN "totalSurplus",
DROP COLUMN "totalSurpluses",
DROP COLUMN "totalSwapFee",
DROP COLUMN "totalSwapFees",
DROP COLUMN "totalSwapVolume",
DROP COLUMN "totalVolumes";

-- DropTable
DROP TABLE "PrismaReliquaryTokenBalanceSnapshot";
