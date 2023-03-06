-- CreateEnum
CREATE TYPE "PrismaPoolStakingGaugeStatus" AS ENUM ('KILLED', 'ACTIVE', 'PREFERRED');

-- DropIndex
DROP INDEX "PrismaPoolStaking_poolId_chain_key";

-- AlterTable
ALTER TABLE "PrismaPoolStakingGauge" ADD COLUMN     "status" "PrismaPoolStakingGaugeStatus" NOT NULL DEFAULT 'ACTIVE';
