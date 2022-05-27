-- AlterTable
ALTER TABLE "PrismaPoolStaking" ADD COLUMN     "rewarder" TEXT;

-- CreateTable
CREATE TABLE "PrismaPoolStakingMasterChefFarm" (
    "id" TEXT NOT NULL,
    "stakingId" TEXT NOT NULL,
    "beetsPerBlock" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStakingMasterChefFarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolStakingMasterChefFarmRewarder" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "rewardPerSecond" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStakingMasterChefFarmRewarder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStakingMasterChefFarm_stakingId_key" ON "PrismaPoolStakingMasterChefFarm"("stakingId");

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingMasterChefFarm" ADD CONSTRAINT "PrismaPoolStakingMasterChefFarm_stakingId_fkey" FOREIGN KEY ("stakingId") REFERENCES "PrismaPoolStaking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingMasterChefFarmRewarder" ADD CONSTRAINT "PrismaPoolStakingMasterChefFarmRewarder_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "PrismaPoolStakingMasterChefFarm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
