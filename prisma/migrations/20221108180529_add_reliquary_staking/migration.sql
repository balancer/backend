-- AlterEnum
ALTER TYPE "PrismaPoolStakingType" ADD VALUE 'RELIQUARY';

-- AlterEnum
ALTER TYPE "PrismaUserBalanceType" ADD VALUE 'RELIQUARY';

-- CreateTable
CREATE TABLE "PrismaPoolStakingReliquaryFarm" (
    "id" TEXT NOT NULL,
    "stakingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "beetsPerSecond" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStakingReliquaryFarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolStakingReliquaryFarmLevel" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "balance" TEXT NOT NULL,
    "requiredMaturity" INTEGER NOT NULL,
    "allocationPoints" INTEGER NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PrismaPoolStakingReliquaryFarmLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStakingReliquaryFarm_stakingId_key" ON "PrismaPoolStakingReliquaryFarm"("stakingId");

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingReliquaryFarm" ADD CONSTRAINT "PrismaPoolStakingReliquaryFarm_stakingId_fkey" FOREIGN KEY ("stakingId") REFERENCES "PrismaPoolStaking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingReliquaryFarmLevel" ADD CONSTRAINT "PrismaPoolStakingReliquaryFarmLevel_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "PrismaPoolStakingReliquaryFarm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
