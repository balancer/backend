-- AlterTable
ALTER TABLE "PrismaPoolStakingReliquaryFarm" ADD COLUMN     "totalBalance" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "totalWeightedBalance" TEXT NOT NULL DEFAULT '0';
