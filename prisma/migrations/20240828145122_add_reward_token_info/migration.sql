-- AlterTable
ALTER TABLE "PrismaPoolAprItem" ADD COLUMN     "rewardTokenAddress" TEXT,
ADD COLUMN     "rewardTokenSymbol" TEXT;

-- AlterTable
ALTER TABLE "PrismaPoolStakingGaugeReward" ADD COLUMN     "isVeBalemissions" BOOLEAN NOT NULL DEFAULT false;
