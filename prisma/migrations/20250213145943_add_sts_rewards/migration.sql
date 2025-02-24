-- AlterTable
ALTER TABLE "PrismaSonicStakingDataSnapshot" ADD COLUMN     "rewardsClaimed24h" TEXT NOT NULL DEFAULT '0';

-- AlterTable
ALTER TABLE "PrismaStakedSonicData" ADD COLUMN     "rewardsClaimed24h" TEXT NOT NULL DEFAULT '0';
