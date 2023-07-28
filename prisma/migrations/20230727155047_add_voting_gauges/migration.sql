/*
  Warnings:

  - You are about to drop the `PrismaLge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaLgePriceData` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PrismaVotingGaugeStatus" AS ENUM ('KILLED', 'ACTIVE');

-- DropForeignKey
ALTER TABLE "PrismaLgePriceData" DROP CONSTRAINT "PrismaLgePriceData_id_chain_fkey";

-- DropTable
DROP TABLE "PrismaLge";

-- DropTable
DROP TABLE "PrismaLgePriceData";

-- CreateTable
CREATE TABLE "PrismaVotingGauge" (
    "id" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "status" "PrismaVotingGaugeStatus" NOT NULL DEFAULT 'ACTIVE',
    "gaugeAddress" TEXT NOT NULL,
    "stakingGaugeId" TEXT,
    "relativeWeight" TEXT,
    "relativeWeightCap" TEXT,
    "addedTimestamp" INTEGER,

    CONSTRAINT "PrismaVotingGauge_pkey" PRIMARY KEY ("id","chain")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaVotingGauge_stakingGaugeId_chain_key" ON "PrismaVotingGauge"("stakingGaugeId", "chain");

-- AddForeignKey
ALTER TABLE "PrismaVotingGauge" ADD CONSTRAINT "PrismaVotingGauge_stakingGaugeId_chain_fkey" FOREIGN KEY ("stakingGaugeId", "chain") REFERENCES "PrismaPoolStakingGauge"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;
