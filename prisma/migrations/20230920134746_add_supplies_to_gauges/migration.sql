-- AlterTable
ALTER TABLE "PrismaPoolStakingGauge" ADD COLUMN     "totalSupply" TEXT NOT NULL DEFAULT '0.0',
ADD COLUMN     "workingSupply" TEXT NOT NULL DEFAULT '0.0';
