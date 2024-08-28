-- AlterTable
ALTER TABLE "PrismaPoolAprItem" ADD COLUMN     "rewardTokenAddress" TEXT,
ADD COLUMN     "rewardTokenSymbol" TEXT;

-- AlterTable
ALTER TABLE "PrismaPoolStakingGaugeReward" ADD COLUMN     "isDirectRewardToken" BOOLEAN NOT NULL DEFAULT false;
